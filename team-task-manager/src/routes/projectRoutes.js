const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  createProject, 
  addMember, 
  getProjectTasks, 
  createProjectTask 
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { projectAdminOnly, adminOnly } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional()
  })
});

const addMemberSchema = z.object({
  body: z.object({
    user_id: z.string().min(1, 'User ID is required'),
    role: z.enum(['admin', 'member']).optional()
  }),
  params: z.object({
    id: z.string()
  })
});

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignee_id: z.string().nullable().optional(),
    due_date: z.string().datetime().optional()
  }),
  params: z.object({
    id: z.string()
  })
});

router.use(protect); // All project routes require auth

router.route('/')
  .get(getProjects)
  .post(validate(createProjectSchema), createProject);

router.post('/:id/members', validate(addMemberSchema), projectAdminOnly, addMember);

router.route('/:id/tasks')
  .get(getProjectTasks)
  .post(validate(createTaskSchema), createProjectTask);

module.exports = router;
