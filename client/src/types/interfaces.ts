export interface Subtask {
    id: string;
    title: string;
    status: 'waiting' | 'completed';
  }
  
  export interface Todo {
    id: string;
    title: string;
    description: string;
    status: 'waiting' | 'completed';
    subtasks: Subtask[];
  }

  export interface EditTodoMenuProps {
    open: boolean;
    onClose: () => void;
    todo: Todo | null;
  }