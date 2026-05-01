// seed.js
// Seed script to populate database with test data
// Run with: npm run seed

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('taskmanager');
    
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('tasks').deleteMany({});
    
    console.log('Creating users...');
    const adminPw = await bcrypt.hash('admin123', 10);
    const memberPw = await bcrypt.hash('member123', 10);
    
    const { insertedId: adminId } = await db.collection('users').insertOne({
      name: 'Admin User',
      email: 'admin@test.com',
      password: adminPw,
      role: 'ADMIN',
      createdAt: new Date()
    });
    
    const { insertedId: memberId } = await db.collection('users').insertOne({
      name: 'Member User',
      email: 'member@test.com',
      password: memberPw,
      role: 'MEMBER',
      createdAt: new Date()
    });
    
    console.log('Creating project...');
    const { insertedId: projectId } = await db.collection('projects').insertOne({
      name: 'Demo Project',
      memberIds: [adminId, memberId],
      createdAt: new Date()
    });
    
    console.log('Creating tasks...');
    const yesterday = new Date(Date.now() - 86400000);
    const nextWeek = new Date(Date.now() + 7 * 86400000);
    
    await db.collection('tasks').insertMany([
      {
        title: 'Setup repository',
        description: 'Initialize Git repo and create folder structure',
        status: 'DONE',
        projectId,
        assignedToId: adminId,
        dueDate: null,
        createdAt: new Date()
      },
      {
        title: 'Build auth routes',
        description: 'Implement signup and login endpoints',
        status: 'IN_PROGRESS',
        projectId,
        assignedToId: memberId,
        dueDate: yesterday,
        createdAt: new Date()
      },
      {
        title: 'Write tests',
        description: 'Add unit tests for all API endpoints',
        status: 'TODO',
        projectId,
        assignedToId: memberId,
        dueDate: nextWeek,
        createdAt: new Date()
      }
    ]);
    
    console.log('\n✓ Seed completed successfully!');
    console.log('\nTest accounts:');
    console.log('  ADMIN:  admin@test.com  / admin123');
    console.log('  MEMBER: member@test.com / member123');
    
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
