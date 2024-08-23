import { Request, Response } from 'express';
import * as taskService from '../services/taskService';
import { Status } from '../utils/enums';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, subtasks, status } = req.body;

    const task = await taskService.createTask({ title, description, subtasks, status });
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
    const { title, description, subtasks, status } = req.body;

    const task = await taskService.updateTask(id, { title, description, subtasks, status });
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
    const tasks = await taskService.getTasks();
    return res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};


export const getSubtasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;

    const subtasksData = await taskService.getSubtasks(id, page);
    return res.status(200).json({
      subtasks: subtasksData.subtasks, // Подзадачи для текущей страницы
      currentPage: subtasksData.currentPage, // Текущая страница
      totalPages: subtasksData.totalPages, // Общее количество страниц
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};