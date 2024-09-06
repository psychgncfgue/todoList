import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { deleteTodo, setEditingTodo, updateTodo, setTodos, completeTodo } from '../features/todoSlice';
import { Button, List, Container, Typography, Box, Chip, ToggleButton, ToggleButtonGroup, Card, CardContent, Divider, Pagination } from '@mui/material';
import axios from 'axios';
import EditTodoMenu from './EditTodoMenu';
import { Todo } from '../types/interfaces';

const fetchAllSubtasks = async (parentId: string): Promise<number> => {
  let subtasksCount = 0;
  let currentPage = 1;
  let totalPages = 1;
  do {
    const response = await axios.get(
      `http://localhost:5000/api/tasks?parentId=${parentId}&page=${currentPage}&limit=5&includeSubtasks=true`
    );
    const tasks = response.data.tasks;
    if (tasks && Array.isArray(tasks)) {
      subtasksCount += tasks.length;
      for (const subtask of tasks) {
        subtasksCount += await fetchAllSubtasks(subtask.id);
      }
    }
    totalPages = response.data.totalPages;
    currentPage += 1;
  } while (currentPage <= totalPages);
  return subtasksCount;
};

const TodoItem: React.FC<{ todo: Todo; depth?: number }> = ({ todo, depth = 0 }) => {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector((state: RootState) => state.todos.tasks);
  const [isEditMenuOpen, setEditMenuOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const getBackgroundColor = (depth: number) => {
    const baseColor = 255;
    const step = 15; 
    const colorValue = Math.max(baseColor - depth * step, 200);
    return `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
  };


  const handleExpand = async (event: React.MouseEvent, taskId: string) => {
    event.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks?parentId=${taskId}&page=1&limit=5&includeSubtasks=false`);
      console.log(response.data);
      const { totalPages, currentPage, tasks } = response.data;
      const tasksWithSubtaskCounts = await Promise.all(
        tasks.map(async (todo: Todo) => {
          const subtasksCount = await fetchAllSubtasks(todo.id);
          return {
            ...todo,
            isExpanded: false,
            currentPage: 1,
            totalPages: 1,
            subtasksCount
          };
        })
      );
      const parentTask = todo; 
      dispatch(updateTodo({
        id: taskId,
        isExpanded: true,
        subtasks: tasksWithSubtaskCounts,  
        currentPage: currentPage,
        totalPages: totalPages,
        subtasksCount: parentTask.subtasksCount 
      }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const handlePageChange = async (page: number) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/tasks?parentId=${todo.id}&page=${page}&limit=5&includeSubtasks=false`);
        const subtasks: Todo[] = response.data.tasks;
        const totalPages: number = response.data.totalPages;
        const tasksWithSubtaskCounts = await Promise.all(
          subtasks.map(async (todo: Todo) => {
            const subtasksCount = await fetchAllSubtasks(todo.id);
            return {
              ...todo,
              isExpanded: false,
              currentPage: 1,
              totalPages: 1,
              subtasksCount
            };
          })
        );
        const parentTask = todo; 
        dispatch(updateTodo({
            id: todo.id,
            subtasks: tasksWithSubtaskCounts,
            isExpanded: true,
            currentPage: page,
            totalPages: totalPages,
            subtasksCount: parentTask.subtasksCount 
        }));
    } catch (error) {
        console.error('Error fetching subtasks:', error);
    }
};

const handleCollapse = () => {
  dispatch(updateTodo({
      id: todo.id,
      subtasks: [],  
      currentPage: 1,
      totalPages: todo.totalPages,
      isExpanded: false,
      subtasksCount: todo.subtasksCount  
  }));
};

  const handleEdit = (todo: Todo) => {
    dispatch(setEditingTodo(todo));
    setSelectedTodo(todo);
    setEditMenuOpen(true);
  };

  const handleCloseEditMenu = async () => {
    if (selectedTodo) {
      try {
        const { currentPage = 1 } = selectedTodo;
        const response = await axios.get(`http://localhost:5000/api/tasks?parentId=${selectedTodo.id}&page=${currentPage}&limit=5&includeSubtasks=false`);
        const subtasks: Todo[] = response.data.tasks;
        const totalPages: number = response.data.totalPages;

        const tasksWithSubtaskCounts = await Promise.all(
          subtasks.map(async (subtask: Todo) => {
            const subtasksCount = await fetchAllSubtasks(subtask.id);
            return {
              ...subtask,
              subtasksCount,
            };
          })
        );

        const updatedTodo = {
          ...selectedTodo,
          subtasksCount: await fetchAllSubtasks(selectedTodo.id),
          subtasks: tasksWithSubtaskCounts,
          currentPage,
          totalPages,
        };

        dispatch(updateTodo(updatedTodo));
      } catch (error) {
        console.error('Error updating subtasks count:', error);
      }
    }
    setEditMenuOpen(false);
    setSelectedTodo(null);
  };

  const handleComplete = async (id: string) => {
    try {
      const completeResponse = await axios.patch(`http://localhost:5000/api/tasks/${id}/complete`, { status: 'completed' });
      if (completeResponse.status === 200) {
        const subtasksResponse = await axios.get(`http://localhost:5000/api/tasks?parentId=${id}&page=1&limit=5&includeSubtasks=false`);
        if (subtasksResponse.status === 200) {
          const { currentPage, totalPages, tasks } = subtasksResponse.data;
          if (Array.isArray(tasks)) {
            const tasksWithSubtaskCounts = await Promise.all(
              tasks.map(async (todo: Todo) => {
                const subtasksCount = await fetchAllSubtasks(todo.id);
                return {
                  ...todo,
                  isExpanded: false,
                  currentPage: 1,
                  totalPages: 1,
                  subtasksCount
                };
              })
            );
            const parentTask = todo; 
            const updatedSubtasks = tasks.map(subtask => ({ ...subtask, status: 'completed' }));
            dispatch(updateTodo({
              id,
              status: 'completed',
              subtasks: updatedSubtasks,
              currentPage,
              totalPages,
              subtasksCount: parentTask.subtasksCount,
              isExpanded: todo.isExpanded
            }));
            dispatch(completeTodo(id));
          } else {
            console.error('Received subtasks is not an array:', tasks);
          }
        } else {
          console.error('Failed to fetch subtasks:', subtasksResponse.statusText);
        }
      } else {
        console.error('Failed to complete task:', completeResponse.statusText);
      }
    } catch (error) {
      console.error('Error completing todo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${id}`);
      dispatch(deleteTodo(id));
      if (selectedTodo) {
        const { currentPage = 1 } = selectedTodo;
        const response = await axios.get(`http://localhost:5000/api/tasks?parentId=${selectedTodo.id}&page=${currentPage}&limit=5&includeSubtasks=false`);
        const subtasks: Todo[] = response.data.tasks;
        const totalPages: number = response.data.totalPages;
        const tasksWithSubtaskCounts = await Promise.all(
          subtasks.map(async (subtask: Todo) => {
            const subtasksCount = await fetchAllSubtasks(subtask.id);
            return {
              ...subtask,
              subtasksCount,
            };
          })
        );
        const updatedTodo = {
          ...selectedTodo,
          subtasks: tasksWithSubtaskCounts,
          currentPage,
          totalPages,
        };
        dispatch(updateTodo(updatedTodo));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
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
          {todo.isExpanded && (
            <>
              <Typography variant="subtitle1" sx={{ marginBottom: '0rem' }}>Подзадачи:</Typography>
              <List>
                {(todo.subtasks || []).map((subtask: Todo) => (
                  <TodoItem key={subtask.id} todo={subtask} depth={depth + 1} />
                ))}
              </List>
              {todo.totalPages && todo.totalPages > 1 && (
                <Pagination
                  count={todo.totalPages}
                  page={todo.currentPage}
                  onChange={(event, page) => handlePageChange(page)}
                  sx={{ marginTop: '0rem', alignSelf: 'center' }}
                />
              )}
            </>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0rem' }}>
            {!todo.isExpanded && (
              <Button onClick={(event) => handleExpand(event, todo.id)} variant="contained" color="primary">
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
            <Button onClick={() => handleDelete(todo.id)} variant="contained" color="error">
              Удалить
            </Button>
          </Box>
        </Box>
      </CardContent>
      {isEditMenuOpen && selectedTodo && (
        <EditTodoMenu
          fetchAllSubtasks={fetchAllSubtasks}
          open={isEditMenuOpen}
          onClose={handleCloseEditMenu}
          todo={selectedTodo}
        />
      )}
    </Card>
  );
};


const TodoList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const todos = useSelector((state: RootState) => state.todos.tasks);
  const needsRefresh = useSelector((state: RootState) => state.todos.needsRefresh);
  const [filter, setFilter] = useState<'all' | 'completed' | 'waiting'>('all');

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/tasks?parentId=null&page=1&limit=5&includeSubtasks=false');
        const tasks = response.data.tasks;
        const tasksWithSubtaskCounts = await Promise.all(
          tasks.map(async (todo: Todo) => {
            const subtasksCount = await fetchAllSubtasks(todo.id);
            return {
              ...todo,
              isExpanded: false,
              currentPage: 1,
              totalPages: 1,
              subtasksCount
            };
          })
        );
        dispatch(setTodos(tasksWithSubtaskCounts));
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  }, [dispatch, needsRefresh]);

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
      <Typography variant="h6" sx={{ marginBottom: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        Дела
      </Typography>
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
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </List>
    </Container>
  );
};

export default TodoList;