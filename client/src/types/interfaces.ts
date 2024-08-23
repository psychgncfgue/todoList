export interface Subtask {
    id: string;
    title: string;
    status: 'waiting' | 'completed';
  }
  
  export interface Todo {
    id: string;
    title: string;
    description: string;
    subtasks: Subtask[]; // Полный список подзадач
    loadedSubtasks: Subtask[]; // Подгруженные подзадачи для текущей страницы
    currentPage: number; // Текущая страница подзадач
    totalPages: number; // Общее количество страниц
    status: 'waiting' | 'completed';
    isExpanded?: boolean; // Состояние разворачивания подзадач
    subtasksCount: number;
    allSubtasks: string[];
  }

  export interface EditTodoMenuProps {
    open: boolean;
    onClose: () => void;
    todo: Todo | null;
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