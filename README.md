# MaintSync (Odoo Adani) — Maintenance Management Web App

A simple maintenance management system with:
- Authentication (signup/login)
- Equipment inventory (with technician assignment)
- Teams (company + technicians)
- New maintenance request creation
- Calendar view for scheduled work
- Dashboard with live-ish stats (Socket.IO)

This repo has two apps:
- `server/` — Node.js + Express + PostgreSQL API
- `client/` — React + Vite + Tailwind UI

## Prerequisites

- Node.js 18+ (recommended)
- PostgreSQL 13+ (local)
- pgAdmin (optional, for DB UI)

## Project setup (Windows)

### 1) Create database

In pgAdmin (or psql), create the database:

```sql
CREATE DATABASE maintenance_db;
```

### 2) Configure server environment

Create/verify `server/.env`:

```dotenv
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=maintenance_db
DB_PASSWORD=12345678
DB_PORT=5432

PORT=5000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change_me_in_production
```

### 3) Install dependencies

Server:

```bash
cd server
npm install
```

Client:

```bash
cd ../client
npm install
```

> If Windows PowerShell blocks `npm` scripts, run PowerShell as your user and do:
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```
>
> Then reopen the terminal.

### 4) Run the apps

Start the server:

```bash
cd server
npm run dev
```

Start the client:

```bash
cd client
npm run dev
```

Open:
- http://localhost:5173

## Database notes (pgAdmin location)

Your DB name is `maintenance_db`.

In pgAdmin, find the tables here:

Servers → PostgreSQL → Databases → `maintenance_db` → Schemas → `public` → Tables

Important tables:
- `users` — all users (employees, technicians, portal users)
- `equipment` — equipment inventory
- `maintenance_requests` — requests/tickets
- `teams` — teams (name + company)
- `team_members` — join table mapping teams → technicians

The server auto-runs `server/schema.sql` on startup to create/upgrade tables.

## Core workflows

### 1) Create technicians (so they appear in dropdowns)

The Technician dropdowns are loaded from users with `role = 'technician'`.

Recommended method:
1. Use the Signup page to create a user.
2. In pgAdmin Query Tool (database `maintenance_db`) run:

```sql
UPDATE users
SET role = 'technician'
WHERE email = 'tech1@example.com';
```

### 2) Create a team and add technicians

Go to **Teams** (sidebar):
- Create a team with **Team Name**, **Company**, and one initial technician member.
- Add more technicians using **Add Member**.

### 3) Add equipment (technician is required)

Go to **Equipment** (sidebar):
- Click **NEW**
- Fill Name + Serial Number
- Select **Technician** (required)
- Save

### 4) Create a new maintenance request

Go to **New Request** (sidebar):
- Select **Maintenance For**:
  - **Equipment** → choose an equipment
  - **Work Center** → choose a work center
- Select **Team Name** (from Teams)
- Technician dropdown will show:
  - all technicians if no team selected
  - only technicians from the selected team
- Fill Notes/Instructions and optional Scheduled Start
- Click **SAVE**

### 5) Calendar

Go to **Calendar**:
- Shows requests by scheduled start (or created date)

### 6) Dashboard

Go to **Dashboard**:
- Shows critical equipment count, technician load, open requests
- Shows recent activities

## API endpoints (high level)

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`

Users:
- `GET /api/users?role=technician` (used by technician dropdowns)

Teams:
- `GET /api/teams`
- `POST /api/teams`
- `POST /api/teams/:id/members`

Equipment:
- `GET /api/equipment`
- `POST /api/equipment` (requires `technician_id`)

Requests:
- `GET /api/requests`
- `POST /api/requests`

## Troubleshooting

- **Tables not visible in pgAdmin**: refresh the database tree, and ensure you are inside `maintenance_db`.
- **`users` table missing**: start the server once; it runs `schema.sql` on boot.
- **CORS issues**: ensure `CLIENT_ORIGIN` in `server/.env` matches your Vite URL.
