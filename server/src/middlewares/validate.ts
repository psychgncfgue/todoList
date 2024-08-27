import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';
import { Status } from '../utils/enums';
import { Task } from '../models/taskModel';
import { getRepository } from 'typeorm';

export const validateTaskCreation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid status'),
  check('subtasks').isArray().optional(),
  check('subtasks.*.title').notEmpty().withMessage('Subtask title is required'),
  check('subtasks.*.status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid subtask status'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateSubtaskCreation = [
  check('title').notEmpty().withMessage('Subtask title is required'),
  check('status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid subtask status'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Получаем главную задачу из базы данных по ID
      const taskRepository = getRepository(Task);
      const task = await taskRepository.findOne(id);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Если статус главной задачи COMPLETED, установите статус подзадачи в COMPLETED
      if (task.status === Status.COMPLETED) {
        req.body.status = Status.COMPLETED; // Принудительно установить статус подзадачи в COMPLETED
      }

      // Убедитесь, что статус подзадачи не является "waiting", если задача завершена
      if (task.status === Status.COMPLETED && req.body.status === Status.WAITING) {
        req.body.status = Status.COMPLETED;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      next();
    } catch (error) {
      console.error('Error validating subtask:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
];