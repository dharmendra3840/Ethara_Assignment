# Team Task Manager

A production-ready team task management web application with role-based access control, built for the Ethara.ai internship assignment.

## Features

- **User Authentication**: JWT-based signup and login with role selection (ADMIN/MEMBER)
- **Role-Based Access Control**: Different permissions for ADMIN and MEMBER users
- **Project Management**: Create projects and assign team members (ADMIN only)
- **Task Management**: Create, update, and track tasks with assignments and due dates
- **Kanban Board**: Visual three-column task board (TODO, IN_PROGRESS, DONE)
- **Dashboard**: Real-time statistics and overdue task tracking
- **Notion-like UI**: Clean, minimal design with warm colors and no shadows

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas (native driver, no ORM)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (free M0 tier)
- npm or yarn

## Setup Instructions

### 1. Clone or Download

Download this project to your local machine.

### 2. Install Dependencies

```bash
npm install
```

### 3. MongoDB Atlas Setup

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas) and create a free account
2. Click "Build a Database" → choose Free M0 tier → select any region
3. Create a database user with username and password
4. Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
5. Go to Database → Connect → Drivers → copy the connection string
6. Replace `<password>` in the string with your actual database user password

Your connection string should look like:
```
mongodb+srv://youruser:yourpassword@cluster0.abc123.mongodb.net/taskmanager?retryWrites=true&w=majority
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_long_random_secret_at_least_32_characters
PORT=3000
```

**Important**: Generate a strong JWT_SECRET (at least 32 random characters).

### 5. Seed the Database

Populate the database with test data:

```bash
npm run seed
```

This creates:
- **ADMIN user**: admin@test.com / admin123
- **MEMBER user**: member@test.com / member123
- 1 demo project with 3 sample tasks

### 6. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 7. Open in Browser

Navigate to `http://localhost:3000` and log in with one of the test accounts.

## Project Structure

```
task-manager/
├── src/
│   ├── index.js              # Express entry point
│   ├── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Signup and login routes
│       ├── projects.js       # Project CRUD routes
│       └── tasks.js          # Task CRUD and dashboard routes
├── public/
│   ├── index.html            # Login/Signup page
│   ├── dashboard.html        # Dashboard with stats and projects
│   ├── project.html          # Kanban board view
│   ├── css/
│   │   └── style.css         # Global styles (Notion-like design)
│   └── js/
│       ├── auth.js           # Login/signup logic
│       ├── dashboard.js      # Dashboard logic
│       └── project.js        # Kanban board logic
├── seed.js                   # Database seed script
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and receive JWT token

### Projects
- `GET /api/projects` - List projects (filtered by role)
- `POST /api/projects` - Create project (ADMIN only)
- `GET /api/projects/:id` - Get project with tasks and members
- `DELETE /api/projects/:id` - Delete project (ADMIN only)

### Tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task (ADMIN only)
- `GET /api/tasks/overdue` - Get overdue tasks
- `GET /api/tasks/dashboard` - Get dashboard statistics

## Role-Based Permissions

| Action | ADMIN | MEMBER |
|--------|-------|--------|
| View projects | All projects | Own projects only |
| Create project | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Create task | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Delete task | ✅ | ❌ |

## Deployment

### Railway Deployment

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables in the Variables tab:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT` (optional, Railway sets this automatically)
5. Deploy and get your public URL

## Testing Checklist

- [ ] Signup as ADMIN and MEMBER
- [ ] Login with correct and incorrect credentials
- [ ] ADMIN can create projects
- [ ] MEMBER cannot create projects (403 error)
- [ ] MEMBER only sees their assigned projects
- [ ] Create tasks with due dates
- [ ] Update task status via dropdown
- [ ] Dashboard shows correct statistics
- [ ] Overdue tasks appear correctly
- [ ] ADMIN can delete tasks
- [ ] MEMBER cannot see delete buttons
- [ ] Logout clears session

## Design System

The UI follows a Notion-like aesthetic:

- **Colors**: Warm off-white background (#F7F6F3), no pure white
- **Typography**: System fonts only (system-ui, -apple-system)
- **No shadows**: Clean, flat design
- **No gradients**: Solid colors only
- **Borders**: Warm gray (#E8E6E1)
- **Accent**: Muted amber (#D97706)

## Troubleshooting

**MongoDB connection fails:**
- Check your connection string in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for testing)
- Verify database user credentials

**401 Unauthorized errors:**
- Check if JWT_SECRET is set in `.env`
- Try logging out and logging in again

**Tasks not appearing:**
- Run `npm run seed` to populate test data
- Check browser console for errors

## License

This project is created for educational purposes as part of the Ethara.ai internship assignment.
