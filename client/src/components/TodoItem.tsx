import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { Button, List, Typography, Box, Chip, Card, CardContent, Divider, Pagination } from '@mui/material';
import EditTodoMenu from './EditTodoMenu';
import { Todo, TodoItemProps } from '../types/interfaces';
import { expandTodo, pageChangeTodo, completeTodo, deleteTodo } from '../actions/actions';
import { collapseTodo } from '../redux/todoSlice';

const TodoItem: React.FC<TodoItemProps> = ({ todo, depth = 0 }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditMenuOpen, setEditMenuOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const getBackgroundColor = (depth: number) => {
    const baseColor = 255;
    const step = 15;
    const colorValue = Math.max(baseColor - depth * step, 200);
    return `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
  };

  const handleExpand = () => {
    dispatch(expandTodo(todo.id));
  };

  const handleCollapse = () => {
    dispatch(collapseTodo(todo.id));
  };

  const handlePageChange = (parentId: string, page: number) => {
    dispatch(pageChangeTodo(parentId, page));
  };

  const handleEdit = (todo: Todo) => {
    setEditMenuOpen(true);
    setSelectedTodo(todo);
  };

  const handleComplete = (id: string) => {
    dispatch(completeTodo(id));
  };

  const handleDelete = (id: string, deletedTodo: Todo) => {
    dispatch(deleteTodo(id, deletedTodo));
};

  return (
    <Card sx={{ marginBottom: '1rem', borderRadius: '8px', boxShadow: 3, backgroundColor: getBackgroundColor(depth) }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flex: 1, boxShadow: 2, padding: '0.5rem', marginRight: '1rem' }}>
              {todo.title}
            </Typography>
            <Chip label={todo.status} color={todo.status === 'completed' ? 'success' : 'default'} />
          </Box>
          <Typography variant="body1" sx={{ boxShadow: 1, padding: '0.5rem' }}>
            {todo.description}
          </Typography>
          <Box sx={{ marginY: '0rem' }}>
            {todo.subtasksCount && todo.subtasksCount > 0 ? (
              <Typography variant="subtitle2">
                {todo.isExpanded ? `${todo.subtasksCount} подзадач` : `Подзадачи: ${todo.subtasksCount}`}
              </Typography>
            ) : (
              <Typography variant="subtitle2">Подзадач нет</Typography>
            )}
          </Box>
          <Divider sx={{ marginY: '1rem' }} />
          {todo.isExpanded && todo.expandedSubtasks && todo.expandedSubtasks.pagination && (
            <>
              <Typography variant="subtitle1">Подзадачи:</Typography>
              <List>
                {(todo.expandedSubtasks.tasks || []).map((subtask: Todo) => (
                  <TodoItem key={subtask.id} todo={subtask} depth={depth + 1} />
                ))}
              </List>
              {todo.expandedSubtasks.pagination.totalPages > 1 && (
                <Pagination
                  count={todo.expandedSubtasks.pagination.totalPages}
                  page={todo.expandedSubtasks.pagination.currentPage}
                  onChange={(event, page) => handlePageChange(todo.id, page)}
                  sx={{ marginTop: '1rem', alignSelf: 'center' }}
                />
              )}
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0rem' }}>
            {!todo.isExpanded && (
              <Button onClick={handleExpand} variant="contained" color="primary">
                Развернуть
              </Button>
            )}
            {todo.isExpanded && (
              <Button onClick={handleCollapse} variant="contained" color="secondary">
                Свернуть
              </Button>
            )}
            <Button onClick={() => handleEdit(todo)} variant="contained" color="primary">
              Править
            </Button>
            {todo.status !== 'completed' && (
              <Button onClick={() => handleComplete(todo.id)} variant="contained" color="success">
                Выполнить
              </Button>
            )}
            <Button onClick={() => handleDelete(todo.id, todo)} variant="contained" color="error">
              Удалить
            </Button>
          </Box>
        </Box>
      </CardContent>
      {isEditMenuOpen && selectedTodo && (
        <EditTodoMenu
          open={isEditMenuOpen}
          onClose={() => setEditMenuOpen(false)}
          todo={selectedTodo}
        />
      )}
    </Card>
  );
};

export default TodoItem;