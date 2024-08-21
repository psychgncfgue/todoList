import { getRepository } from 'typeorm';
import { Task } from '../models/taskModel';
import { Status } from '../utils/enums';

interface Subtask {
  id: string;
  title: string;
  status: Status;
}

export const createTask = async (taskData: { title: string; description?: string; subtasks?: Subtask[]; status: Status }) => {
  const taskRepository = getRepository(Task);
  const { subtasks, status } = taskData;

  if (status === Status.COMPLETED && subtasks) {
    subtasks.forEach(subtask => {
      subtask.status = Status.COMPLETED;
    });
  }

  const task = taskRepository.create(taskData);
  return await taskRepository.save(task);
};

export const deleteTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id);
  if (!task) {
    throw new Error('Task not found');
  }
  await taskRepository.remove(task);
};

export const updateTask = async (id: string, updateData: { title?: string; description?: string; subtasks?: Subtask[]; status?: Status }) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id);
  if (!task) {
    throw new Error('Task not found');
  }

  const { subtasks, status } = updateData;

  if (status === Status.COMPLETED) {
    if (subtasks) {
      subtasks.forEach(subtask => {
        subtask.status = Status.COMPLETED;
      });
    }
  }

  Object.assign(task, updateData);
  return await taskRepository.save(task);
};

export const completeTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id);
  if (!task) {
    throw new Error('Task not found');
  }

  task.status = Status.COMPLETED;
  if (task.subtasks) {
    task.subtasks = task.subtasks.map(subtask => ({ ...subtask, status: Status.COMPLETED }));
  }
  return await taskRepository.save(task);
};

export const getTasks = async () => {
  const taskRepository = getRepository(Task);
  return await taskRepository.find();
};
