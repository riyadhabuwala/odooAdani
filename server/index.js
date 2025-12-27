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
            "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'portal_user') RETURNING id, full_name, email, role",
            [cleanName, cleanEmail, passwordHash]
        );

        const user = created.rows[0];
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

        const user = { id: userRow.id, full_name: userRow.full_name, email: userRow.email, role: userRow.role };
        const token = jwt.sign({ sub: user.id, email: user.email, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Users (for smart selects)
app.get('/api/users', authMiddleware, async (req, res) => {
    if (!pool) {
        return res.status(503).json({
            error: 'Database not configured. Create server/.env and restart the server.',
        });
    }
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
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Dashboard ---
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    if (!pool) {
        return res.status(503).json({
            error: 'Database not configured. Create server/.env and restart the server.',
        });
    }
    try {
        const stats = await computeDashboardStats();
        const activities = await pool.query(
            `SELECT
                mr.id,
                mr.status,
                mr.maintenance_type,
                mr.priority,
                mr.created_at,
                e.name AS equipment_name,
                u.full_name AS technician_name
            FROM maintenance_requests mr
            JOIN equipment e ON e.id = mr.equipment_id
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
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await computeDashboardStats();
        return res.json(stats);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// --- Equipment CRUD ---
app.get('/api/equipment', authMiddleware, requireDb, async (req, res) => {
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

app.get('/api/equipment/:id', authMiddleware, requireDb, async (req, res) => {
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

app.post('/api/equipment', authMiddleware, requireDb, async (req, res) => {
    const { name, employee_id, department, serial_number, technician_id, category, company, status } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanSerial = String(serial_number || '').trim();
    if (!cleanName) return res.status(400).json({ error: 'Name is required' });
    if (!cleanSerial) return res.status(400).json({ error: 'Serial number is required' });

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
                technician_id ?? null,
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

app.put('/api/equipment/:id', authMiddleware, requireDb, async (req, res) => {
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

app.delete('/api/equipment/:id', authMiddleware, requireDb, async (req, res) => {
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
app.get('/api/requests', authMiddleware, requireDb, async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : null;
    const to = req.query.to ? new Date(String(req.query.to)) : null;

    const params = [];
    let where = 'WHERE 1=1';
    if (from && !Number.isNaN(from.getTime())) {
        params.push(from.toISOString());
        where += ` AND COALESCE(mr.scheduled_start, mr.created_at) >= $${params.length}`;
    }
    if (to && !Number.isNaN(to.getTime())) {
        params.push(to.toISOString());
        where += ` AND COALESCE(mr.scheduled_start, mr.created_at) <= $${params.length}`;
    }

    try {
        const result = await pool.query(
            `SELECT
                mr.*, 
                e.name AS equipment_name,
                tech.full_name AS technician_name
            FROM maintenance_requests mr
            JOIN equipment e ON e.id = mr.equipment_id
            LEFT JOIN users tech ON tech.id = mr.assigned_technician_id
            ${where}
            ORDER BY COALESCE(mr.scheduled_start, mr.created_at) ASC`,
            params
        );
        return res.json(result.rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.get('/api/requests/:id', authMiddleware, requireDb, async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    try {
        const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        return res.json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', authMiddleware, requireDb, async (req, res) => {
    const {
        equipment_id,
        requested_by_id,
        assigned_technician_id,
        maintenance_type,
        priority,
        status,
        work_center,
        notes,
        instructions,
        scheduled_start,
        scheduled_end
    } = req.body || {};

    const equipmentId = parseIntSafe(equipment_id);
    const prio = parseIntSafe(priority, 3);
    if (!equipmentId) return res.status(400).json({ error: 'equipment_id is required' });
    if (!maintenance_type) return res.status(400).json({ error: 'maintenance_type is required' });
    if (!Number.isFinite(prio) || prio < 1 || prio > 5) return res.status(400).json({ error: 'priority must be 1..5' });

    try {
        const created = await pool.query(
            `INSERT INTO maintenance_requests
                (equipment_id, requested_by_id, assigned_technician_id, maintenance_type, priority, status, work_center, notes, instructions, scheduled_start, scheduled_end)
             VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING *`,
            [
                equipmentId,
                requested_by_id ?? null,
                assigned_technician_id ?? null,
                String(maintenance_type),
                prio,
                status ?? 'New Request',
                work_center ?? null,
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

app.put('/api/requests/:id', authMiddleware, requireDb, async (req, res) => {
    const id = parseIntSafe(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const {
        equipment_id,
        requested_by_id,
        assigned_technician_id,
        maintenance_type,
        priority,
        status,
        work_center,
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
                work_center = COALESCE($7, work_center),
                notes = COALESCE($8, notes),
                instructions = COALESCE($9, instructions),
                scheduled_start = $10,
                scheduled_end = $11
             WHERE id = $12
             RETURNING *`,
            [
                equipmentId,
                requested_by_id ?? null,
                assigned_technician_id ?? null,
                maintenance_type ?? null,
                prio,
                status ?? null,
                work_center ?? null,
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

app.delete('/api/requests/:id', authMiddleware, requireDb, async (req, res) => {
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
