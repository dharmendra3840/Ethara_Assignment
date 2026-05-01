// src/routes/projects.js
// Project CRUD routes

const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/projects
 * List all projects (filtered by role)
 * ADMIN: all projects
 * MEMBER: only projects where they are a member
 */
router.get('/', auth, async (req, res) => {
  try {
    const db = getDb();
    const userId = new ObjectId(req.user.id);
    
    let query = {};
    if (req.user.role === 'MEMBER') {
      query.memberIds = userId;
    }
    
    const projects = await db.collection('projects').find(query).toArray();
    
    // Populate tasks and members for each project
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const tasks = await db.collection('tasks')
          .find({ projectId: project._id })
          .toArray();
        
        const members = await db.collection('users')
          .find({ _id: { $in: project.memberIds } })
          .project({ password: 0 })
          .toArray();
        
        return {
          ...project,
          tasks,
          members
        };
      })
    );
    
    res.json(enrichedProjects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/projects
 * Create a new project (ADMIN only)
 */
router.post('/', auth, auth.isAdmin, async (req, res) => {
  const { name, memberIds } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  try {
    const db = getDb();
    
    // Convert memberIds to ObjectId array
    const memberObjectIds = (memberIds || []).map(id => new ObjectId(id));
    
    const result = await db.collection('projects').insertOne({
      name,
      memberIds: memberObjectIds,
      createdAt: new Date()
    });
    
    const project = await db.collection('projects').findOne({ _id: result.insertedId });
    
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/projects/:id
 * Get single project with tasks and members
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const projectId = new ObjectId(req.params.id);
    const userId = new ObjectId(req.user.id);
    
    const project = await db.collection('projects').findOne({ _id: projectId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user has access (ADMIN or is a member)
    if (req.user.role !== 'ADMIN' && !project.memberIds.some(id => id.equals(userId))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get tasks for this project
    const tasks = await db.collection('tasks')
      .find({ projectId })
      .toArray();
    
    // Get members with their details
    const members = await db.collection('users')
      .find({ _id: { $in: project.memberIds } })
      .project({ password: 0 })
      .toArray();
    
    res.json({
      ...project,
      tasks,
      members
    });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete project and all its tasks (ADMIN only)
 */
router.delete('/:id', auth, auth.isAdmin, async (req, res) => {
  try {
    const db = getDb();
    const projectId = new ObjectId(req.params.id);
    
    const project = await db.collection('projects').findOne({ _id: projectId });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete all tasks in this project
    await db.collection('tasks').deleteMany({ projectId });
    
    // Delete the project
    await db.collection('projects').deleteOne({ _id: projectId });
    
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
