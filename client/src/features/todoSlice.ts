import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, TodoState } from '../types/interfaces';

export const ITEMS_PER_PAGE = 5;


const updatePagination = (todo: Todo, level: string, subtasks: Todo[], currentPage: number) => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  todo.pagination = todo.pagination || {};
  todo.pagination[level] = {
    subtasks: subtasks.slice(startIndex, endIndex),
    currentPage: currentPage,
    totalPages: Math.ceil(subtasks.length / ITEMS_PER_PAGE)
  };
  todo.subtasks?.forEach(subtask => {
    if (subtask.isExpanded) {
      updatePagination(subtask, subtask.id, subtask.rawSubtasks || [], currentPage);
    }
  });
};

export const getPagedSubtasks = (todo: Todo, level: string): Todo[] => {
  if (todo.pagination && todo.pagination[level]) {
    return todo.pagination[level].subtasks;
  }
  return [];
};


const initialState: TodoState = {
  tasks: [],
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
    updateTodo(state, action: PayloadAction<Partial<Todo> & { id: string }>) {
      const index = state.tasks.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) {
        const existingTodo = state.tasks[index];
        console.log('Before update:', state.tasks[index].isExpanded);
        const updatedTodo = {
          ...existingTodo,
          ...action.payload,
          subtasksCount: action.payload.subtasksCount !== undefined 
            ? action.payload.subtasksCount 
            : existingTodo.subtasksCount,
          isExpanded: action.payload.isExpanded !== undefined 
            ? action.payload.isExpanded 
            : existingTodo.isExpanded,
          rawSubtasks: action.payload.subtasks !== undefined 
            ? action.payload.subtasks 
            : existingTodo.rawSubtasks,
        };
    
        if (action.payload.subtasks) {
          if (action.payload.isExpanded) {
            const level = action.payload.id; 
            const startIndex = (action.payload.currentPage! - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            updatedTodo.loadedSubtasks = action.payload.subtasks.slice(startIndex, endIndex);
            updatedTodo.currentPage = action.payload.currentPage || 1;
            updatedTodo.totalPages = Math.ceil(action.payload.subtasks.length / ITEMS_PER_PAGE);
            updatedTodo.pagination = updatedTodo.pagination || {};
            updatedTodo.pagination[level] = {
              subtasks: updatedTodo.loadedSubtasks,
              currentPage: updatedTodo.currentPage,
              totalPages: updatedTodo.totalPages,
            };
            updatePagination(state.tasks[index], level, action.payload.subtasks, action.payload.currentPage || 1);
          } else {
            updatedTodo.loadedSubtasks = [];
            updatedTodo.currentPage = 1;
            updatedTodo.totalPages = 1;
            updatedTodo.pagination = updatedTodo.pagination || {};
            updatedTodo.pagination[action.payload.id] = {
              subtasks: [],
              currentPage: 1,
              totalPages: 1,
            };
          }
        }
        console.log('Updated todo:', updatedTodo);
        state.tasks[index] = updatedTodo;
        console.log('After update:', state.tasks[index].isExpanded);
      }
    },
    
    deleteTodo(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(todo => todo.id !== action.payload);
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