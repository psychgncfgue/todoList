export interface Subtask {
    id: string;
    title: string;
    status: 'waiting' | 'completed';
  }
  
  export interface Todo {
    id: string;
    title: string;
    description?: string;
    subtasks?: Todo[];
    loadedSubtasks?: Todo[]; // Подгруженные подзадачи для текущей страницы
    currentPage?: number; // Текущая страница подзадач
    totalPages?: number; // Общее количество страниц
    status: 'waiting' | 'completed';
    isExpanded?: boolean; // Состояние разворачивания подзадач
    subtasksCount?: number;
    parentId?: string | null;
    pagination?: {
      [key: string]: {
        subtasks: Todo[];
        currentPage: number;
        totalPages: number;
      }
    };
    rawSubtasks?: Todo[];
  }


  export interface EditTodoMenuProps {
    open: boolean;
    onClose: () => void;
    todo: Todo | null;
    fetchAllSubtasks: (parentId: string) => Promise<number>;
  }

  export interface LoadSubtasksPayload {
    id: string;
    loadedSubtasks: Subtask[];
    currentPage: number;
    totalPages: number;
  }

  export interface ErrorResponse {
    error: string;
  }


  export interface TodoState {
    tasks: Todo[];
    editingTodo: Todo | null;
    needsRefresh: boolean; // Новое поле для отслеживания необходимости перезапроса
  }

  export interface SubtaskState {
    loadedSubtasks: Todo[];
    currentPage: number;
    totalPages: number;
  }

  export type PayloadAction<T> = {
    type: string;
    payload: T;
  };