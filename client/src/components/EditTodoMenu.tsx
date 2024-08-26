import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Box, List, ListItem, ListItemText, Select, MenuItem, Pagination
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { updateTodo, loadSubtasks } from '../features/todoSlice';
import { Delete, ExpandMore, Add } from '@mui/icons-material';
import { Subtask, EditTodoMenuProps } from '../types/interfaces';
import axios from 'axios';


const EditTodoMenu: React.FC<EditTodoMenuProps> = ({ open, onClose, todo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks } = useSelector((state: RootState) => state.todos);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'completed'>('waiting');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [editSubtaskId, setEditSubtaskId] = useState<string | null>(null);
  const [editSubtaskTitle, setEditSubtaskTitle] = useState<string>('');
  const [editSubtaskStatus, setEditSubtaskStatus] = useState<'waiting' | 'completed'>('waiting');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const currentTodo = tasks.find(t => t.id === todo?.id);


  const fetchSubtasks = useCallback(async (page: number) => {
    if (!todo) return;
    console.log('Fetching subtasks for page:', page);
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${page}`);
      
      if (response.ok) {
        const { subtasks, totalPages } = await response.json();
        console.log('Fetched subtasks:', subtasks); // Логируем подзадачи для каждой страницы
        console.log('Total pages:', totalPages);    // Логируем общее количество страниц
        if (Array.isArray(subtasks)) {
          dispatch(loadSubtasks({
            id: todo.id,
            loadedSubtasks: subtasks,
            currentPage: page,
            totalPages
          }));
  
          // Устанавливаем общее количество страниц
          setTotalPages(totalPages);
        } else {
          console.error('Received subtasks is not an array:', subtasks);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to fetch subtasks: ${errorData.message}`);
      }
    } catch (error) {
      setError('Error fetching subtasks');
    } finally {
      setLoading(false);
    }
  }, [dispatch, todo]);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status || 'waiting');
      setNewSubtaskTitle('');
      setEditSubtaskId(null);
      setEditSubtaskTitle('');
      setEditSubtaskStatus('waiting');
      setCurrentPage(1);
      fetchSubtasks(1); 
    }
  }, [todo, dispatch, fetchSubtasks]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    console.log('Page change:', page);
    setCurrentPage(page);
    fetchSubtasks(page);
  };


  const handleAddSubtask = async () => {
    if (newSubtaskTitle.trim() && todo?.id) {
      const newSubtask: Subtask = {
        id: new Date().toISOString(), // Генерация уникального ID
        title: newSubtaskTitle,
        status: 'waiting',
      };
      
      try {
        // Отправка POST-запроса на сервер для добавления подзадачи
        const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks`, {
          method: 'POST', // Используем POST для создания новой подзадачи
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSubtask),
        });
  
        if (response.ok) {
        
          await fetchSubtasks(currentPage);
          setNewSubtaskTitle('');
        } else {
          const errorData = await response.json();
          console.error('Failed to add subtask:', errorData);
          setError('Failed to add subtask');
        }
      } catch (error) {
        console.error('Error adding subtask:', error);
        setError('Error adding subtask');
      }
    }
  };

  const handleEditSubtaskChange = (id: string, title: string, status: 'waiting' | 'completed') => {
    setEditSubtaskId(id);
    setEditSubtaskTitle(title);
    setEditSubtaskStatus(status);
  };

  const handleUpdateSubtask = async () => {
    if (!editSubtaskId || !todo) return;
    
    try {
      // Отправляем PATCH-запрос на сервер для обновления подзадачи
      const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks/${editSubtaskId}`, {
        method: 'PATCH', // Используем PATCH для частичного обновления
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editSubtaskTitle, status: editSubtaskStatus }),
      });
  
      if (response.ok) {
        const updatedSubtask = await response.json();
  
        // Обновляем состояние с новыми данными подзадачи
        dispatch(loadSubtasks({
          id: todo.id,
          loadedSubtasks: (currentTodo?.loadedSubtasks ?? []).map(subtask =>
            subtask.id === editSubtaskId ? updatedSubtask : subtask
          ),
          currentPage: currentPage,
          totalPages: totalPages
        }));
  
        setEditSubtaskId(null);
      } else {
        console.error('Failed to update subtask:', await response.json());
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleUpdate = async () => {
    if (todo && title.trim()) {
      const updatedTodo = {
        ...todo,
        title,
        description: description || '',
        status,
      };
  
      try {
        // Обновляем задачу
        const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTodo),
        });
  
        if (response.ok) {
          // Получаем обновленную задачу
          const updatedTask = await response.json();
  
          // Получаем подзадачи для текущей страницы
          const subtasksResponse = await axios.get(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${todo.currentPage}`);
          const subtasks: Subtask[] = subtasksResponse.data.subtasks;
          const totalPages: number = subtasksResponse.data.totalPages;
  
          // Диспатчим действие loadSubtasks для обновления подзадач
          dispatch(loadSubtasks({
            id: todo.id,
            loadedSubtasks: subtasks,
            currentPage: todo.currentPage,
            totalPages: totalPages,
          }));
  
          // Диспатчим обновленную задачу
          dispatch(updateTodo({
            ...updatedTask,
            currentPage: todo.currentPage,  // Обновляем текущую страницу
            totalPages: totalPages,         // Обновляем общее количество страниц
          }));
  
          onClose();
        } else {
          console.error('Failed to update todo:', await response.json());
        }
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!todo) return;
    try {
      // Отправка DELETE-запроса на сервер для удаления подзадачи
      const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        // Получение обновленного списка подзадач для текущей страницы
        const updatedResponse = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${currentPage}`);
        const updatedData = await updatedResponse.json();
  
        // Если текущая страница становится пустой, переключаемся на предыдущую
        if (updatedData.subtasks.length === 0 && currentPage > 1) {
          const previousPage = currentPage - 1;
  
          // Получаем данные для предыдущей страницы
          const previousPageResponse = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${previousPage}`);
          const previousPageData = await previousPageResponse.json();
  
          // Обновляем состояние с данными для предыдущей страницы
          dispatch(loadSubtasks({
            id: todo.id,
            loadedSubtasks: previousPageData.subtasks,
            currentPage: previousPage,
            totalPages: previousPageData.totalPages
          }));
  
          // Обновляем состояние текущей страницы
          setCurrentPage(previousPage);
          setTotalPages(previousPageData.totalPages);
        } else {
          // Обновляем состояние с данными для текущей страницы
          dispatch(loadSubtasks({
            id: todo.id,
            loadedSubtasks: updatedData.subtasks,
            currentPage: currentPage,
            totalPages: updatedData.totalPages
          }));
  
          // Обновляем состояние текущей страницы
          setTotalPages(updatedData.totalPages);
        }
      } else {
        console.error('Failed to delete subtask:', await response.json());
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };


  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Редактирование дела</DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'waiting' | 'completed')}
          fullWidth
          margin="none"
        >
          <MenuItem value="waiting">Ожидает</MenuItem>
          <MenuItem value="completed">Выполнено</MenuItem>
        </Select>

        <Box mt={2}>
          <TextField
            label="Новая подзадача"
            fullWidth
            margin="normal"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddSubtask}
            startIcon={<Add />}
          >
            Добавить подзадачу
          </Button>
        </Box>

        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}

        <List>
          {currentTodo?.loadedSubtasks.map((subtask) => (
            <ListItem key={subtask.id}>
              <ListItemText
                primary={subtask.title}
                secondary={`${subtask.status}`}
              />
              <IconButton
                onClick={() => handleDeleteSubtask(subtask.id)}
                edge="end"
                aria-label="delete"
              >
                <Delete />
              </IconButton>
              <IconButton
                onClick={() => handleEditSubtaskChange(subtask.id, subtask.title, subtask.status)}
                edge="end"
                aria-label="edit"
              >
                <ExpandMore />
              </IconButton>
            </ListItem>
          ))}
        </List>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
          />
        )}

        <Dialog open={!!editSubtaskId} onClose={() => setEditSubtaskId(null)}>
          <DialogTitle>Править подзадачу</DialogTitle>
          <DialogContent>
            <TextField
              label="Title"
              fullWidth
              margin="normal"
              value={editSubtaskTitle}
              onChange={(e) => setEditSubtaskTitle(e.target.value)}
            />
            <Select
              value={editSubtaskStatus}
              onChange={(e) => setEditSubtaskStatus(e.target.value as 'waiting' | 'completed')}
              fullWidth
              margin="none"
            >
              <MenuItem value="waiting">Waiting</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSubtaskId(null)}>Отмена</Button>
            <Button
              color="primary"
              onClick={handleUpdateSubtask}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Отмена</Button>
        <Button
          color="primary"
          onClick={handleUpdate}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTodoMenu;