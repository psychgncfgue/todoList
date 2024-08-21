import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';
import { Status } from '../utils/enums';

export const validateTaskCreation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('status').isIn([Status.WAITING, Status.COMPLETED]).withMessage('Invalid status'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];