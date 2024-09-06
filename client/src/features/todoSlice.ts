import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, TodoState } from '../types/interfaces';
import { produce } from 'immer';

export const ITEMS_PER_PAGE = 5;


export const updateParentTaskCounts = (tasks: Todo[], taskId: string, subtasksCount: number): void => {
  const updateTaskRecursively = (tasks: Todo[], taskId: string, subtasksCount: number) => {
    for (let task of tasks) {
      if (task.id === taskId) {
        task.subtasksCount = subtasksCount;
        return true;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        if (updateTaskRecursively(task.subtasks, taskId, subtasksCount)) {
          const parentSubtasksCount = task.subtasks
            .map(subtask => subtask.subtasksCount || 0)
            .reduce((count, subtaskCount) => count + subtaskCount, 0);
          task.subtasksCount = parentSubtasksCount;
          return true;
        }
      }
    }
    return false;
  };
  updateTaskRecursively(tasks, taskId, subtasksCount);
};

export const getPagedSubtasks = (todo: Todo, level: string): Todo[] => {
  if (todo.pagination && todo.pagination[level]) {
    return todo.pagination[level].subtasks;
  }
  return [];
};


const initialState: TodoState = {
  tasks: [] as Todo[],
  editingTodo: null,
  needsRefresh: false,
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setTodos(state, action: PayloadAction<Todo[]>) {
      state.tasks = action.payload;
      state.needsRefresh = false;
      console.log('Updated state:', state.tasks);
    },
    setEditingTodo(state, action: PayloadAction<Todo | null>) {
      state.editingTodo = action.payload;
    },
    addTodo(state, action: PayloadAction<Todo>) {
      state.tasks.push({
        ...action.payload,
        subtasksCount: action.payload.subtasks?.length || 0,
        loadedSubtasks: [],
        currentPage: 1,
        totalPages: Math.ceil((action.payload.subtasks?.length || 0) / ITEMS_PER_PAGE),
        isExpanded: false
      });
    },
    updateTodo: (state, action: PayloadAction<Partial<Todo> & { id: string }>) => {
      return produce(state, draft => {
        const { id } = action.payload;
        const updateTaskRecursively = (tasks: Todo[], id: string, updates: Partial<Todo>) => {
          for (let task of tasks) {
            if (task.id === id) {
              Object.assign(task, {
                ...updates,
                subtasksCount: updates.subtasksCount !== undefined 
                    ? updates.subtasksCount 
                    : task.subtasksCount,
                isExpanded: updates.isExpanded !== undefined 
                    ? updates.isExpanded 
                    : task.isExpanded,
                currentPage: updates.currentPage !== undefined 
                    ? updates.currentPage 
                    : task.currentPage,
              });
              return true;
            }
            if (task.subtasks && task.subtasks.length > 0) {
              if (updateTaskRecursively(task.subtasks, id, updates)) {
                return true;
              }
            }
          }
          return false;
        };
        updateTaskRecursively(draft.tasks, id, action.payload);
        const updatedTask = draft.tasks.find(task => task.id === id);
        if (updatedTask) {
          updateParentTaskCounts(draft.tasks, id, updatedTask.subtasksCount || 0);
        }
      });
    },
    
  deleteTodo(state, action: PayloadAction<string>) {
    const deleteTaskRecursively = (tasks: Todo[], taskIdToDelete: string): boolean => {
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.id === taskIdToDelete) {
                tasks.splice(i, 1); // Удаляем задачу из массива
                return true;
            }
            if (task.subtasks && task.subtasks.length > 0) {
                if (deleteTaskRecursively(task.subtasks, taskIdToDelete)) {
                    task.subtasksCount = task.subtasks.length; // Обновляем subtasksCount после удаления
                    return true;
                }
            }
        }
        return false;
    };

    deleteTaskRecursively(state.tasks, action.payload);
},
    
    loadSubtasks(state, action: PayloadAction<{ id: string; loadedSubtasks: Todo[]; currentPage: number; totalPages: number, parentId?: string }>) {
      const { id, loadedSubtasks, currentPage, totalPages, parentId } = action.payload;
      const todo = state.tasks.find(todo => todo.id === id);
      if (todo) {
        todo.loadedSubtasks = loadedSubtasks;
        todo.currentPage = currentPage;
        todo.totalPages = totalPages;
        todo.parentId = parentId
      }
    },
    
    toggleExpand(state, action: PayloadAction<{ id: string; isExpanded: boolean }>) {
      const { id, isExpanded } = action.payload;
      const todo = state.tasks.find(todo => todo.id === id);
      if (todo) {
        todo.isExpanded = isExpanded;
        if (!isExpanded) {
          todo.loadedSubtasks = [];
          todo.currentPage = 1;
        }
      }
    },
    
    setCurrentPage(state, action: PayloadAction<{ id: string; currentPage: number }>) {
      const { id, currentPage } = action.payload;
      const todo = state.tasks.find(todo => todo.id === id);
      if (todo) {
        todo.currentPage = currentPage;
      }
    },
    
    completeTodo(state, action: PayloadAction<string>) {
      const index = state.tasks.findIndex(todo => todo.id === action.payload);
      if (index !== -1) {
        state.tasks[index].status = 'completed';
      }
    },

    triggerDataRefresh(state) {
      state.needsRefresh = !state.needsRefresh;
    },
  }
});

export const { setTodos, setEditingTodo, addTodo, updateTodo, deleteTodo, loadSubtasks, toggleExpand, setCurrentPage, completeTodo, triggerDataRefresh } = todoSlice.actions;
export default todoSlice.reducer;