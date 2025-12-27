const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const getEnv = (key) => {
    const v = process.env[key];
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
};

const dbConfig = {
    user: getEnv('DB_USER'),
    host: getEnv('DB_HOST'),
    database: getEnv('DB_DATABASE'),
    password: getEnv('DB_PASSWORD'),
    port: (() => {
        const raw = getEnv('DB_PORT');
        if (!raw) return null;
        const n = Number.parseInt(raw, 10);
        return Number.isFinite(n) ? n : null;
    })(),
};

const hasDbConfig = !!(dbConfig.user && dbConfig.host && dbConfig.database && dbConfig.port);

const allowedOrigins = String(CLIENT_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes('*')) return true;
    if (allowedOrigins.includes(origin)) return true;
    // Dev-friendly: allow any localhost Vite port
    if (/^https?:\/\/localhost:\d+$/i.test(origin)) return true;
    if (/^https?:\/\/127\.0\.0\.1:\d+$/i.test(origin)) return true;
    return false;
};

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

const pool = hasDbConfig
    ? new Pool({
        user: dbConfig.user,
        host: dbConfig.host,
        database: dbConfig.database,
        password: dbConfig.password ?? '',
        port: dbConfig.port,
    })
    : null;

const initDb = async () => {
    try {
        if (!pool) {
            console.error(
                'Database initialization skipped: missing DB env vars. Create server/.env with DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT.'
            );
            return;
        }
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await pool.query(schema);
            console.log('Database initialized successfully');
        }
    } catch (err) {
        console.error('Database initialization failed:', err.message);
    }
};

initDb();

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: false,
    })
);
app.use(express.json({ limit: '1mb' }));

// Return JSON (not HTML) for invalid JSON bodies
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }
    return next(err);
});

const requireDb = (req, res, next) => {
    if (!pool) {
        return res.status(503).json({
            error: 'Database is not configured. Create server/.env and set DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT.',
        });
    }
    return next();
};

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(String(email || '').trim());
};

const isStrongPassword = (password) => {
    // Min 8 chars, 1 uppercase, 1 special char
    const re = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    return re.test(String(password || ''));
};

const parseIntSafe = (value, fallback = null) => {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
};

const computeDashboardStats = async () => {
    if (!pool) return { criticalEquipment: 0, technicianLoad: 0, openRequests: 0 };
    const criticalCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM equipment WHERE status IN ('Down','Critical')");
    const openRequestsRes = await pool.query("SELECT COUNT(*)::int AS count FROM maintenance_requests WHERE status NOT IN ('Repaired','Scrap')");
    const techCountRes = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'technician'");
    const openAssignedRes = await pool.query("SELECT COUNT(*)::int AS count FROM maintenance_requests WHERE status NOT IN ('Repaired','Scrap') AND assigned_technician_id IS NOT NULL");

    const criticalEquipment = criticalCountRes.rows[0]?.count ?? 0;
    const openRequests = openRequestsRes.rows[0]?.count ?? 0;
    const techCount = techCountRes.rows[0]?.count ?? 0;
    const openAssigned = openAssignedRes.rows[0]?.count ?? 0;
    const technicianLoad = techCount > 0 ? Math.min(100, Math.round((openAssigned / techCount) * 100)) : 0;

    return { criticalEquipment, technicianLoad, openRequests };
};

const emitDashboardStats = async () => {
    try {
        const stats = await computeDashboardStats();
        io.emit('dashboard_stats', stats);
    } catch (err) {
        console.error('Failed to emit dashboard_stats:', err.message);
    }
};

const authMiddleware = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid Authorization header' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const normalizeRole = (role) => {
    const r = String(role || '').trim().toLowerCase();
    // Backward compatibility: older signups used 'portal_user' meaning 'employee'.
    if (r === 'portal_user') return 'employee';
    if (r === 'admin' || r === 'technician' || r === 'employee') return r;
    return '';
};

