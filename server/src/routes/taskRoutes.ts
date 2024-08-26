import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { validateTaskCreation, validateSubtaskCreation } from '../middlewares/validate';

const router = Router();

router.post('/tasks', validateTaskCreation, taskController.createTask);
router.post('/tasks/:id/subtasks', validateSubtaskCreation, taskController.addSubtask);
router.delete('/tasks/:id', taskController.deleteTask);
router.put('/tasks/:id', validateTaskCreation, taskController.updateTask);
router.patch('/tasks/:id/subtasks/:subtaskId', validateSubtaskCreation, taskController.updateSubtask);
router.delete('/tasks/:id/subtasks/:subtaskId', taskController.deleteSubtask);
router.patch('/tasks/:id/complete', taskController.completeTask);
router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id/subtasks', taskController.getSubtasks);

export default router;