import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';
import { Status } from '../utils/enums';
import { Task } from '../models/taskModel';
import dataSource from '../config/database';

export const validateTaskAndSubtasks = [
  check('title').notEmpty().withMessage('Title is required'),
  check('status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid status'),
  check('parentId').optional().isUUID().withMessage('Invalid parent ID'),
  check('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
  check('subtasks.*.title').optional().notEmpty().withMessage('Subtask title is required'),
  check('subtasks.*.status').optional().isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid subtask status'),

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { parentId } = req.body;
      if (parentId) {
        const taskRepository = dataSource.getRepository(Task);
        const parentTask = await taskRepository.findOne({
          where: { id: parentId } // Указаны условия для поиска задачи по ID
        });

        if (!parentTask) {
          return res.status(404).json({ error: 'Parent task not found' });
        }
        if (parentTask.status === Status.COMPLETED) {
          req.body.status = Status.COMPLETED;
        }
      }
      const updatedErrors = validationResult(req);
      if (!updatedErrors.isEmpty()) {
        return res.status(400).json({ errors: updatedErrors.array() });
      }
      next();
    } catch (error) {
      console.error('Error during validation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
];

export const validateCompleteTask = [
  check('status').isIn([Status.COMPLETED]).withMessage('Invalid status'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    } catch (error) {
      console.error('Error during validation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];