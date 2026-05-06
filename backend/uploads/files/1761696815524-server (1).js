// backend/server.js - fixed
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Connect to MongoDB and attach db to app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'collabcode';

async function startServer() {
  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(DB_NAME);
  console.log('Connected to MongoDB:', MONGODB_URI, 'DB:', DB_NAME);
  app.set('db', db);

  // Mount routes AFTER db is set
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  // Mount project and user routes so frontend API calls reach the handlers
  const projectRoutes = require('./routes/projects');
  const userRoutes = require('./routes/users');
  app.use('/api/projects', projectRoutes);
  app.use('/api/users', userRoutes);

  // Catch-all for unknown API routes: return JSON 404 instead of HTML
  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found' });
  });

  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// === PROJECTS ROUTES ===
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.collection('projects').find({}).toArray();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, owner } = req.body;
    if (!title || !owner) return res.status(400).json({ message: 'Missing required fields' });
    const result = await db.collection('projects').insertOne({ title, description, owner, createdAt: new Date() });
    res.json({ _id: result.insertedId, title, description, owner });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});


// === USERS ROUTES ===
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) }, { projection: { password: 0 } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { username, email, bio } }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});


// === CHECKINS ROUTES ===
app.get('/api/projects/:projectId/checkins', async (req, res) => {
  try {
    const checkins = await db.collection('checkins').find({ projectId: req.params.projectId }).toArray();
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch checkins' });
  }
});

app.post('/api/projects/:projectId/checkins', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const newCheckin = {
      projectId: req.params.projectId,
      userId,
      message,
      createdAt: new Date(),
    };
    const result = await db.collection('checkins').insertOne(newCheckin);
    res.json({ _id: result.insertedId, ...newCheckin });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create checkin' });
  }
});


// === ACTIVITIES ROUTES ===
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await db.collection('activities').find({}).sort({ createdAt: -1 }).limit(20).toArray();
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});


// === SEARCH ROUTE ===
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    const results = await db.collection('projects')
      .find({ title: { $regex: query, $options: 'i' } })
      .toArray();
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});


// ===== PROJECTS =====
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await db.collection('projects').find({}).toArray();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.collection('projects').findOne({ _id: new ObjectId(req.params.id) });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});
