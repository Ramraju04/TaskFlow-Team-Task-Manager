# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, kanban boards, and real-time project tracking.

## 🚀 Features

- **Authentication** — Signup/Login with JWT tokens. First user becomes Admin automatically.
- **Role-Based Access Control** — Admin & Member roles with granular project-level permissions
- **Project Management** — Create projects, invite members, set roles per project
- **Task Management** — Create, assign, and track tasks with status/priority/due dates
- **Kanban Board** — Visual drag-friendly board with Todo → In Progress → Review → Done columns
- **Dashboard** — Personal task overview, stats, overdue alerts, and recent activity
- **Comments** — Per-task threaded comments
- **Admin Panel** — Manage all users and their global roles

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | React 18 + React Router v6 |
| Build | Vite |
| Deployment | Railway |

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   └── db.js           # SQLite schema & connection
│   ├── middleware/
│   │   └── auth.js         # JWT auth + RBAC middleware
│   ├── routes/
│   │   ├── auth.js         # /api/auth/*
│   │   ├── projects.js     # /api/projects/*
│   │   ├── tasks.js        # /api/tasks/*
│   │   └── users.js        # /api/users/*
│   └── server.js           # Express app entry point
├── frontend/
│   └── src/
│       ├── pages/          # AuthPage, Dashboard, Projects, Tasks, Users
│       ├── components/     # Layout, TaskModal, Avatar, Toast
│       ├── context/        # AuthContext
│       ├── api.js          # API service layer
│       └── index.css       # Design system
├── railway.toml            # Railway deployment config
├── nixpacks.toml           # Build config
└── package.json            # Root scripts
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd taskflow

# Install all dependencies
npm run install:all

# Start backend (port 4000)
npm run dev:backend

# Start frontend (port 5173) — in another terminal
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables (`.env` in root)

```env
PORT=4000
JWT_SECRET=your-secret-key
NODE_ENV=development
DB_PATH=./backend/data/taskflow.db
```

## 🌐 Deploy to Railway

### One-Click Deploy

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Set environment variables:
   ```
   JWT_SECRET=<generate-a-strong-secret>
   NODE_ENV=production
   DB_PATH=/app/data/taskflow.db
   ```
5. Railway auto-detects `railway.toml` and builds + deploys

### Persistent Storage on Railway

For the SQLite database to persist across deploys:
1. Go to your Railway service → **Volumes**
2. Add a volume mounted at `/app/data`
3. Set `DB_PATH=/app/data/taskflow.db` in environment variables

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List accessible projects | Any |
| POST | `/api/projects` | Create project | Any |
| GET | `/api/projects/:id` | Get project + members | Member |
| PUT | `/api/projects/:id` | Update project | Project Admin |
| DELETE | `/api/projects/:id` | Delete project | Project Admin |
| POST | `/api/projects/:id/members` | Add member | Project Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Project Admin |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | List tasks (filterable) | Any |
| GET | `/api/tasks/dashboard` | Dashboard stats | Any |
| POST | `/api/tasks` | Create task | Project Member |
| PUT | `/api/tasks/:id` | Update task | Project Member |
| DELETE | `/api/tasks/:id` | Delete task | Creator/Admin |
| GET | `/api/tasks/:id/comments` | Get comments | Any |
| POST | `/api/tasks/:id/comments` | Add comment | Any |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Change global role |

## 🔐 Role System

### Global Roles
- **Admin** — Can see/manage all projects, tasks, and users
- **Member** — Can only see projects they're added to

### Project Roles
- **Project Admin** — Can edit project, add/remove members, delete tasks
- **Project Member** — Can create/update tasks within the project

## 📊 Database Schema

```sql
users          — id, name, email, password, role, avatar_color
projects       — id, name, description, color, status, owner_id
project_members — project_id, user_id, role
tasks          — id, title, description, status, priority, project_id, assignee_id, due_date
comments       — id, content, task_id, user_id
```

## 🎨 Design System

- **Dark theme** with CSS variables
- **Space Mono** (headings/mono) + **DM Sans** (body)
- Accent color: `#7c5cfc` (indigo-purple)
- Component library: buttons, inputs, cards, modals, toasts — all custom

## 📝 License

MIT
