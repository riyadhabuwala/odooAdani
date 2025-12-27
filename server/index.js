const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Initialize Database
const initDb = async () => {
    try {
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

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Maintenance System API is running. Access /api/stats for data.');
});

app.get('/api/stats', async (req, res) => {
    try {
        const criticalCount = await pool.query("SELECT COUNT(*) FROM equipment WHERE status = 'Down'");
        const requestCount = await pool.query("SELECT COUNT(*) FROM maintenance_requests WHERE status != 'Repaired' AND status != 'Scrap'");

        res.json({
            criticalEquipment: parseInt(criticalCount.rows[0].count) || 0,
            technicianLoad: 75,
            openRequests: parseInt(requestCount.rows[0].count) || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Equipment Routes
app.get('/api/equipment', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM equipment ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/equipment', async (req, res) => {
    const { name, serial_number, department, category, company } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO equipment (name, serial_number, department, category, company) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, serial_number, department, category, company]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Maintenance Requests
app.get('/api/requests', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', async (req, res) => {
    const { equipment_id, request_type, priority, description, instructions } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO maintenance_requests (equipment_id, request_type, priority, description, instructions) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [equipment_id, request_type, priority, description, instructions]
        );

        // Emit updated stats
        const stats = await pool.query("SELECT COUNT(*) FROM maintenance_requests WHERE status != 'Repaired' AND status != 'Scrap'");
        io.emit('dashboard_stats', { openRequests: parseInt(stats.rows[0].count) });

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Socket.io connection
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    try {
        const criticalCount = await pool.query("SELECT COUNT(*) FROM equipment WHERE status = 'Down'");
        const requestCount = await pool.query("SELECT COUNT(*) FROM maintenance_requests WHERE status != 'Repaired' AND status != 'Scrap'");

        socket.emit('dashboard_stats', {
            criticalEquipment: parseInt(criticalCount.rows[0].count) || 0,
            technicianLoad: 75,
            openRequests: parseInt(requestCount.rows[0].count) || 0
        });
    } catch (err) {
        console.error('Socket initial stats error:', err);
    }

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
