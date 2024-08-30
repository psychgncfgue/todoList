import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { validateTaskAndSubtasks, validateCompleteTask } from '../middlewares/validate';

const router = Router();

router.post('/tasks', validateTaskAndSubtasks, taskController.createTask);
router.delete('/tasks/:id', taskController.deleteTask);
router.put('/tasks/:id', validateTaskAndSubtasks, taskController.updateTask);
router.patch('/tasks/:id/complete', validateCompleteTask, taskController.completeTask);
router.get('/tasks', taskController.getTasks);

export default router;