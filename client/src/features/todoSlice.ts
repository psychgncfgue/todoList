import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Todo {
  id: string;
  title: string;
  description: string;
  subtasks: { id: string; title: string; status: 'waiting' | 'completed' }[];
  status: 'waiting' | 'completed';
}

interface TodoState {
  tasks: Todo[];
  editingTodo: Todo | null;
}

const initialState: TodoState = {
  tasks: [],
  editingTodo: null
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setTodos(state, action: PayloadAction<Todo[]>) {
      state.tasks = action.payload;
    },
    setEditingTodo(state, action: PayloadAction<Todo | null>) {
      state.editingTodo = action.payload;
    },
    addTodo(state, action: PayloadAction<Todo>) {
      state.tasks.push(action.payload);
    },
    updateTodo(state, action: PayloadAction<Todo>) {
      const index = state.tasks.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTodo(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(todo => todo.id !== action.payload);
    }
  }
});

export const { setTodos, setEditingTodo, addTodo, updateTodo, deleteTodo } = todoSlice.actions;
export default todoSlice.reducer;