const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');

const getProjects = async (req, res) => {
  try {
    // If global admin, get all projects, else get projects user is member of
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find().populate('owner_id', 'name email');
    } else {
      const memberships = await ProjectMember.find({ user_id: req.user._id });
      const projectIds = memberships.map(m => m.project_id);
      
      // Also include projects they own
      projects = await Project.find({
        $or: [
          { _id: { $in: projectIds } },
          { owner_id: req.user._id }
        ]
      }).populate('owner_id', 'name email');
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner_id: req.user._id,
    });

    // Automatically add creator as project admin
    await ProjectMember.create({
      project_id: project._id,
      user_id: req.user._id,
      role: 'admin',
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { user_id, role } = req.body;
    const { id: project_id } = req.params;

    const memberExists = await ProjectMember.findOne({ project_id, user_id });
    if (memberExists) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    const member = await ProjectMember.create({
      project_id,
      user_id,
      role: role || 'member',
    });

    res.status(201).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project_id: req.params.id })
      .populate('assignee_id', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createProjectTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignee_id, due_date } = req.body;
    const project_id = req.params.id;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      assignee_id,
      project_id,
      due_date,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProjects, createProject, addMember, getProjectTasks, createProjectTask };
