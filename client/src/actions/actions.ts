import { NewTodo, Todo } from "../types/interfaces";

export const FETCH_TODOS = 'FETCH_TODOS';
export const ADD_TODO = 'ADD_TODO'
export const EDIT_TODO = 'EDIT_TODO'
export const EXPAND_TODO = 'EXPAND_TODO'
export const PAGE_CHANGE_TODO = 'PAGE_CHANGE_TODO'
export const COMPLETE_TODO = 'COMPLETE_TODO'
export const DELETE_TODO = 'DELETE_TODO'

export const fetchTodos = () => ({
    type: FETCH_TODOS,
});

export const addTodo = (todo: NewTodo) => ({
    type: 'ADD_TODO',
    payload: { todo },
});

export const editTodo = (todo: Todo) => ({
    type: 'EDIT_TODO',
    payload: todo,
  });

export const expandTodo = (id: string) => ({
    type: 'EXPAND_TODO',
    payload: id,
});

export const pageChangeTodo = (parentId: string, page: number) => ({
    type: 'PAGE_CHANGE_TODO',
    payload: { parentId, page },
});

export const completeTodo = (id: string) => ({
    type: 'COMPLETE_TODO',
    payload: { id },
});

export const deleteTodo = (id: string, deletedTodo: Todo) => ({
    type: 'DELETE_TODO',
    payload: { id, deletedTodo },
});
