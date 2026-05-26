# Team Task Manager

A task management app where teams can create projects, assign tasks, and track progress. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## What it does

- Users can sign up as Admin or Member
- Admins create projects and add team members
- Everyone can create tasks and update their status
- Dashboard shows stats and overdue tasks
- Kanban board to visualize task progress

## Tech used

- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (native driver)
- **Auth**: JWT tokens + bcrypt
- **Frontend**: Plain HTML/CSS/JS

## Setup

### 1. Install stuff

```bash
npm install
```

### 2. MongoDB setup

You need a MongoDB Atlas account (it's free):

1. Go to mongodb.com/cloud/atlas and sign up
2. Create a free cluster (M0 tier)
3. Make a database user with username and password
4. Whitelist your IP (or use 0.0.0.0/0 for testing)
5. Get the connection string from "Connect" → "Drivers"

### 3. Environment variables

Create a `.env` file:

```
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=any_random_string_at_least_32_chars
PORT=3000
```

### 4. Add test data

```bash
npm run seed
```

This creates two test accounts:
- admin@test.com / admin123 (Admin)
- member@test.com / member123 (Member)

### 5. Run it

```bash
npm run dev
```

Open http://localhost:3000

## What you can do

**Admin users:**
- Create and delete projects
- Add team members to projects
- Create, update, and delete tasks
- See all projects

**Member users:**
- See only their assigned projects
- Create and update tasks
- Can't delete anything

## Project structure

```
├── src/
│   ├── index.js              # Server setup
│   ├── db.js                 # MongoDB connection
│   ├── middleware/auth.js    # JWT verification
│   └── routes/               # API endpoints
├── public/
│   ├── index.html            # Login page
│   ├── dashboard.html        # Main dashboard
│   ├── project.html          # Kanban board
│   ├── css/style.css         # Styles
│   └── js/                   # Frontend logic
└── seed.js                   # Database seeding
```

## API endpoints

```
POST   /api/auth/signup       - Create account
POST   /api/auth/login        - Login
GET    /api/projects          - List projects
POST   /api/projects          - Create project (admin)
GET    /api/projects/:id      - Get project details
DELETE /api/projects/:id      - Delete project (admin)
POST   /api/tasks             - Create task
PATCH  /api/tasks/:id/status  - Update task status
DELETE /api/tasks/:id         - Delete task (admin)
GET    /api/tasks/overdue     - Get overdue tasks
GET    /api/tasks/dashboard   - Get stats
```

## Deployment

Works on Railway, Render, or any Node.js host:

1. Push to GitHub
2. Connect your repo to the hosting platform
3. Add environment variables (MONGODB_URI, JWT_SECRET)
4. Deploy

## Common issues

**Port already in use?**
- Kill the process using port 3000 or change PORT in .env

**Can't connect to MongoDB?**
- Check your connection string
- Make sure your IP is whitelisted in Atlas
- Verify database user credentials

**Authentication fails?**
- Make sure JWT_SECRET is set in .env
- Try logging out and back in

## Notes

- Passwords are hashed with bcrypt
- JWT tokens expire after 7 days
- The UI is intentionally simple (Notion-inspired)
- No frameworks used on frontend

Built for Ethara.ai internship assignment.