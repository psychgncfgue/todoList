// todoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, Subtask, TodoState } from '../types/interfaces';

const ITEMS_PER_PAGE = 5;


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

    updateTodo(state, action: PayloadAction<Todo>) {
      const index = state.tasks.findIndex(todo => todo.id === action.payload.id);

      if (index !== -1) {
        const existingTodo = state.tasks[index];

        // Обновление основной задачи
        state.tasks[index] = {
          ...existingTodo,
          ...action.payload,
          subtasksCount: action.payload.subtasks?.length || existingTodo.subtasksCount // Оставляем прежнее значение, если нет новых данных
        };

        // Обновление подзадач, если они есть
        if (action.payload.subtasks) {
          state.tasks[index].subtasks = action.payload.subtasks;

          if (state.tasks[index].isExpanded) {
            // Если задача развернута, обновляем подзадачи
            state.tasks[index].loadedSubtasks = action.payload.subtasks.slice(0, ITEMS_PER_PAGE);
            state.tasks[index].currentPage = 1;
            state.tasks[index].totalPages = Math.ceil(action.payload.subtasks.length / ITEMS_PER_PAGE);
          } else {
            // Если задача свернута, очищаем загруженные подзадачи
            state.tasks[index].loadedSubtasks = [];
            state.tasks[index].currentPage = 1;
            state.tasks[index].totalPages = 1;
          }
        }
      }
    },
    
    deleteTodo(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(todo => todo.id !== action.payload);
    },
    
    loadSubtasks(state, action: PayloadAction<{ id: string; loadedSubtasks: Subtask[]; currentPage: number; totalPages: number }>) {
      const { id, loadedSubtasks, currentPage, totalPages } = action.payload;
      const todo = state.tasks.find(todo => todo.id === id);
      if (todo) {
        todo.loadedSubtasks = loadedSubtasks;
        todo.currentPage = currentPage;
        todo.totalPages = totalPages;
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
        state.tasks[index].status = 'completed'; // Обновляем только статус
      }
    },

    triggerDataRefresh(state) {
      state.needsRefresh = !state.needsRefresh; // Устанавливаем флаг, чтобы сигнализировать о необходимости перезапроса
    },
  }
});

export const { setTodos, setEditingTodo, addTodo, updateTodo, deleteTodo, loadSubtasks, toggleExpand, setCurrentPage, completeTodo, triggerDataRefresh } = todoSlice.actions;
export default todoSlice.reducer;