const requireRole = (allowedRoles) => {
    const allowed = Array.isArray(allowedRoles) ? allowedRoles.map(normalizeRole).filter(Boolean) : [];
    return (req, res, next) => {
        const role = normalizeRole(req.user?.role);
        if (!role) return res.status(401).json({ error: 'Invalid token role' });
        if (allowed.length === 0) return next();
        if (!allowed.includes(role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    };
};

const getUserIdFromJwt = (req) => {
    const id = parseIntSafe(req.user?.sub);
    return id || null;
};

app.get('/', (req, res) => {
    res.send('Maintenance System API is running.');
});

// --- Auth (JWT exchange; suitable for MVP) ---
app.post('/api/auth/signup', async (req, res) => {
    if (!pool) {
        return res.status(503).json({
            error: 'Database not configured. Create server/.env and restart the server.',
        });
    }
    const { full_name, email, password } = req.body || {};
    const cleanName = String(full_name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName) return res.status(400).json({ error: 'Full name is required' });
    if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });
    if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must be 8+ chars with 1 uppercase and 1 special character' });

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(String(password), 10);
        const created = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'employee') RETURNING id, full_name, email, role",
            [cleanName, cleanEmail, passwordHash]
        );

        const createdRow = created.rows[0];
        const role = normalizeRole(createdRow.role);
        if (!role) return res.status(500).json({ error: 'Created user has unsupported role' });

        const user = { id: createdRow.id, full_name: createdRow.full_name, email: createdRow.email, role };
        const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    if (!pool) {
        return res.status(503).json({
            error: 'Database not configured. Create server/.env and restart the server.',
        });
    }
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    try {
        const result = await pool.query('SELECT id, full_name, email, role, password_hash FROM users WHERE email = $1', [cleanEmail]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const userRow = result.rows[0];
        const ok = await bcrypt.compare(String(password), userRow.password_hash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const role = normalizeRole(userRow.role);
        if (!role) return res.status(403).json({ error: 'User role is not supported. Contact admin.' });

        const user = { id: userRow.id, full_name: userRow.full_name, email: userRow.email, role };
        const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Users (for smart selects)
app.get('/api/users', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const role = String(req.query.role || '').trim();
    const q = String(req.query.q || '').trim();
    const params = [];

    let where = 'WHERE 1=1';
    if (role) {
        params.push(role);
        where += ` AND role = $${params.length}`;
    }
    if (q) {
        params.push(`%${q}%`);
        where += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    try {
        const result = await pool.query(`SELECT id, full_name, email, role, department, company FROM users ${where} ORDER BY full_name ASC`, params);
        const rows = result.rows.map((r) => ({
            ...r,
            role: normalizeRole(r.role) || String(r.role || '').trim().toLowerCase(),
        }));
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.patch('/api/users/:id/role', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const userId = parseIntSafe(req.params.id);
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });

    const nextRole = normalizeRole(req.body?.role);
    if (!nextRole) return res.status(400).json({ error: 'Invalid role' });

    try {
        const updated = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role, department, company',
            [nextRole, userId]
        );
        if (updated.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const row = updated.rows[0];
        const normalized = { ...row, role: normalizeRole(row.role) || row.role };
        return res.json(normalized);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Teams ---
app.get('/api/teams', authMiddleware, requireDb, requireRole(['admin', 'technician']), async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        const userId = getUserIdFromJwt(req);
        const params = [];

        let where = '';
        if (role === 'technician') {
            params.push(userId);
            where = `WHERE tm.user_id = $1 OR t.member_user_id = $1`;
        }

        const result = await pool.query(
            `SELECT
                t.id,
                t.name,
                t.company,
                t.created_at,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', u.id,
                            'full_name', u.full_name,
                            'email', u.email,
                            'role', u.role
                        )
                        ORDER BY u.full_name
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'::json
                ) AS members
             FROM teams t
             LEFT JOIN team_members tm ON tm.team_id = t.id
             LEFT JOIN users u ON u.id = tm.user_id
             ${where}
             GROUP BY t.id
             ORDER BY t.name ASC`,
            params
        );

        // Backward-compat: if older rows have member_user_id but no team_members entry yet,
        // attach that user as the only member in response.
                const legacy = await pool.query(
            `SELECT t.id AS team_id, u.id, u.full_name, u.email, u.role
             FROM teams t
             JOIN users u ON u.id = t.member_user_id
                         WHERE NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id)`
        );
        const legacyByTeam = new Map();
        for (const row of legacy.rows) legacyByTeam.set(row.team_id, row);

        const rows = (result.rows || []).map((t) => {
            const legacyMember = legacyByTeam.get(t.id);
            const members = Array.isArray(t.members) ? t.members : [];
            if (members.length === 0 && legacyMember) {
                return {
                    ...t,
                    members: [
                        {
                            id: legacyMember.id,
                            full_name: legacyMember.full_name,
                            email: legacyMember.email,
                            role: legacyMember.role,
                        },
                    ],
                };
            }
            return { ...t, members };
        });

        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Team picker options (safe for request creation)
app.get('/api/team-options', authMiddleware, requireDb, requireRole(['admin', 'technician', 'employee']), async (req, res) => {
    const role = normalizeRole(req.user?.role);
    const userId = getUserIdFromJwt(req);
    try {
        if (role === 'technician' && userId) {
            const result = await pool.query(
                `SELECT DISTINCT t.id, t.name
                 FROM teams t
                 LEFT JOIN team_members tm ON tm.team_id = t.id
                 WHERE tm.user_id = $1 OR t.member_user_id = $1
                 ORDER BY t.name ASC`,
                [userId]
            );
            return res.json(result.rows);
        }

        const result = await pool.query('SELECT id, name FROM teams ORDER BY name ASC');
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const { name, company, member_user_id } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanCompany = String(company || '').trim();
    const memberId = parseIntSafe(member_user_id);

    if (!cleanName) return res.status(400).json({ error: 'name is required' });
    if (!memberId) return res.status(400).json({ error: 'member_user_id is required' });

    try {
        // MVP assumption: member must be a technician
        const member = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [memberId, 'technician']);
        if (member.rows.length === 0) return res.status(400).json({ error: 'member_user_id must be a technician' });

        const created = await pool.query(
            'INSERT INTO teams (name, company, member_user_id) VALUES ($1, $2, $3) RETURNING id, name, company, member_user_id, created_at',
            [cleanName, cleanCompany || null, memberId]
        );

        // Ensure the initial member is in team_members so filtering works.
        try {
            await pool.query('INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [created.rows[0].id, memberId]);
        } catch {
            // Ignore; team creation should still succeed.
        }

        return res.status(201).json(created.rows[0]);
    } catch (err) {
        if (String(err.message || '').toLowerCase().includes('duplicate')) {
            return res.status(409).json({ error: 'Team name already exists' });
        }
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/teams/:id/members', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const teamId = parseIntSafe(req.params.id);
    const { user_id } = req.body || {};
    const userId = parseIntSafe(user_id);
    if (!teamId) return res.status(400).json({ error: 'Invalid team id' });
    if (!userId) return res.status(400).json({ error: 'user_id is required' });

    try {
        const team = await pool.query('SELECT id FROM teams WHERE id = $1', [teamId]);
        if (team.rows.length === 0) return res.status(404).json({ error: 'Team not found' });

        const tech = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [userId, 'technician']);
        if (tech.rows.length === 0) return res.status(400).json({ error: 'user_id must be a technician' });

        await pool.query(
            'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [teamId, userId]
        );
        return res.status(201).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams/:id/members/:userId', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const teamId = parseIntSafe(req.params.id);
    const userId = parseIntSafe(req.params.userId);
    if (!teamId) return res.status(400).json({ error: 'Invalid team id' });
    if (!userId) return res.status(400).json({ error: 'Invalid user id' });
    try {
        const deleted = await pool.query('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 RETURNING team_id, user_id', [teamId, userId]);
        if (deleted.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Dashboard ---
app.get('/api/dashboard', authMiddleware, requireDb, requireRole(['admin', 'technician']), async (req, res) => {
    try {
        const role = normalizeRole(req.user?.role);
        const userId = getUserIdFromJwt(req);

        if (role === 'technician' && userId) {
            const teamsRes = await pool.query(
                `SELECT DISTINCT t.name
                 FROM teams t
                 LEFT JOIN team_members tm ON tm.team_id = t.id
                 WHERE tm.user_id = $1 OR t.member_user_id = $1`,
                [userId]
            );
            const teamNames = teamsRes.rows.map((r) => r.name).filter(Boolean);

            const criticalRes = await pool.query(
                "SELECT COUNT(*)::int AS count FROM equipment WHERE technician_id = $1 AND status IN ('Down','Critical')",
                [userId]
            );

            const openTeamRes = await pool.query(
                `SELECT COUNT(*)::int AS count
                 FROM maintenance_requests
                 WHERE status NOT IN ('Repaired','Scrap')
                   AND (
                        assigned_technician_id = $1
                        OR ($2::text[] IS NOT NULL AND team_name = ANY($2::text[]))
                   )`,
                [userId, teamNames.length ? teamNames : null]
            );

            const openAssignedRes = await pool.query(
                `SELECT COUNT(*)::int AS count
                 FROM maintenance_requests
                 WHERE status NOT IN ('Repaired','Scrap')
                   AND assigned_technician_id = $1`,
                [userId]
            );

            const criticalEquipment = criticalRes.rows[0]?.count ?? 0;
            const openRequests = openTeamRes.rows[0]?.count ?? 0;
            const openAssigned = openAssignedRes.rows[0]?.count ?? 0;
            const technicianLoad = openRequests > 0 ? Math.min(100, Math.round((openAssigned / openRequests) * 100)) : 0;

            const activities = await pool.query(
                `SELECT
                    mr.id,
                    mr.status,
                    mr.maintenance_type,
                    mr.priority,
                    mr.created_at,
                    mr.maintenance_for,
                    mr.work_center,
                    mr.team_name,
                    e.name AS equipment_name,
                    u.full_name AS technician_name
                 FROM maintenance_requests mr
                 LEFT JOIN equipment e ON e.id = mr.equipment_id
                 LEFT JOIN users u ON u.id = mr.assigned_technician_id
                 WHERE mr.assigned_technician_id = $1
                    OR ($2::text[] IS NOT NULL AND mr.team_name = ANY($2::text[]))
                 ORDER BY mr.created_at DESC
                 LIMIT 10`,
                [userId, teamNames.length ? teamNames : null]
            );

            return res.json({ stats: { criticalEquipment, technicianLoad, openRequests }, activities: activities.rows });
        }

        const stats = await computeDashboardStats();
        const activities = await pool.query(
            `SELECT
                mr.id,
                mr.status,
                mr.maintenance_type,
                mr.priority,
                mr.created_at,
                mr.maintenance_for,
                mr.work_center,
                mr.team_name,
                e.name AS equipment_name,
                u.full_name AS technician_name
            FROM maintenance_requests mr
            LEFT JOIN equipment e ON e.id = mr.equipment_id
            LEFT JOIN users u ON u.id = mr.assigned_technician_id
            ORDER BY mr.created_at DESC
            LIMIT 10`
        );
        return res.json({ stats, activities: activities.rows });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Backward-compatible stats endpoint
app.get('/api/stats', authMiddleware, requireDb, requireRole(['admin', 'technician']), async (req, res) => {
    try {
        const stats = await computeDashboardStats();
        return res.json(stats);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Equipment CRUD ---
app.get('/api/equipment', authMiddleware, requireDb, requireRole(['admin', 'technician', 'employee']), async (req, res) => {
    const q = String(req.query.q || '').trim();
    const params = [];
    let where = 'WHERE 1=1';
    if (q) {
        params.push(`%${q}%`);
        where += ` AND (e.name ILIKE $${params.length} OR e.serial_number ILIKE $${params.length} OR COALESCE(e.category,'') ILIKE $${params.length} OR COALESCE(e.company,'') ILIKE $${params.length})`;
    }

    try {
        const result = await pool.query(
            `SELECT
                e.id,
                e.name,
                e.department,
                e.serial_number,
                e.category,
                e.company,
                e.status,
                e.employee_id,
                e.technician_id,
                emp.full_name AS employee_name,
                tech.full_name AS technician_name,
                e.created_at
            FROM equipment e
            LEFT JOIN users emp ON emp.id = e.employee_id
            LEFT JOIN users tech ON tech.id = e.technician_id
            ${where}
            ORDER BY e.id DESC`,
            params
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.get('/api/equipment/:id', authMiddleware, requireDb, requireRole(['admin', 'technician', 'employee']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    try {
        const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/equipment', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const { name, employee_id, department, serial_number, technician_id, category, company, status } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanSerial = String(serial_number || '').trim();
    if (!cleanName) return res.status(400).json({ error: 'Name is required' });
    if (!cleanSerial) return res.status(400).json({ error: 'Serial number is required' });
    const techId = parseIntSafe(technician_id);
    if (!techId) return res.status(400).json({ error: 'Technician is required' });

    try {
        const created = await pool.query(
            `INSERT INTO equipment (name, employee_id, department, serial_number, technician_id, category, company, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             RETURNING *`,
            [
                cleanName,
                employee_id ?? null,
                department ?? null,
                cleanSerial,
                techId,
                category ?? null,
                company ?? null,
                status ?? 'Active'
            ]
        );
        return res.status(201).json(created.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.put('/api/equipment/:id', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const { name, employee_id, department, serial_number, technician_id, category, company, status } = req.body || {};
    try {
        const updated = await pool.query(
            `UPDATE equipment SET
                name = COALESCE($1, name),
                employee_id = $2,
                department = COALESCE($3, department),
                serial_number = COALESCE($4, serial_number),
                technician_id = $5,
                category = COALESCE($6, category),
                company = COALESCE($7, company),
                status = COALESCE($8, status)
             WHERE id = $9
             RETURNING *`,
            [
                name ?? null,
                employee_id ?? null,
                department ?? null,
                serial_number ?? null,
                technician_id ?? null,
                category ?? null,
                company ?? null,
                status ?? null,
                id
            ]
        );
        if (updated.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(updated.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/api/equipment/:id', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    try {
        const deleted = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING id', [id]);
        if (deleted.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Maintenance Requests CRUD ---
app.get('/api/requests', authMiddleware, requireDb, requireRole(['admin', 'technician', 'employee']), async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const role = normalizeRole(req.user?.role);
    const userId = getUserIdFromJwt(req);

    const params = [];
    let where = 'WHERE 1=1';
    if (from && !Number.isNaN(from.getTime())) {
        params.push(from.toISOString());
        where += ` AND COALESCE(mr.scheduled_start, mr.scheduled_end, mr.created_at) >= $${params.length}`;
    }
    if (to && !Number.isNaN(to.getTime())) {
        params.push(to.toISOString());
        where += ` AND COALESCE(mr.scheduled_start, mr.scheduled_end, mr.created_at) <= $${params.length}`;
    }

    // Data-level RBAC
    if (role === 'employee' && userId) {
        params.push(userId);
        where += ` AND mr.requested_by_id = $${params.length}`;
    }

    try {
        if (role === 'technician' && userId) {
            const teamsRes = await pool.query(
                `SELECT DISTINCT t.name
                 FROM teams t
                 LEFT JOIN team_members tm ON tm.team_id = t.id
                 WHERE tm.user_id = $1 OR t.member_user_id = $1`,
                [userId]
            );
            const teamNames = teamsRes.rows.map((r) => r.name).filter(Boolean);

            if (teamNames.length) {
                params.push(teamNames);
                const teamParamIdx = params.length;
                params.push(userId);
                const userParamIdx = params.length;
                where += ` AND (mr.team_name = ANY($${teamParamIdx}::text[]) OR mr.assigned_technician_id = $${userParamIdx})`;
            } else {
                params.push(userId);
                where += ` AND mr.assigned_technician_id = $${params.length}`;
            }
        }

        const result = await pool.query(
            `SELECT
                mr.*, 
                e.name AS equipment_name,
                tech.full_name AS technician_name
            FROM maintenance_requests mr
            LEFT JOIN equipment e ON e.id = mr.equipment_id
            LEFT JOIN users tech ON tech.id = mr.assigned_technician_id
            ${where}
            ORDER BY COALESCE(mr.scheduled_start, mr.scheduled_end, mr.created_at) ASC`,
            params
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.get('/api/requests/:id', authMiddleware, requireDb, requireRole(['admin', 'technician', 'employee']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    const role = normalizeRole(req.user?.role);
    const userId = getUserIdFromJwt(req);

    try {
        if (role === 'admin') {
            const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }

        if (role === 'employee' && userId) {
            const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1 AND requested_by_id = $2', [id, userId]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }

        if (role === 'technician' && userId) {
            const teamsRes = await pool.query(
                `SELECT DISTINCT t.name
                 FROM teams t
                 LEFT JOIN team_members tm ON tm.team_id = t.id
                 WHERE tm.user_id = $1 OR t.member_user_id = $1`,
                [userId]
            );
            const teamNames = teamsRes.rows.map((r) => r.name).filter(Boolean);

            const result = await pool.query(
                `SELECT * FROM maintenance_requests
                 WHERE id = $1
                   AND (assigned_technician_id = $2 OR ($3::text[] IS NOT NULL AND team_name = ANY($3::text[])))`,
                [id, userId, teamNames.length ? teamNames : null]
            );
            if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            return res.json(result.rows[0]);
        }

        return res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', authMiddleware, requireDb, requireRole(['admin', 'employee']), async (req, res) => {
    const {
        equipment_id,
        requested_by_id,
        assigned_technician_id,
        maintenance_type,
        priority,
        status,
        maintenance_for,
        work_center,
        team_name,
        notes,
        instructions,
        scheduled_start,
        scheduled_end
    } = req.body || {};

    const role = normalizeRole(req.user?.role);
    const userId = getUserIdFromJwt(req);

    const equipmentId = parseIntSafe(equipment_id);
    const prio = parseIntSafe(priority, 3);

    const normalizeMaintenanceFor = (value) => {
        const s = String(value || '').trim().toLowerCase();
        if (!s) return '';
        if (s === 'work center') return 'work_center';
        return s;
    };

    const maintenanceForRaw = normalizeMaintenanceFor(maintenance_for);
    const maintenanceFor = maintenanceForRaw || (equipmentId ? 'equipment' : work_center ? 'work_center' : 'equipment');

    if (maintenanceFor !== 'equipment' && maintenanceFor !== 'work_center') {
        return res.status(400).json({ error: "maintenance_for must be 'equipment' or 'work_center'" });
    }
    if (maintenanceFor === 'equipment' && !equipmentId) {
        return res.status(400).json({ error: 'equipment_id is required for maintenance_for=equipment' });
    }
    if (maintenanceFor === 'work_center' && !String(work_center || '').trim()) {
        return res.status(400).json({ error: 'work_center is required for maintenance_for=work_center' });
    }

    if (!maintenance_type) return res.status(400).json({ error: 'maintenance_type is required' });
    if (!Number.isFinite(prio) || prio < 1 || prio > 5) return res.status(400).json({ error: 'priority must be 1..5' });

    const cleanTeamName = String(team_name || '').trim();
    const finalEquipmentId = maintenanceFor === 'equipment' ? equipmentId : null;
    const finalWorkCenter = maintenanceFor === 'work_center' ? String(work_center).trim() : null;

    const finalRequestedById = role === 'employee' ? (userId ?? null) : (requested_by_id ?? null);
    const finalAssignedTechId = role === 'employee' ? null : (assigned_technician_id ?? null);

    try {
        const created = await pool.query(
            `INSERT INTO maintenance_requests
                (equipment_id, requested_by_id, assigned_technician_id, maintenance_type, priority, status, maintenance_for, work_center, team_name, notes, instructions, scheduled_start, scheduled_end)
             VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING *`,
            [
                finalEquipmentId,
                finalRequestedById,
                finalAssignedTechId,
                String(maintenance_type),
                prio,
                status ?? 'New Request',
                maintenanceFor,
                finalWorkCenter,
                cleanTeamName || null,
                notes ?? null,
                instructions ?? null,
                scheduled_start ?? null,
                scheduled_end ?? null
            ]
        );

        await emitDashboardStats();
        return res.status(201).json(created.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.put('/api/requests/:id', authMiddleware, requireDb, requireRole(['admin', 'technician']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const role = normalizeRole(req.user?.role);
    const userId = getUserIdFromJwt(req);

    // Technician: only update status and scheduled_end (duration)
    if (role === 'technician' && userId) {
        const { status, scheduled_end } = req.body || {};

        try {
            const teamsRes = await pool.query(
                `SELECT DISTINCT t.name
                 FROM teams t
                 LEFT JOIN team_members tm ON tm.team_id = t.id
                 WHERE tm.user_id = $1 OR t.member_user_id = $1`,
                [userId]
            );
            const teamNames = teamsRes.rows.map((r) => r.name).filter(Boolean);

            const updated = await pool.query(
                `UPDATE maintenance_requests SET
                    status = COALESCE($1, status),
                    scheduled_end = $2
                 WHERE id = $3
                   AND (assigned_technician_id = $4 OR ($5::text[] IS NOT NULL AND team_name = ANY($5::text[])))
                 RETURNING *`,
                [status ?? null, scheduled_end ?? null, id, userId, teamNames.length ? teamNames : null]
            );

            if (updated.rows.length === 0) return res.status(404).json({ error: 'Not found' });
            await emitDashboardStats();
            return res.json(updated.rows[0]);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    const {
        equipment_id,
        requested_by_id,
        assigned_technician_id,
        maintenance_type,
        priority,
        status,
        maintenance_for,
        work_center,
        team_name,
        notes,
        instructions,
        scheduled_start,
        scheduled_end
    } = req.body || {};

    const equipmentId = equipment_id != null ? parseIntSafe(equipment_id) : null;
    const prio = priority != null ? parseIntSafe(priority) : null;
    if (priority != null && (!Number.isFinite(prio) || prio < 1 || prio > 5)) return res.status(400).json({ error: 'priority must be 1..5' });

    try {
        const updated = await pool.query(
            `UPDATE maintenance_requests SET
                equipment_id = COALESCE($1, equipment_id),
                requested_by_id = $2,
                assigned_technician_id = $3,
                maintenance_type = COALESCE($4, maintenance_type),
                priority = COALESCE($5, priority),
                status = COALESCE($6, status),
                maintenance_for = COALESCE($7, maintenance_for),
                work_center = COALESCE($8, work_center),
                team_name = COALESCE($9, team_name),
                notes = COALESCE($10, notes),
                instructions = COALESCE($11, instructions),
                scheduled_start = $12,
                scheduled_end = $13
             WHERE id = $14
             RETURNING *`,
            [
                equipmentId,
                requested_by_id ?? null,
                assigned_technician_id ?? null,
                maintenance_type ?? null,
                prio,
                status ?? null,
                maintenance_for ?? null,
                work_center ?? null,
                team_name ?? null,
                notes ?? null,
                instructions ?? null,
                scheduled_start ?? null,
                scheduled_end ?? null,
                id
            ]
        );

        if (updated.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        await emitDashboardStats();
        return res.json(updated.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/api/requests/:id', authMiddleware, requireDb, requireRole(['admin']), async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    try {
        const deleted = await pool.query('DELETE FROM maintenance_requests WHERE id = $1 RETURNING id', [id]);
        if (deleted.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        await emitDashboardStats();
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

io.on('connection', async (socket) => {
    console.log('Socket connected:', socket.id);
    try {
        const stats = await computeDashboardStats();
        socket.emit('dashboard_stats', stats);
    } catch (err) {
        console.error('Failed to send initial dashboard_stats:', err.message);
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    emitDashboardStats();
});
