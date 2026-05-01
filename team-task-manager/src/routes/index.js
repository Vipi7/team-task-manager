const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/api/auth', authRoutes);
router.use('/api/projects', projectRoutes);
router.use('/api/tasks', taskRoutes);
router.use('/api/dashboard', dashboardRoutes);

module.exports = router;
