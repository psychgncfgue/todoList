import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';
import { Status } from '../utils/enums';
import { Task } from '../models/taskModel';
import { getRepository } from 'typeorm';

export const validateTaskAndSubtasks = [
  // Общие проверки для создания или обновления задачи
  check('title').notEmpty().withMessage('Title is required'),
  check('status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid status'),
  // Проверка наличия ID родительской задачи (если применимо)
  check('parentId').optional().isUUID().withMessage('Invalid parent ID'),
  // Проверка подзадач (если есть)
  check('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
  check('subtasks.*.title').optional().notEmpty().withMessage('Subtask title is required'),
  check('subtasks.*.status').optional().isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid subtask status'),
  
  // Функция проверки
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Проверка на ошибки в запросе
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Если есть ID родительской задачи, проверяем его существование
      const { parentId } = req.body;
      if (parentId) {
        const taskRepository = getRepository(Task);
        const parentTask = await taskRepository.findOne(parentId);

        if (!parentTask) {
          return res.status(404).json({ error: 'Parent task not found' });
        }

        // Если родительская задача завершена, устанавливаем статус подзадачи в COMPLETED
        if (parentTask.status === Status.COMPLETED) {
          req.body.status = Status.COMPLETED; // Принудительно установить статус подзадачи в COMPLETED
        }
      }

      // Проверка на ошибки после обработки данных
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