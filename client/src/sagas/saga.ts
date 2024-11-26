import { SagaIterator } from 'redux-saga';
import { call, put, takeLatest, all, select } from 'redux-saga/effects';
import {
    fetchTodosFailure, fetchTodosSuccess,
    addTodoFailure, addTodoSuccess,
    deleteTodoFailure, deleteTodoSuccess,
    completeTodoFailure, completeTodoSuccess,
    editTodoFailure, editTodoSuccess,
    expandTodoFailure, expandTodoSuccess,
    pageChangeRequestFailure, pageChangeRequestSuccess,
    completeTodoRequest,
    deleteTodoRequest,
    addTodoRequest,
    fetchTodosRequest,
    pageChangeRequest,
    expandTodoRequest,
    editTodoRequest
} from '../redux/todoSlice';
import axios, { AxiosResponse } from 'axios';
import { NewTodo, Todo } from '../types/interfaces';
import { RootState } from '../store/store';
import { findParentTask } from '../utils/todoHelpers';

function* fetchTodos() {
    yield put(fetchTodosRequest())
    try {
        const response: AxiosResponse<{ tasks: Todo[]; total: number; totalPages: number; currentPage: number }> = yield call(() =>
            axios.get('http://localhost:5000/api/tasks')
        );
        yield put(fetchTodosSuccess(response.data));
    } catch (error) {
        yield put(fetchTodosFailure('Не удалось загрузить задачи'));
    }
}

function* addTodo(action: { type: string; payload: { todo: NewTodo } }): SagaIterator {
    yield put(addTodoRequest());
    const { todo } = action.payload;
    try {
        const response: AxiosResponse<Todo> = yield call(() =>
            axios.post('http://localhost:5000/api/tasks', todo)
        );
        const newTodo = response.data;
        const state: RootState = yield select();
        const parentTask = findParentTask(state.todos.tasks.tasks, newTodo.parentId);
        console.log(parentTask);
        let totalOnLastPage = 0;
        if (parentTask?.isExpanded) {
            const pagination = parentTask.expandedSubtasks?.pagination;
            console.log(pagination);
            if (pagination) {
                const lastPage = pagination.totalPages;
                const lastPageResponse: AxiosResponse<{ tasks: Todo[]; total: number }> = yield call(() =>
                    axios.get(
                        `http://localhost:5000/api/tasks?parentId=${newTodo.parentId}&page=${lastPage}&limit=5&includeSubtasks=false`
                    )
                );
                totalOnLastPage = lastPageResponse.data.total;
            }
        }
        yield put(
            addTodoSuccess({
                ...newTodo,
                totalOnLastPage,
            })
        );
    } catch (error) {
        yield put(addTodoFailure('Не удалось добавить задачу'));
    }
}

function* deleteTodo(action: { type: string; payload: { id: string, deletedTodo: Todo } }): SagaIterator {
    yield put(deleteTodoRequest());
    const { id, deletedTodo } = action.payload;
    const { subtasksCount } = deletedTodo;
    try {
        yield call(() => axios.delete(`http://localhost:5000/api/tasks/${id}`));
        const state: RootState = yield select();
        const parentTask = findParentTask(state.todos.tasks.tasks, deletedTodo?.parentId);
        console.log(parentTask);
        let updatedPageData: { tasks: Todo[]; total: number; totalPages: number; currentPage: number; parentId: string } | undefined = undefined;
        if (parentTask?.isExpanded) {
            const pagination = parentTask.expandedSubtasks?.pagination;
            console.log(pagination)
            if (pagination) {
                const currentPage = pagination.currentPage;
                const currentPageResponse: AxiosResponse<{
                    tasks: Todo[];
                    total: number;
                    totalPages: number;
                }> = yield call(() =>
                    axios.get(
                        `http://localhost:5000/api/tasks?parentId=${parentTask.id}&page=${currentPage}&limit=5&includeSubtasks=false`
                    )
                );
                updatedPageData = {
                    tasks: currentPageResponse.data.tasks,
                    total: currentPageResponse.data.total,
                    totalPages: currentPageResponse.data.totalPages,
                    currentPage,
                    parentId: parentTask.id,
                };
            }
        }
        yield put(deleteTodoSuccess({ id, updatedPageData, subtasksCount }));
    } catch (error) {
        yield put(deleteTodoFailure('При удалении задачи произошла ошибка'));
    }
}

