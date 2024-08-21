import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { deleteTodo, setEditingTodo, updateTodo, setTodos } from '../features/todoSlice';
import { Button, List, ListItem, ListItemText, Container, Typography, Box, Chip, ToggleButton, ToggleButtonGroup, Card, CardContent, Divider } from '@mui/material';
import axios from 'axios';
import EditTodoMenu from './EditTodoMenu';
import { Todo, Subtask } from '../types/interfaces';


const TodoList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector((state: RootState) => state.todos.tasks);
  const [isEditMenuOpen, setEditMenuOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'waiting'>('all');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tasks');
        dispatch(setTodos(response.data));
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };

    fetchTodos();
  }, [dispatch]);

  const handleEdit = (todo: Todo) => {
    dispatch(setEditingTodo(todo));
    setSelectedTodo(todo);
    setEditMenuOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      dispatch(deleteTodo(id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${id}/complete`);
      const todo = todos.find(todo => todo.id === id);
      if (todo) {
        const updatedSubtasks: Subtask[] = todo.subtasks.map((subtask: Subtask) => ({
          ...subtask,
          status: 'completed',
        }));
        dispatch(updateTodo({
          ...todo,
          status: 'completed',
          subtasks: updatedSubtasks,
        }));
      }
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const handleCloseEditMenu = () => {
    setEditMenuOpen(false);
  };

  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: 'all' | 'completed' | 'waiting') => {
    setFilter(newFilter);
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return filter === 'completed' ? todo.status === 'completed' : todo.status === 'waiting';
  });

  return (
    <Container>
      <Typography variant="h6" sx={{ marginBottom: '2rem', marginTop: '2rem', textAlign: 'center' }}>Дела</Typography>
      <Box sx={{ marginBottom: '2rem', textAlign: 'center' }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          sx={{ marginBottom: '2rem' }}
        >
          <ToggleButton value="all">Все</ToggleButton>
          <ToggleButton value="waiting">Ожидают</ToggleButton>
          <ToggleButton value="completed">Выполненные</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <List>
        {filteredTodos.map((todo: Todo) => (
          <Card key={todo.id} sx={{ marginBottom: '1rem', borderRadius: '8px', boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ flex: 1, boxShadow: 2, padding: '0.5rem', marginRight: '1rem' }}>{todo.title}</Typography>
                  <Chip label={todo.status} color={todo.status === 'completed' ? 'success' : 'default'} />
                </Box>
                <Typography variant="body1" sx={{ boxShadow: 1, padding: '0.5rem' }}>{todo.description}</Typography>
                <Divider sx={{ marginY: '1rem' }} />
                <Typography variant="subtitle1" sx={{ marginBottom: '0.5rem' }}>Подзадачи:</Typography>
                <List>
                  {todo.subtasks.map((subtask: Subtask) => (
                    <ListItem key={subtask.id} sx={{ display: 'flex', justifyContent: 'space-between', boxShadow: 1, marginBottom: '0.5rem' }}>
                      <ListItemText primary={subtask.title} />
                      <Chip label={subtask.status} color={subtask.status === 'completed' ? 'success' : 'default'} />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button onClick={() => handleEdit(todo)} variant="contained" color="primary">
                    Править
                  </Button>
                  <Button onClick={() => handleDelete(todo.id)} variant="contained" color="secondary">
                    Удалить
                  </Button>
                  {todo.status !== 'completed' && (
                    <Button onClick={() => handleComplete(todo.id)} variant="contained" color="success">
                      Выполнить
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
      <EditTodoMenu open={isEditMenuOpen} onClose={handleCloseEditMenu} todo={selectedTodo} />
    </Container>
  );
};

export default TodoList;