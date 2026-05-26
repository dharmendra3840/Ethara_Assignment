// src/routes/tasks.js
// Task CRUD and dashboard routes

const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function logActivity(db, { taskId, projectId, actorId, actorName, action, from, to }) {
  await db.collection('taskLogs').insertOne({
    taskId,
    projectId,
    actorId,
    actorName,
    action,
    from: from || null,
    to: to || null,
    createdAt: new Date()
  });
}

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', auth, async (req, res) => {
  const { title, description, dueDate, projectId, assignedToId, status } = req.body;
  
  if (!title || !projectId) {
    return res.status(400).json({ error: 'Title and projectId are required' });
  }
  
  try {
    const db = getDb();
    
    const task = {
      title,
      description: description || null,
      status: status || 'TODO',
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: new ObjectId(projectId),
      assignedToId: assignedToId ? new ObjectId(assignedToId) : null,
      createdAt: new Date()
    };
    
    const result = await db.collection('tasks').insertOne(task);
    const createdTask = await db.collection('tasks').findOne({ _id: result.insertedId });

    const actor = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { name: 1 } }
    );
    await logActivity(db, {
      taskId: result.insertedId,
      projectId: new ObjectId(projectId),
      actorId: new ObjectId(req.user.id),
      actorName: actor?.name || 'Unknown',
      action: 'created',
      from: null,
      to: task.title
    });

    res.status(201).json(createdTask);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Update task status
 */
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  
  if (!status || !['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
    return res.status(400).json({ error: 'Valid status required (TODO, IN_PROGRESS, DONE)' });
  }
  
  try {
    const db = getDb();
    const taskId = new ObjectId(req.params.id);

    const existingTask = await db.collection('tasks').findOne({ _id: taskId });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const oldStatus = existingTask.status;
    await db.collection('tasks').updateOne({ _id: taskId }, { $set: { status } });

    const actor = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { name: 1 } }
    );
    await logActivity(db, {
      taskId,
      projectId: existingTask.projectId,
      actorId: new ObjectId(req.user.id),
      actorName: actor?.name || 'Unknown',
      action: 'status_changed',
      from: oldStatus,
      to: status
    });

    res.json({ ...existingTask, status });
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task (ADMIN only)
 */
router.delete('/:id', auth, auth.isAdmin, async (req, res) => {
  try {
    const db = getDb();
    const taskId = new ObjectId(req.params.id);
    
    const result = await db.collection('tasks').deleteOne({ _id: taskId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/tasks/overdue
 * Get all overdue tasks (dueDate < now AND status != DONE)
 */
router.get('/overdue', auth, async (req, res) => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.user.id);
    
    // Build query based on role
    let query = {
      dueDate: { $lt: new Date() },
      status: { $ne: 'DONE' }
    };
    
    // If MEMBER, only show tasks from their projects
    if (req.user.role === 'MEMBER') {
      const userProjects = await db.collection('projects')
        .find({ memberIds: userId })
        .project({ _id: 1 })
        .toArray();
      
      const projectIds = userProjects.map(p => p._id);
      query.projectId = { $in: projectIds };
    }
    
    const tasks = await db.collection('tasks').find(query).toArray();
    
    // Enrich with project and assignee info
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const project = await db.collection('projects').findOne({ _id: task.projectId });
        const assignee = task.assignedToId 
          ? await db.collection('users').findOne({ _id: task.assignedToId }, { projection: { password: 0 } })
          : null;
        
        return {
          ...task,
          project,
          assignee
        };
      })
    );
    
    res.json(enrichedTasks);
  } catch (err) {
    console.error('Get overdue tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/tasks/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.user.id);
    
    // Build base query based on role
    let baseQuery = {};
    
    if (req.user.role === 'MEMBER') {
      const userProjects = await db.collection('projects')
        .find({ memberIds: userId })
        .project({ _id: 1 })
        .toArray();
      
      const projectIds = userProjects.map(p => p._id);
      baseQuery.projectId = { $in: projectIds };
    }
    
    const total = await db.collection('tasks').countDocuments(baseQuery);
    const todo = await db.collection('tasks').countDocuments({ ...baseQuery, status: 'TODO' });
    const inProgress = await db.collection('tasks').countDocuments({ ...baseQuery, status: 'IN_PROGRESS' });
    const done = await db.collection('tasks').countDocuments({ ...baseQuery, status: 'DONE' });
    const overdue = await db.collection('tasks').countDocuments({
      ...baseQuery,
      dueDate: { $lt: new Date() },
      status: { $ne: 'DONE' }
    });
    
    res.json({ total, todo, inProgress, done, overdue });
  } catch (err) {
    console.error('Get dashboard stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/tasks/:id/logs
 * Get activity log for a task
 */
router.get('/:id/logs', auth, async (req, res) => {
  try {
    const db = getDb();
    const taskId = new ObjectId(req.params.id);
    const logs = await db.collection('taskLogs')
      .find({ taskId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json(logs);
  } catch (err) {
    if (err.message?.includes('24 hex')) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
