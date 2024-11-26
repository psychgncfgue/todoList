export const PAGE_SIZE = 5;

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'waiting' | 'completed';
  isExpanded?: boolean; 
  subtasksCount?: number;
  parentId?: string | null;
  expandedSubtasks?: TodoPagination | null; 
  editingTodo?: boolean; 
}

export interface EditTodoMenuProps {
  open: boolean;
  onClose: () => void;
  todo: Todo | null;
}

export interface TodoPagination {
  tasks: Todo[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface TodoItemProps {
  todo: Todo;
  depth?: number;
}

export interface NewTodo {
  title: string;
  description?: string;
  status: string;
  parentId?: string | null;
}