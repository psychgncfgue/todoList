import { Todo } from "../types/interfaces";
import { PAGE_SIZE } from "../types/interfaces";

// Эта функция рекурсивно обновляет данные объекта pagination для каждой задачи при переходе по страницам пагинации
export const updateNestedTaskPagination = (
  tasks: Todo[],
  parentId: string,
  updatedSubtasks: Todo[],
  currentPage: number,
  totalPages: number,
  totalFromServer: number
): Todo[] => {
  return tasks.map(task => {
    if (task.id === parentId) {
      return {
        ...task,
        expandedSubtasks: {
          tasks: updatedSubtasks,
          pagination: {
            total: totalFromServer,
            currentPage,
            totalPages,
          },
        },
      };
    }
    if (task.expandedSubtasks?.tasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: updateNestedTaskPagination(
            task.expandedSubtasks.tasks,
            parentId,
            updatedSubtasks,
            currentPage,
            totalPages,
            totalFromServer
          ),
        },
      };
    }
    return task;
  });
};

// Эта функция обновляет объект пагинации для родительского списка задач, то есть задач не являющихся чьими-то подзадачами
export const updateMainTasksPagination = (
  tasks: { tasks: Todo[]; pagination: { total: number; totalPages: number; currentPage: number } },
  updatedTasks: Todo[],
  currentPage: number,
  totalPages: number,
  totalFromServer: number
) => {
  return {
    ...tasks,
    tasks: updatedTasks,
    pagination: {
      total: totalFromServer,
      currentPage,
      totalPages,
    },
  };
};

// Эта функция устанавливает начальные данные для раскрытого списка подзадач для конкретной задачи в иерархии
export const updateNestedTask = (
  tasks: Todo[],
  taskId: string,
  updatedSubtasks: Todo[],
  currentPage: number,
  totalPages: number,
  total: number
): Todo[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return {
        ...task,
        isExpanded: true,
        expandedSubtasks: {
          tasks: updatedSubtasks,
          pagination: {
            total,
            totalPages,
            currentPage,
          },
        },
      };
    }
    if (task.expandedSubtasks?.tasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: updateNestedTask(
            task.expandedSubtasks.tasks,
            taskId,
            updatedSubtasks,
            currentPage,
            totalPages,
            total
          ),
        },
      };
    }
    return task;
  });
};

// Эта функция обновляет данные конкретной задачи в иерархии при обновлении полей задачи на сервере
export const updateTodoWithChildren = (
  tasks: Todo[],
  targetId: string | null,
  newStatus: 'waiting' | 'completed'
): Todo[] => {
  return tasks.map(task => {
    if (task.id === targetId || targetId === null) {
      return {
        ...task,
        status: newStatus,
        expandedSubtasks: task.expandedSubtasks
          ? {
            ...task.expandedSubtasks,
            tasks: updateTodoWithChildren(task.expandedSubtasks.tasks, null, newStatus),
          }
          : undefined,
      };
    }
    if (task.expandedSubtasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: updateTodoWithChildren(task.expandedSubtasks.tasks, targetId, newStatus),
        },
      };
    }
    return task;
  });
};

// Эта функция закрывает состояние раскрытости списка подзадач для конкретной задачи в иерархии
  export const collapseNestedTask = (tasks: Todo[], id: string): Todo[] => {
    return tasks.map(todo => {
      if (todo.id === id) {
        return {
          ...todo,
          expandedSubtasks: null,
          isExpanded: false,
        };
      }
      if (todo.expandedSubtasks && todo.expandedSubtasks.tasks) {
        return {
          ...todo,
          expandedSubtasks: {
            ...todo.expandedSubtasks,
            tasks: collapseNestedTask(todo.expandedSubtasks.tasks, id),
          },
        };
      }
      return todo;
    });
  };

