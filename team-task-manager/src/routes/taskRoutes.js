const express = require('express');
const router = express.Router();
const { updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { projectAdminOnly } = require('../middleware/roles');
const { validate } = require('../middleware/validate');
const { z } = require('zod');

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().optional(),
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

router.use(protect);

router.patch('/:id', validate(updateTaskSchema), updateTask);

// Delete task needs admin privileges (either global admin or project admin)
// For projectAdminOnly middleware to work on /tasks/:id, it needs the project_id.
// To simplify, we will modify projectAdminOnly to fetch project_id from Task if needed,
// but for now, we'll pass it in body or we can update taskController to check internally.
// As per prompt: "only Admin can delete tasks/projects" - we can assume global admin.
// But to be flexible, we'll implement a quick check in controller or just use adminOnly middleware.
const { adminOnly } = require('../middleware/roles');

router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
