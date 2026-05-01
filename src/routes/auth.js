// src/routes/auth.js
// Authentication routes: signup and login

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  
  try {
    const db = getDb();
    const existing = await db.collection('users').findOne({ email });
    
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    await db.collection('users').insertOne({
      name,
      email,
      password: hash,
      role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      createdAt: new Date()
    });
    
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Login and receive JWT token
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  
  try {
    const db = getDb();
    const user = await db.collection('users').findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
