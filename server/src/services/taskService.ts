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
  const loadTaskWithSubtasks = async (taskId: string): Promise<Task> => {
    const task = await taskRepository.findOne(taskId, { relations: ['subtasks'] });
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.subtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        const loadedSubtask = await loadTaskWithSubtasks(subtask.id);
        subtask.subtasks = loadedSubtask.subtasks;
      }
    }
    return task;
  };
  const task = await loadTaskWithSubtasks(id);
  Object.assign(task, {
    title: updateData.title || task.title,
    description: updateData.description || task.description,
    status: updateData.status || task.status,
  });
  const updateStatusRecursively = (task: Task, newStatus: Status): void => {
    if (newStatus) {
      task.status = newStatus; 
    }
    if (task.subtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        subtask.status = newStatus;
        updateStatusRecursively(subtask, newStatus);
      }
    }
  };
  if (updateData.status) {
    updateStatusRecursively(task, updateData.status);
  }
  return await taskRepository.save(task);
};

export const completeTask = async (id: string) => {
  const taskRepository = getRepository(Task);
  const loadTaskWithSubtasks = async (taskId: string): Promise<Task> => {
    const task = await taskRepository.findOne(taskId, { relations: ['subtasks'] });
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.subtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        const loadedSubtask = await loadTaskWithSubtasks(subtask.id);
        subtask.subtasks = loadedSubtask.subtasks; 
      }
    }
    return task;
  };
  const task = await loadTaskWithSubtasks(id);
  const updateStatusRecursively = (task: Task): void => {
    task.status = Status.COMPLETED;

    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => updateStatusRecursively(subtask));
    }
  };
  updateStatusRecursively(task);
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
  const tasksWithSubtasksCount = await Promise.all(
    tasks.map(async (task) => {
      const subtasksCount = await getSubtasksCount(task.id);
      return {
        ...task,
        subtasksCount,  
      };
    })
  );
  return {
    tasks: tasksWithSubtasksCount,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

const getSubtasksCount = async (taskId: string): Promise<number> => {
  const taskRepository = getRepository(Task);
  const subtasks = await taskRepository.find({ where: { parentId: taskId } });
  if (subtasks.length === 0) {
    return 0;
  }
  const subtasksCount = await Promise.all(subtasks.map(subtask => getSubtasksCount(subtask.id)));
  return subtasks.length + subtasksCount.reduce((acc, count) => acc + count, 0);
};