// Эта функция изменяет данные раскрытого списка подзадач при добавлении подзадачи, как массив раскрытых подзадач так и пагинацию для конкретной задачи в иерархии
export const addSubtaskToTree = (tasks: Todo[], newTodo: Todo, total: number): Todo[] => {
  const { parentId } = newTodo;
  return tasks.map(task => {
    if (task.id === parentId) {
      const expandedSubtasks = task.expandedSubtasks || {
        tasks: [],
        pagination: { total: 0, totalPages: 1, currentPage: 1 },
      };
      const subtasks = expandedSubtasks.tasks || [];
      const pagination = expandedSubtasks.pagination;
      const newTotal = pagination.total + 1; 
      const updatedTotalPages = Math.ceil(newTotal / PAGE_SIZE);
      let updatedTasks = subtasks;
      if (subtasks.length < PAGE_SIZE) {
        updatedTasks = [...subtasks, newTodo];
      }
      return {
        ...task,
        expandedSubtasks: {
          tasks: updatedTasks,
          pagination: {
            ...pagination,
            total: newTotal,
            totalPages: updatedTotalPages,
          },
        },
      };
    }
    if (task.expandedSubtasks?.tasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: addSubtaskToTree(
            task.expandedSubtasks.tasks,
            newTodo,
            task.expandedSubtasks.pagination.total
          ),
        },
      };
    }
    return task;
  });
};

export const addTodoToMainList = (
  tasks: Todo[],
  newTodo: Todo,
  pagination: { total: number; totalPages: number; currentPage: number },
  totalOnLastPage: number
): { tasks: Todo[]; pagination: { total: number; totalPages: number; currentPage: number } } => {
  const { totalPages, currentPage } = pagination;
  const newTotal = totalOnLastPage;
  const updatedTotalPages = Math.ceil(newTotal / PAGE_SIZE);
  let updatedTasks = [...tasks];
  let newTotalPages = pagination.totalPages;
  if (updatedTotalPages === totalPages && tasks.length < PAGE_SIZE) {
    updatedTasks.push(newTodo);
  } else if (updatedTotalPages > totalPages && tasks.length >= PAGE_SIZE) {
    newTotalPages = updatedTotalPages
  } else if ( totalPages === 0 ) {
    updatedTasks.push(newTodo);
    newTotalPages = pagination.totalPages + 1;
  }
  console.log(updatedTasks)
  return {
    tasks: updatedTasks,
    pagination: {
      total: newTotal,
      totalPages: newTotalPages,
      currentPage,
    },
  };
};

// Эта функция занимается удалением конкретной задачи/подзадачи по айди из дерева иерархии
// Так же, как и функция выше, обновляет данные списка подзадач и пагинации списка после удаления
export function deleteSubtaskFromTree(
  tasks: Todo[],
  idToDelete: string,
  updatedPageData?: { tasks: Todo[]; total: number; totalPages: number; currentPage: number }
): Todo[] {
  return tasks.map(task => {
    if (task.expandedSubtasks?.tasks.some(subtask => subtask.id === idToDelete)) {
      const updatedSubtasks = updatedPageData?.tasks.map(subtask => {
        const existingSubtask = task.expandedSubtasks?.tasks.find(t => t.id === subtask.id);
        return {
          ...subtask,
          isExpanded: existingSubtask?.isExpanded || false, 
          expandedSubtasks: existingSubtask?.expandedSubtasks || undefined, 
        };
      }) || task.expandedSubtasks.tasks.filter(subtask => subtask.id !== idToDelete);
      const updatedPagination = updatedPageData
        ? {
            total: updatedPageData.total,
            totalPages: updatedPageData.totalPages,
            currentPage: updatedPageData.currentPage,
          }
        : task.expandedSubtasks.pagination;
      return {
        ...task,
        expandedSubtasks: {
          tasks: updatedSubtasks,
          pagination: updatedPagination,
        },
        subtasksCount: (task.subtasksCount || 0) - 1,
      };
    }
    if (task.expandedSubtasks?.tasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: deleteSubtaskFromTree(task.expandedSubtasks.tasks, idToDelete, updatedPageData),
        },
      };
    }
    return task;
  });
}
// Эта функция удаляет задачу из родительского массива задач, то есть из списка задач, которые не являются чьими-то подзадачами, учитывая пагинацию как и функция выше
export function deleteTaskFromMainArray(
  tasks: { tasks: Todo[]; pagination: { total: number; totalPages: number; currentPage: number } },
  idToDelete: string,
  updatedPageData?: { tasks: Todo[]; total: number; totalPages: number; currentPage: number }
): { tasks: Todo[]; pagination: { total: number; totalPages: number; currentPage: number } } {
  if (updatedPageData) {
    if (updatedPageData.tasks.length < 5) {
      const updatedTasks = tasks.tasks.filter(task => task.id !== idToDelete);
      const { total, totalPages } = updatedPageData; 
      const newTotal = total;
      const updatedPagination = {
        total: newTotal,
        totalPages: totalPages,
        currentPage: tasks.pagination.currentPage, 
      };
      return {
        tasks: updatedTasks,
        pagination: updatedPagination,
      };
    }
    if (tasks.tasks.length === 5) {
      const updatedTasks = [...tasks.tasks];
      const lastTaskFromUpdated = updatedTasks.filter(task => task.id !== idToDelete);
      let updatedArray;
      if (lastTaskFromUpdated.length < 5) {
        updatedArray = [...lastTaskFromUpdated, updatedPageData.tasks[4]]
      }
      return {
        tasks: updatedArray || updatedTasks,
        pagination: {
          total: updatedPageData.total,
          totalPages: updatedPageData.totalPages,
          currentPage: updatedPageData.currentPage,
        },
      };
    }
  }
  const updatedTasks = tasks.tasks.filter(task => task.id !== idToDelete);
  const { total, currentPage } = tasks.pagination;
  const newTotal = total - 1;
  const updatedPagination = {
    total: newTotal,
    totalPages: Math.max(Math.ceil(newTotal / 5), 1),
    currentPage: Math.min(currentPage, Math.max(Math.ceil(newTotal / 5), 1)), 
  };
  return {
    tasks: updatedTasks,
    pagination: updatedPagination,
  };
}

