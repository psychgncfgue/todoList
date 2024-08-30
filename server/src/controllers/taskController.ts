import { Request, Response } from 'express';
import * as taskService from '../services/taskService';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, parentId } = req.body;
    const task = await taskService.createTask({ title, description, status }, parentId);
    return res.status(201).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id);
    return res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const task = await taskService.updateTask(id, { title, description, status });
    return res.status(200).json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await taskService.completeTask(id);
    return res.status(200).json({ message: 'Task completed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { parentId, page, limit, includeSubtasks } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 5;

    const parentIdParsed = parentId === 'undefined' || parentId === 'null' || !parentId 
      ? null 
      : (parentId as string);

    const includeSubtasksFlag = includeSubtasks === 'true';

    console.log(`Received request with parentId=${parentIdParsed}, page=${pageNum}, limit=${limitNum}, includeSubtasks=${includeSubtasksFlag}`);
    
    const tasks = await taskService.getTasks(parentIdParsed, pageNum, limitNum, includeSubtasksFlag);
    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