function* completeTodo(action: { type: string; payload: { id: string } }) {
    yield put(completeTodoRequest())
    const { id } = action.payload;
    try {
        yield call(() =>
            axios.patch(`http://localhost:5000/api/tasks/${id}/complete`, {
                status: 'completed'
            })
        );
        yield put(completeTodoSuccess(id));
    } catch (error) {
        yield put(completeTodoFailure('Не удалось завершить задачу'));
    }
}

function* pageChange(action: { type: string; payload: { parentId: string; page: number } }) {
    yield put(pageChangeRequest())
    const { parentId, page } = action.payload;
    try {
        const response: AxiosResponse<{ tasks: Todo[]; totalPages: number, currentPage: number; total: number }> = yield call(() =>
            axios.get(`http://localhost:5000/api/tasks?parentId=${parentId}&page=${page}&limit=5&includeSubtasks=false`)
        );

        const { tasks, totalPages, total } = response.data;

        yield put(pageChangeRequestSuccess({
            parentId,
            todos: tasks,
            page,
            totalPages,
            total,
        }));
    } catch (error) {
        yield put(pageChangeRequestFailure('Не удалось загрузить подзадачи'));
    }
}

function* expandTodo(action: { type: string; payload: string }) {
    yield put(expandTodoRequest());
    const taskId = action.payload;
    try {
        const response: AxiosResponse<{
            tasks: Todo[];
            totalPages: number;
            total: number;
        }> = yield call(() =>
            axios.get(`http://localhost:5000/api/tasks?parentId=${taskId}&page=1&limit=5&includeSubtasks=false`)
        );
        const { tasks, totalPages, total } = response.data;
        yield put(
            expandTodoSuccess({
                taskId,
                tasks,
                currentPage: 1,
                totalPages,
                total,
            })
        );
    } catch (error) {
        yield put(expandTodoFailure('Не удалось загрузить подзадачи'));
    }
}

function* editTodo(action: { type: string; payload: Todo }) {
    yield put(editTodoRequest())
    const todo = action.payload;
    try {
        const response: AxiosResponse<Todo> = yield call(() =>
            axios.put(`http://localhost:5000/api/tasks/${todo.id}`, todo)
        );
        console.log(response.data)
        yield put(editTodoSuccess(response.data));
    } catch (error) {
        yield put(editTodoFailure('Не удалось изменить задачу'));
    }
}

function* watchFetchTodos() {
    yield takeLatest('FETCH_TODOS', fetchTodos);
}

function* watchAddTodo() {
    yield takeLatest('ADD_TODO', addTodo);
}

function* watchDeleteTodo() {
    yield takeLatest('DELETE_TODO', deleteTodo);
}

function* watchCompleteTodo() {
    yield takeLatest('COMPLETE_TODO', completeTodo);
}

function* watchPageChange() {
    yield takeLatest('PAGE_CHANGE_TODO', pageChange);
}

function* watchExpandTodo() {
    yield takeLatest('EXPAND_TODO', expandTodo);
}

function* watchEditTodo() {
    yield takeLatest('EDIT_TODO', editTodo);
}

export default function* rootSaga() {
    yield all([
        watchFetchTodos(),
        watchAddTodo(),
        watchDeleteTodo(),
        watchCompleteTodo(),
        watchPageChange(),
        watchExpandTodo(),
        watchEditTodo(),
    ]);
}