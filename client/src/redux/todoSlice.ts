import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, TodoPagination } from '../types/interfaces';
import { addSubtaskToTree, collapseNestedTask, deleteSubtaskFromTree, updateNestedTask, updateNestedTaskPagination, updateSubtasksCount, updateTodoWithChildren, updateTodoWithTitleAndDescription, updateMainTasksPagination, deleteTaskFromMainArray, addTodoToMainList } from '../utils/todoHelpers';

interface TodoState {
  tasks: TodoPagination;
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  tasks: {
    tasks: [],
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 0
    }
  },
  loading: true,
  error: null,
};


const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    fetchTodosRequest(state) {
      state.loading = true;
    },
    fetchTodosSuccess(state, action: PayloadAction<{ tasks: Todo[]; total: number; totalPages: number; currentPage: number }>) {
      state.loading = false;
      state.tasks.tasks = action.payload.tasks;
      state.tasks.pagination = {
        total: action.payload.total,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
      };
    },
    fetchTodosFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addTodoRequest(state) {
      state.loading = true;
    },
    addTodoSuccess(state, action: PayloadAction<Todo & { totalOnLastPage?: number }>) {
      const newTodo = action.payload;
      const { totalOnLastPage = 0 } = newTodo;
      const { tasks, pagination } = state.tasks;
      if (!newTodo.parentId) {
        const { tasks: updatedTasks, pagination: updatedPagination } = addTodoToMainList(
          tasks,
          newTodo,
          pagination,
          totalOnLastPage
        );
        return {
          ...state,
          tasks: {
            ...state.tasks,
            tasks: updatedTasks,
            pagination: updatedPagination,
          },
          loading: false,
        };
      } else {
        const updatedTasks = addSubtaskToTree(state.tasks.tasks, newTodo, totalOnLastPage);
        const tasksWithUpdatedSubtasksCount = updateSubtasksCount(updatedTasks, newTodo.parentId, true);
        return {
          ...state,
          tasks: {
            ...state.tasks,
            tasks: tasksWithUpdatedSubtasksCount,
          },
          loading: false,
        };
      }
    },
    addTodoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    deleteTodoRequest(state) {
      state.loading = true;
    },
    deleteTodoSuccess(
      state,
      action: PayloadAction<{
        id: string;
        updatedPageData?: { tasks: Todo[]; total: number; totalPages: number; currentPage: number; parentId?: string };
        subtasksCount?: number;
      }>
    ) {
      state.loading = false;
      const { id, updatedPageData, subtasksCount } = action.payload;
      const parentId = updatedPageData?.parentId;
      if (parentId) {
        state.tasks.tasks = deleteSubtaskFromTree(
          state.tasks.tasks,
          id,
          updatedPageData ?? { tasks: [], total: 0, totalPages: 1, currentPage: 1 }
        );
        state.tasks.tasks = updateSubtasksCount(state.tasks.tasks, parentId, false, subtasksCount);
      } else {
        state.tasks = deleteTaskFromMainArray(state.tasks, id, updatedPageData);
      }
    },
    deleteTodoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    completeTodoRequest(state) {
      state.loading = true;
    },
    completeTodoSuccess(state, action: PayloadAction<string>) {
      state.loading = false;
      const taskId = action.payload;
      state.tasks.tasks = updateTodoWithChildren(state.tasks.tasks, taskId, 'completed');
    },
    completeTodoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    editTodoRequest(state) {
      state.loading = true;
    },
    editTodoSuccess(state, action: PayloadAction<Todo>) {
      const updatedTodo = action.payload;
        state.tasks.tasks = updateTodoWithChildren(
          state.tasks.tasks,
          updatedTodo.id,
          updatedTodo.status
        );
        state.tasks.tasks = updateTodoWithTitleAndDescription(
          state.tasks.tasks,
          updatedTodo.id,
          updatedTodo.title,
          updatedTodo.description ?? '',
        );
      state.loading = false;
    },
    editTodoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    pageChangeRequest(state) {
      state.loading = true;
    },
    pageChangeRequestSuccess(
      state,
      action: PayloadAction<{ parentId?: string; todos: Todo[]; page: number; totalPages: number; total: number }>
    ) {
      state.loading = false;
      const { parentId, todos, page, totalPages, total } = action.payload;
    
      if (parentId !== undefined) {
        state.tasks.tasks = updateNestedTaskPagination(
          state.tasks.tasks,
          parentId,
          todos,
          page,
          totalPages,
          total
        );
      } else {
        state.tasks = updateMainTasksPagination(state.tasks, todos, page, totalPages, total);
      }
    },
    pageChangeRequestFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    expandTodoRequest(state) {
      state.loading = true;
    },
    expandTodoSuccess(state, action: PayloadAction<{ taskId: string; tasks: Todo[]; currentPage: number; totalPages: number; total: number }>) {
      const { taskId, tasks, currentPage, totalPages, total } = action.payload;
      state.tasks.tasks = updateNestedTask(
          state.tasks.tasks,
          taskId,
          tasks,
          currentPage,
          totalPages,
          total
      );
      state.loading = false;
  },
    expandTodoFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    collapseTodo(state, action: PayloadAction<string>) {
      const taskId = action.payload;
      state.tasks.tasks = collapseNestedTask(state.tasks.tasks, taskId);
      state.loading = false;
    },
  },
});

export const { 
  fetchTodosRequest,
  fetchTodosSuccess,
  fetchTodosFailure,
  deleteTodoRequest,
  deleteTodoSuccess,
  deleteTodoFailure,
  completeTodoRequest,
  completeTodoSuccess,
  completeTodoFailure,
  editTodoRequest,
  editTodoSuccess,
  editTodoFailure,
  addTodoRequest,
  addTodoSuccess,
  addTodoFailure,
  pageChangeRequest,
  pageChangeRequestSuccess,
  pageChangeRequestFailure,
  expandTodoRequest,
  expandTodoSuccess,
  expandTodoFailure,
  collapseTodo
} = todoSlice.actions;

export default todoSlice.reducer;