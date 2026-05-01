const ProjectMember = require('../models/ProjectMember');

// Global admin check
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// Check if user is project admin or global admin
const projectAdminOnly = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return next(); // Global admin allows
    }

    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const membership = await ProjectMember.findOne({
      project_id: projectId,
      user_id: req.user._id,
    });

    if (membership && membership.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as project admin' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error checking roles', error: error.message });
  }
};

module.exports = { adminOnly, projectAdminOnly };
