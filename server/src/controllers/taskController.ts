import { Request, Response } from 'express';
import * as taskService from '../services/taskService';

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
    const { title, description, status } = req.body; // Убираем subtasks

    // Обновляем только title, description и status
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

export const addSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // ID задачи
    const { title, status } = req.body; // Данные подзадачи

    // Добавление подзадачи
    const updatedTask = await taskService.addSubtask(id, { title, status });
    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      // Проверяем, если ошибка является экземпляром Error
      if (error.message === 'Task not found') {
        return res.status(404).json({ error: 'Task not found' });
      }
      // Возвращаем сообщение об ошибке, если ошибка является экземпляром Error
      return res.status(500).json({ error: error.message });
    }
    // Обрабатываем случай, когда ошибка не является экземпляром Error
    return res.status(500).json({ error: 'Server error' });
  }
};
