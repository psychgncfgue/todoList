import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { validateTaskCreation } from '../middlewares/validate';

const router = Router();

router.post('/tasks', validateTaskCreation, taskController.createTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.put('/tasks/:id', validateTaskCreation, taskController.updateTask);
router.patch('/tasks/:id/complete', taskController.completeTask);
router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id/subtasks', taskController.getSubtasks);

export default router;