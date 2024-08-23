import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { deleteTodo, setEditingTodo, updateTodo, setTodos, completeTodo, triggerDataRefresh } from '../features/todoSlice';
import { Button, List, ListItem, ListItemText, Container, Typography, Box, Chip, ToggleButton, ToggleButtonGroup, Card, CardContent, Divider, Pagination } from '@mui/material';
import axios from 'axios';
import EditTodoMenu from './EditTodoMenu';
import { Todo, Subtask } from '../types/interfaces';

const TodoList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector((state: RootState) => state.todos.tasks);
  const needsRefresh = useSelector((state: RootState) => state.todos.needsRefresh);
  const [isEditMenuOpen, setEditMenuOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'waiting'>('all');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tasks');
        const tasksWithPagination = response.data.map((todo: Todo) => ({
          ...todo,
          loadedSubtasks: [], 
          currentPage: 1,
          totalPages: 1, 
          isExpanded: todo.isExpanded || false,
        }));
        dispatch(setTodos(tasksWithPagination));
        dispatch(triggerDataRefresh()); 
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  
    if (needsRefresh) {
      fetchTodos();
    }
  }, [dispatch, needsRefresh]);

  const handleExpand = async (todo: Todo) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=1`);
      const { subtasks, totalPages } = response.data;
  
      if (!Array.isArray(subtasks)) {
        throw new Error('Subtasks is not an array');
      }
  
      dispatch(updateTodo({
        ...todo,
        loadedSubtasks: subtasks,
        allSubtasks: subtasks.map((subtask: Subtask) => subtask.id),
        currentPage: 1,
        totalPages: totalPages,
        isExpanded: true,
        subtasksCount: subtasks.length
      }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handlePageChange = async (event: React.ChangeEvent<unknown>, page: number, todo: Todo) => {
    try {
      if (todo.currentPage === page) return; 
  
      const response = await axios.get(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${page}`);
      const subtasks: Subtask[] = response.data.subtasks;
      const totalPages: number = response.data.totalPages;
  
      dispatch(updateTodo({
        ...todo,
        loadedSubtasks: subtasks,
        currentPage: page,
        totalPages: totalPages,
      }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handleCollapse = (todo: Todo) => {
    dispatch(updateTodo({
      ...todo,
      loadedSubtasks: [],
      currentPage: 1,
      isExpanded: false,
    }));
  };

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

  const handleComplete = async (id: string, currentPage: number, todo: Todo) => {
    try {
        const completeResponse = await axios.patch(`http://localhost:5000/api/tasks/${id}/complete`);
        const updatedTodo = completeResponse.data;

        const subtasksResponse = await axios.get(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${currentPage}`);
        const subtasks: Subtask[] = subtasksResponse.data.subtasks;
        const totalPages: number = subtasksResponse.data.totalPages;

        dispatch(updateTodo({
            ...todo,
            status: updatedTodo.status,
            loadedSubtasks: subtasks, 
            currentPage: currentPage,
            totalPages: totalPages,
        }));
        dispatch(completeTodo(id));
    } catch (error) {
        console.error('Error completing todo:', error);
    }
};

  const handleCloseEditMenu = () => {
    setEditMenuOpen(false);
    setSelectedTodo(null);
  };

  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: 'all' | 'completed' | 'waiting') => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
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
          <ToggleButton value="waiting">Ожидающие</ToggleButton>
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
                <Box sx={{ marginY: '1rem' }}>
                  {todo.subtasksCount > 0 ? (
                    <Typography variant="subtitle2">
                      {todo.isExpanded ? `${todo.subtasksCount} подзадач` : `Подзадачи: ${todo.subtasksCount}`}
                    </Typography>
                  ) : (
                    <Typography variant="subtitle2">Подзадач нет</Typography>
                  )}
                </Box>
                <Divider sx={{ marginY: '1rem' }} />
                {todo.isExpanded && (
                  <>
                    <Typography variant="subtitle1" sx={{ marginBottom: '0.5rem' }}>Подзадачи:</Typography>
                    <List>
                      {todo.loadedSubtasks.length > 0 ? (
                        todo.loadedSubtasks.map((subtask: Subtask) => (
                          <ListItem key={subtask.id} sx={{ display: 'flex', justifyContent: 'space-between', boxShadow: 1, marginBottom: '0.5rem' }}>
                            <ListItemText primary={subtask.title} />
                            <Chip label={subtask.status} color={subtask.status === 'completed' ? 'success' : 'default'} />
                          </ListItem>
                        ))
                      ) : (
                        <ListItem>
                          <ListItemText primary="Подзадачи не загружены" />
                        </ListItem>
                      )}
                    </List>
                    {todo.totalPages > 1 && (
                      <Pagination
                        count={todo.totalPages}
                        page={todo.currentPage}
                        onChange={(event, page) => handlePageChange(event, page, todo)}
                        sx={{ marginTop: '1rem', alignSelf: 'center' }}
                      />
                    )}
                  </>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  {todo.subtasksCount > 0 && !todo.isExpanded && (
                    <Button onClick={() => handleExpand(todo)} variant="contained" color="primary">
                      Развернуть
                    </Button>
                  )}
                  {todo.isExpanded && (
                    <Button onClick={() => handleCollapse(todo)} variant="contained" color="secondary">
                      Свернуть
                    </Button>
                  )}
                  <Button onClick={() => handleEdit(todo)} variant="contained" color="primary">
                    Править
                  </Button>
                  {todo.status !== 'completed' && (
                    <Button onClick={() => handleComplete(todo.id, todo.currentPage, todo)} variant="contained" color="success">
                      Выполнить
                    </Button>
                  )}
                  <Button onClick={() => handleDelete(todo.id)} variant="contained" color="error">
                    Удалить
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
      {isEditMenuOpen && selectedTodo && (
        <EditTodoMenu
          open={isEditMenuOpen}
          onClose={handleCloseEditMenu} // Обратите внимание на это
          todo={selectedTodo}
        />
      )}
    </Container>
  );
};

export default TodoList;