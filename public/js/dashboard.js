// public/js/dashboard.js
// Dashboard page logic

// Auth guard
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = 'index.html';
}

// Display user info
document.getElementById('userName').textContent = user.name;
const roleEl = document.getElementById('userRole');
roleEl.textContent = user.role;
roleEl.className = `badge badge-${user.role.toLowerCase()}`;

// Show New Project button only for admins
if (user.role === 'ADMIN') {
  document.getElementById('newProjectBtn').style.display = 'block';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// Fetch and display dashboard stats
async function loadDashboardStats() {
  try {
    const res = await fetch('/api/tasks/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }
    
    const stats = await res.json();
    
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statTodo').textContent = stats.todo;
    document.getElementById('statInProgress').textContent = stats.inProgress;
    document.getElementById('statDone').textContent = stats.done;
    document.getElementById('statOverdue').textContent = stats.overdue;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Fetch and display projects
async function loadProjects() {
  try {
    const res = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }
    
    const projects = await res.json();
    const grid = document.getElementById('projectsGrid');
    
    if (projects.length === 0) {
      grid.innerHTML = '<div class="empty-state">No projects yet</div>';
      return;
    }
    
    grid.innerHTML = projects.map(project => `
      <div class="project-card">
        <h3>${escapeHtml(project.name)}</h3>
        <div class="project-meta">
          ${project.members.length} member${project.members.length !== 1 ? 's' : ''} · 
          ${project.tasks.length} task${project.tasks.length !== 1 ? 's' : ''}
        </div>
        <button class="btn-secondary" onclick="viewProject('${project._id}')">View</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load projects:', err);
  }
}

// Fetch and display overdue tasks
async function loadOverdueTasks() {
  try {
    const res = await fetch('/api/tasks/overdue', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }
    
    const tasks = await res.json();
    const tbody = document.getElementById('overdueTableBody');
    
    if (tasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No overdue tasks</td></tr>';
      return;
    }
    
    tbody.innerHTML = tasks.map(task => `
      <tr>
        <td>${escapeHtml(task.title)}</td>
        <td>${task.project ? escapeHtml(task.project.name) : 'N/A'}</td>
        <td>${task.assignee ? escapeHtml(task.assignee.name) : 'Unassigned'}</td>
        <td>${formatDate(task.dueDate)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load overdue tasks:', err);
  }
}

// View project
function viewProject(projectId) {
  window.location.href = `project.html?id=${projectId}`;
}

// New Project Modal
const newProjectModal = document.getElementById('newProjectModal');
const newProjectBtn = document.getElementById('newProjectBtn');
const closeProjectModal = document.getElementById('closeProjectModal');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const newProjectForm = document.getElementById('newProjectForm');

newProjectBtn.addEventListener('click', async () => {
  await loadAllUsers();
  newProjectModal.classList.add('active');
});

closeProjectModal.addEventListener('click', () => {
  newProjectModal.classList.remove('active');
  newProjectForm.reset();
  document.getElementById('projectError').textContent = '';
});

cancelProjectBtn.addEventListener('click', () => {
  newProjectModal.classList.remove('active');
  newProjectForm.reset();
  document.getElementById('projectError').textContent = '';
});

// Load all users for member selection
async function loadAllUsers() {
  try {
    // We need to fetch all users - but we don't have this endpoint yet
    // For now, we'll use a workaround: get users from existing projects
    const res = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const projects = await res.json();
    
    // Collect unique users
    const usersMap = new Map();
    projects.forEach(project => {
      project.members.forEach(member => {
        usersMap.set(member._id.toString(), member);
      });
    });
    
    // Add current user if not in map
    usersMap.set(user.id.toString(), { _id: user.id, name: user.name, role: user.role });
    
    const users = Array.from(usersMap.values());
    
    const container = document.getElementById('memberCheckboxes');
    container.innerHTML = users.map(u => `
      <label class="checkbox-item">
        <input type="checkbox" name="memberIds" value="${u._id}">
        <span>${escapeHtml(u.name)} <span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></span>
      </label>
    `).join('');
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

// Create new project
newProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(newProjectForm);
  const name = formData.get('name');
  const memberIds = formData.getAll('memberIds');
  
  const errorEl = document.getElementById('projectError');
  errorEl.textContent = '';
  
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, memberIds })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      newProjectModal.classList.remove('active');
      newProjectForm.reset();
      loadProjects();
    } else {
      errorEl.textContent = data.error || 'Failed to create project';
    }
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
  }
});

// Fetch and display team workload (ADMIN only)
async function loadWorkload() {
  try {
    const res = await fetch('/api/tasks/workload', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) return;

    const workload = await res.json();
    const tbody = document.getElementById('workloadTableBody');

    if (workload.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No task data yet</td></tr>';
      return;
    }

    tbody.innerHTML = workload.map(member => `
      <tr>
        <td class="workload-member">
          ${escapeHtml(member.name)}
          ${member.role ? `<span class="badge badge-${member.role.toLowerCase()}">${member.role}</span>` : ''}
        </td>
        <td>${member.todo}</td>
        <td>${member.inProgress}</td>
        <td>${member.done}</td>
        <td class="${member.overdue > 0 ? 'workload-overdue' : ''}">${member.overdue}</td>
        <td class="workload-total">${member.total}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load workload:', err);
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Load data on page load
loadDashboardStats();
loadProjects();
loadOverdueTasks();
if (user.role === 'ADMIN') {
  document.getElementById('workloadSection').style.display = 'block';
  loadWorkload();
}
