import { getRepository } from 'typeorm';
import { Task } from '../models/taskModel';
import { Status } from '../utils/enums';

export const createTask = async (taskData: Partial<Task>, parentId?: string) => {
  const taskRepository = getRepository(Task);
  const task = taskRepository.create(taskData);
  
  if (parentId) {
    const parentTask = await taskRepository.findOne(parentId);
    if (parentTask) {
      task.parent = parentTask;
    }
  }
  
  return await taskRepository.save(task);
};

export const deleteTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }
  if (task.subtasks && task.subtasks.length > 0) {
    await taskRepository.remove(task.subtasks);
  }

  await taskRepository.remove(task);
};

export const updateTask = async (id: string, updateData: Partial<Task>) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  Object.assign(task, updateData);
  
  if (task.subtasks) {
    for (const subtask of task.subtasks) {
      if (updateData.status) {
        subtask.status = updateData.status;
      }
    }
    await taskRepository.save(task.subtasks);
  }

  return await taskRepository.save(task);
};

export const completeTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(id, { relations: ['subtasks'] });
  if (!task) {
    throw new Error('Task not found');
  }

  task.status = Status.COMPLETED;

  if (task.subtasks && task.subtasks.length > 0) {
    for (const subtask of task.subtasks) {
      subtask.status = Status.COMPLETED;
    }
    await taskRepository.save(task.subtasks);
  }
  
  return await taskRepository.save(task);
};

export const getTasks = async (parentId: string | null, page = 1, limit = 5, includeSubtasks = false) => {
  const taskRepository = getRepository(Task);

  const whereClause = parentId ? { parentId } : { parentId: null };

  console.log(`Fetching tasks with parentId=${parentId}, page=${page}, limit=${limit}, includeSubtasks=${includeSubtasks}`);
  
  const [tasks, total] = await taskRepository.findAndCount({
    where: whereClause,
    skip: (page - 1) * limit,
    take: limit,
    relations: includeSubtasks ? ['subtasks'] : [],
  });

  console.log(`Tasks found: ${tasks.length}, Total: ${total}`);
  
  return {
    tasks,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};