// Эта функция занимается изменением числа общего количества подзадач(subtasksCount) у всех задач в иерархии при добавлении или удалении подзадачи
// Эта функция работает в обе стороны, в зависимости от передаваемого в неё флага - true прибавляет, false убавляет
export function updateSubtasksCount(
  tasks: Todo[],
  parentId: string,
  increment: boolean,
  deletedSubtaskSubtasksCount?: number,
): Todo[] {
  return tasks.map(task => {
    if (task.id === parentId) {
      const subtasksToSubtract = deletedSubtaskSubtasksCount ?? 0;
      return {
        ...task,
        subtasksCount: (task.subtasksCount || 0) + (increment ? 1 : -(subtasksToSubtract)),
      };
    } else if (task.expandedSubtasks?.tasks?.length) {
      const updatedSubtasks = updateSubtasksCount(
        task.expandedSubtasks.tasks,
        parentId,
        increment,
        deletedSubtaskSubtasksCount,
      );
      const isSubtasksUpdated = updatedSubtasks !== task.expandedSubtasks.tasks;
      if (isSubtasksUpdated) {
        const subtasksToSubtract = deletedSubtaskSubtasksCount ?? 0;
        return {
          ...task,
          subtasksCount: (task.subtasksCount || 0) + (increment ? 1 : -(1 + subtasksToSubtract)),
          expandedSubtasks: {
            ...task.expandedSubtasks,
            tasks: updatedSubtasks,
          },
        };
      }
      return task;
    }
    return task;
  });
}

// Это вспомогательная функция находит в состоянии родительскую задачу для удаляемых/добавляемых/редактируемых подзадач
export const findParentTask = (tasks: Todo[], parentId: string | null | undefined): Todo | undefined => {
  if (!parentId) return undefined;
  for (const task of tasks) {
    if (task.id === parentId) {
      return task;
    }
    if (task.expandedSubtasks?.tasks) {
      const foundInSubtasks = findParentTask(task.expandedSubtasks.tasks, parentId);
      if (foundInSubtasks) {
        return foundInSubtasks;
      }
    }
  }

  return undefined;
};

// Эта функция обновляет данные конкретной задачи при изменении её полей в меню редактирования
export const updateTodoWithTitleAndDescription = (
  tasks: Todo[],
  targetId: string,
  newTitle: string,
  newDescription: string
): Todo[] => {
  return tasks.map(task => {
    if (task.id === targetId) {
      return {
        ...task,
        title: newTitle,
        description: newDescription,
        expandedSubtasks: task.expandedSubtasks
          ? {
            ...task.expandedSubtasks,
            tasks: updateTodoWithTitleAndDescription(task.expandedSubtasks.tasks, targetId, newTitle, newDescription),
          }
          : undefined,
      };
    }
    if (task.expandedSubtasks) {
      return {
        ...task,
        expandedSubtasks: {
          ...task.expandedSubtasks,
          tasks: updateTodoWithTitleAndDescription(
            task.expandedSubtasks.tasks,
            targetId,
            newTitle,
            newDescription
          ),
        },
      };
    }
    return task;
  });
};