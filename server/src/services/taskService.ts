import { getRepository } from 'typeorm';
import { Task } from '../models/taskModel';
import { Status } from '../utils/enums';
import { v4 as uuidv4 } from 'uuid';

interface ITask {
  id?: string;
  title: string;
  description?: string;
  status: Status;
  subtasks?: Subtask[];
}

interface Subtask {
  id?: string;
  title: string;
  status: Status;
}

export const createTask = async (taskData: ITask) => {
  const taskRepository = getRepository(Task);
  const task = taskRepository.create(taskData);
  return await taskRepository.save(task);
};

export const deleteTask = async (id: string) => {
  const taskRepository = getRepository(Task);

  const subtasks = await taskRepository.find({ where: { parent: { id } } });
  if (subtasks.length > 0) {
    throw new Error('Cannot delete task with subtasks');
  }

  const task = await taskRepository.findOne(id);
  if (!task) {
    throw new Error('Task not found');
  }
  await taskRepository.remove(task);
};

export const updateTask = async (id: string, updateData: ITask) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id);
  if (!task) {
    throw new Error('Task not found');
  }

  Object.assign(task, updateData);
  return await taskRepository.save(task);
};

export const updateSubtask = async (taskId: string, subtaskId: string, updateData: Subtask) => {
  const taskRepository = getRepository(Task);

  // Ищем подзадачу как отдельную задачу с parent_id = taskId
  const subtask = await taskRepository.findOne(subtaskId, { where: { parent: { id: taskId } } });
  if (!subtask) {
    throw new Error('Subtask not found');
  }

  Object.assign(subtask, updateData);
  return await taskRepository.save(subtask);
};

export const deleteSubtask = async (taskId: string, subtaskId: string) => {
  const taskRepository = getRepository(Task);

  const subtask = await taskRepository.findOne(subtaskId, { where: { parent: { id: taskId } } });
  if (!subtask) {
    throw new Error('Subtask not found');
  }

  await taskRepository.remove(subtask);
};

export const completeTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  task.status = Status.COMPLETED;
  if (task.subtasks) {
    for (const subtask of task.subtasks) {
      subtask.status = Status.COMPLETED;
    }
  }
  return await taskRepository.save(task);
};

export const getTasks = async () => {
  const taskRepository = getRepository(Task);

  const tasks = await taskRepository.find({ where: { parent: null }, relations: ['subtasks'] });
  
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    subtasksCount: task.subtasks ? task.subtasks.length : 0,
  }));
};

export const getSubtasks = async (taskId: string, page: number) => {
  const taskRepository = getRepository(Task);
  const limit = 5;
  const offset = (page - 1) * limit;

  const [subtasks, totalSubtasks] = await Promise.all([
    taskRepository.find({
      where: { parent: { id: taskId } },
      skip: offset,
      take: limit,
    }),
    taskRepository.count({ where: { parent: { id: taskId } } })
  ]);

  const totalPages = Math.ceil(totalSubtasks / limit);

  return {
    subtasks,
    currentPage: page,
    totalPages,
  };
};

export const addSubtask = async (taskId: string, subtaskData: Subtask) => {
  const taskRepository = getRepository(Task);

  const parentTask = await taskRepository.findOne(taskId);
  if (!parentTask) {
    throw new Error('Task not found');
  }

  const newSubtask = taskRepository.create({
    ...subtaskData,
    id: uuidv4(),
    parent: parentTask
  });

  return await taskRepository.save(newSubtask);
};

export const completeTaskWithSubtasks = async (taskId: string) => {
  const taskRepository = getRepository(Task);

  // Найдем задачу вместе с её подзадачами
  const task = await taskRepository.findOne(taskId, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  // Обновляем статус задачи
  task.status = Status.COMPLETED;

  // Обновляем статус всех подзадач
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(subtask => {
      subtask.status = Status.COMPLETED;
    });

    // Сохраняем подзадачи
    await taskRepository.save(task.subtasks);
  }

  // Сохраняем основную задачу
  return await taskRepository.save(task);
};

export const getTaskWithSubtasks = async (taskId: string) => {
  const taskRepository = getRepository(Task);

  // Находим задачу вместе с подзадачами
  const task = await taskRepository.findOne(taskId, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  return task;
};

export const deleteTaskWithSubtasks = async (taskId: string) => {
  const taskRepository = getRepository(Task);

  // Находим задачу вместе с подзадачами
  const task = await taskRepository.findOne(taskId, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  // Удаляем подзадачи, если они существуют
  if (task.subtasks && task.subtasks.length > 0) {
    await taskRepository.remove(task.subtasks);
  }

  // Удаляем основную задачу
  await taskRepository.remove(task);
};