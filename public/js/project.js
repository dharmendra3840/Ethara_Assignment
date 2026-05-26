// public/js/project.js
// Project kanban page logic

// Auth guard
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
  window.location.href = 'index.html';
}

// Get project ID from URL
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (!projectId) {
  window.location.href = 'dashboard.html';
}

// Display user info
document.getElementById('userName').textContent = user.name;
const roleEl = document.getElementById('userRole');
roleEl.textContent = user.role;
roleEl.className = `badge badge-${user.role.toLowerCase()}`;

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

let currentProject = null;

// Load project and tasks
async function loadProject() {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return;
    }
    
    if (res.status === 404 || res.status === 403) {
      alert('Project not found or access denied');
      window.location.href = 'dashboard.html';
      return;
    }
    
    currentProject = await res.json();
    
    // Update page title
    document.getElementById('projectName').textContent = currentProject.name;
    
    // Render tasks in kanban columns
    renderTasks(currentProject.tasks);
    
  } catch (err) {
    console.error('Failed to load project:', err);
    alert('Failed to load project');
  }
}

// Render tasks in kanban columns
function renderTasks(tasks) {
  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');
  
  // Update counts
  document.getElementById('todoCount').textContent = todoTasks.length;
  document.getElementById('inProgressCount').textContent = inProgressTasks.length;
  document.getElementById('doneCount').textContent = doneTasks.length;
  
  // Render each column
  document.getElementById('todoTasks').innerHTML = todoTasks.map(renderTaskCard).join('');
  document.getElementById('inProgressTasks').innerHTML = inProgressTasks.map(renderTaskCard).join('');
  document.getElementById('doneTasks').innerHTML = doneTasks.map(renderTaskCard).join('');
}

// Render a single task card
function renderTaskCard(task) {
  const assignee = currentProject.members.find(m => m._id.toString() === task.assignedToId?.toString());
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return `
    <div class="task-card" id="card-${task._id}">
      <div class="task-card-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="task-card-description">${escapeHtml(task.description)}</div>` : ''}
      <div class="task-card-meta">
        ${assignee ? escapeHtml(assignee.name) : 'Unassigned'}
        ${task.dueDate ? ` · ${formatDate(task.dueDate)}` : ''}
        ${isOverdue ? ' <span class="badge badge-overdue">Overdue</span>' : ''}
      </div>
      <div class="task-card-footer">
        <select onchange="updateTaskStatus('${task._id}', this.value)">
          <option value="TODO" ${task.status === 'TODO' ? 'selected' : ''}>To do</option>
          <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>In progress</option>
          <option value="DONE" ${task.status === 'DONE' ? 'selected' : ''}>Done</option>
        </select>
        ${user.role === 'ADMIN' ? `<button class="btn-danger" onclick="deleteTask('${task._id}')">Delete</button>` : ''}
      </div>
      <div class="task-activity">
        <button class="btn-activity" onclick="toggleActivity('${task._id}', this)">Activity ▾</button>
        <div class="activity-log" id="activity-${task._id}" style="display:none"></div>
      </div>
    </div>
  `;
}

async function toggleActivity(taskId, btn) {
  const logEl = document.getElementById(`activity-${taskId}`);
  if (logEl.style.display === 'none') {
    logEl.style.display = 'block';
    btn.textContent = 'Activity ▴';
    if (!logEl.dataset.loaded) {
      await loadActivityLog(taskId, logEl);
    }
  } else {
    logEl.style.display = 'none';
    btn.textContent = 'Activity ▾';
  }
}

async function loadActivityLog(taskId, logEl) {
  logEl.innerHTML = '<div class="activity-loading">Loading...</div>';
  try {
    const res = await fetch(`/api/tasks/${taskId}/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      logEl.innerHTML = '<div class="activity-empty">Could not load activity.</div>';
      return;
    }
    const logs = await res.json();
    logEl.dataset.loaded = '1';
    if (logs.length === 0) {
      logEl.innerHTML = '<div class="activity-empty">No activity yet.</div>';
      return;
    }
    logEl.innerHTML = logs.map(log => {
      const time = formatRelativeTime(log.createdAt);
      let text = '';
      if (log.action === 'created') {
        text = `<strong>${escapeHtml(log.actorName)}</strong> created this task`;
      } else if (log.action === 'status_changed') {
        text = `<strong>${escapeHtml(log.actorName)}</strong> changed status · ${formatStatus(log.from)} → ${formatStatus(log.to)}`;
      }
      return `
        <div class="activity-entry">
          <span class="activity-text">${text}</span>
          <span class="activity-time">${time}</span>
        </div>
      `;
    }).join('');
  } catch (err) {
    logEl.innerHTML = '<div class="activity-empty">Could not load activity.</div>';
  }
}

function formatStatus(status) {
  const map = { TODO: 'To do', IN_PROGRESS: 'In progress', DONE: 'Done' };
  return map[status] || status;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diff = Date.now() - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Update task status
async function updateTaskStatus(taskId, newStatus) {
  try {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) {
      // Reload project to refresh tasks
      await loadProject();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update task');
    }
  } catch (err) {
    console.error('Failed to update task:', err);
    alert('Network error');
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      await loadProject();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete task');
    }
  } catch (err) {
    console.error('Failed to delete task:', err);
    alert('Network error');
  }
}

// Add Task Modal
const addTaskModal = document.getElementById('addTaskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeTaskModal = document.getElementById('closeTaskModal');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const addTaskForm = document.getElementById('addTaskForm');

addTaskBtn.addEventListener('click', () => {
  // Populate assignee dropdown
  const assigneeSelect = document.getElementById('taskAssignee');
  assigneeSelect.innerHTML = '<option value="">Unassigned</option>' +
    currentProject.members.map(member => 
      `<option value="${member._id}">${escapeHtml(member.name)}</option>`
    ).join('');
  
  addTaskModal.classList.add('active');
});

closeTaskModal.addEventListener('click', () => {
  addTaskModal.classList.remove('active');
  addTaskForm.reset();
  document.getElementById('taskError').textContent = '';
});

cancelTaskBtn.addEventListener('click', () => {
  addTaskModal.classList.remove('active');
  addTaskForm.reset();
  document.getElementById('taskError').textContent = '';
});

// Create new task
addTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(addTaskForm);
  const title = formData.get('title');
  const description = formData.get('description');
  const assignedToId = formData.get('assignedToId') || null;
  const dueDate = formData.get('dueDate') || null;
  
  const errorEl = document.getElementById('taskError');
  errorEl.textContent = '';
  
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        description,
        assignedToId,
        dueDate,
        projectId,
        status: 'TODO'
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      addTaskModal.classList.remove('active');
      addTaskForm.reset();
      await loadProject();
    } else {
      errorEl.textContent = data.error || 'Failed to create task';
    }
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
  }
});

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Load project on page load
loadProject();
