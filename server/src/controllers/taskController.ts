import { Request, Response } from 'express';
import * as taskService from '../services/taskService';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, subtasks, status } = req.body;

    // Создание основной задачи
    const task = await taskService.createTask({ title, description, status });

    // Если есть подзадачи, нужно их добавить
    if (subtasks && subtasks.length > 0) {
      for (const subtask of subtasks) {
        await taskService.addSubtask(task.id, subtask);
      }
    }

    const updatedTask = await taskService.getTaskWithSubtasks(task.id);
    return res.status(201).json(updatedTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await taskService.deleteTaskWithSubtasks(id);
    return res.status(200).json({ message: 'Task and subtasks deleted' });
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

export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const { id: taskId, subtaskId } = req.params;
    const { title, status } = req.body;

    const updatedSubtask = await taskService.updateSubtask(taskId, subtaskId, { title, status });
    return res.status(200).json(updatedSubtask);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      if (error.message === 'Task not found' || error.message === 'Subtask not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const { id: taskId, subtaskId } = req.params;
    await taskService.deleteSubtask(taskId, subtaskId);
    return res.status(200).json({ message: 'Subtask deleted' });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      if (error.message === 'Task not found' || error.message === 'Subtask not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await taskService.completeTaskWithSubtasks(id);
    return res.status(200).json({ message: 'Task and subtasks completed' });
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
      subtasks: subtasksData.subtasks, 
      currentPage: subtasksData.currentPage, 
      totalPages: subtasksData.totalPages, 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const addSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;

    // Добавление подзадачи
    const updatedTask = await taskService.addSubtask(id, { title, status });
    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Server error' });
  }
};
