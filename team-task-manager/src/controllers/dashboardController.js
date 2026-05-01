const Task = require('../models/Task');
const ProjectMember = require('../models/ProjectMember');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get project IDs user has access to
    let projectIds = [];
    if (req.user.role === 'admin') {
      // Global admins see all tasks across all projects
    } else {
      const memberships = await ProjectMember.find({ user_id: userId });
      projectIds = memberships.map(m => m.project_id);
    }
    
    const taskQuery = req.user.role === 'admin' ? {} : {
      $or: [
        { project_id: { $in: projectIds } },
        { assignee_id: userId }
      ]
    };

    // 1. Total tasks
    const totalTasks = await Task.countDocuments(taskQuery);

    // 2. Overdue tasks (due_date < now AND status != done)
    const overdueTasks = await Task.countDocuments({
      ...taskQuery,
      status: { $ne: 'done' },
      due_date: { $lt: new Date() }
    });

    // 3. Tasks by status
    const statusCounts = await Task.aggregate([
      { $match: taskQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const tasksByStatus = {
      todo: 0,
      in_progress: 0,
      done: 0
    };
    
    statusCounts.forEach(stat => {
      if (tasksByStatus[stat._id] !== undefined) {
        tasksByStatus[stat._id] = stat.count;
      }
    });

    // 4. My assigned tasks
    const myTasks = await Task.find({ assignee_id: userId })
      .populate('project_id', 'name')
      .sort({ due_date: 1 })
      .limit(10);

    res.json({
      totalTasks,
      overdueTasks,
      tasksByStatus,
      myAssignedTasks: myTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardStats };
