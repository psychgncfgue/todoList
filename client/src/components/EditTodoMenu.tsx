import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Box, List, ListItem, ListItemText, Select, MenuItem, Pagination
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { updateTodo, loadSubtasks } from '../features/todoSlice';
import { Delete, ExpandMore, Add } from '@mui/icons-material';
import { Subtask, EditTodoMenuProps, Todo } from '../types/interfaces';
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


  const fetchSubtasks = useCallback(async (parentId: string | undefined, page: number) => {
    if (!todo || !parentId) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await axios.get(`http://localhost:5000/api/tasks`, {
        params: {
          parentId: parentId,
          page: page,
          limit: 5,
          includeSubtasks: false
        }
      });
  
      if (response.status === 200) {
        const { currentPage, totalPages, tasks } = response.data;
  
        if (Array.isArray(tasks)) {
          dispatch(updateTodo({
            id: todo.id,
            loadedSubtasks: tasks,
            currentPage: currentPage,
            totalPages: totalPages,
            isExpanded: true, // если вы хотите установить isExpanded в true, когда загружаете подзадачи
          }));
          setTotalPages(totalPages);
        } else {
          console.error('Received subtasks is not an array:', tasks);
        }
      } else {
        setError(`Failed to fetch subtasks: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
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
      setCurrentPage(currentPage);
      fetchSubtasks(todo.id,currentPage); 
    }
  }, [todo, dispatch, fetchSubtasks, currentPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    fetchSubtasks(todo?.id, page);
  };

  const handleAddSubtask = async () => {
    if (newSubtaskTitle.trim() && todo?.id) {
      const newSubtask: Todo = {
        id: new Date().toISOString(), 
        title: newSubtaskTitle,
        description: '', 
        status: 'waiting',
        parentId: todo.id,
      };
      try {
        const response = await axios.post('http://localhost:5000/api/tasks', newSubtask, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.status === 201) {
          await fetchSubtasks(todo.id, currentPage);
          setNewSubtaskTitle('');
        } else {
          console.error('Failed to add subtask:', response.data);
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
      const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}/subtasks/${editSubtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editSubtaskTitle, status: editSubtaskStatus }),
      });
      if (response.ok) {
        const updatedSubtask = await response.json();
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
        const response = await fetch(`http://localhost:5000/api/tasks/${todo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTodo),
        });
        if (response.ok) {
          const updatedTask = await response.json();
          const subtasksResponse = await axios.get(`http://localhost:5000/api/tasks/${todo.id}/subtasks?page=${todo.currentPage}`);
          const subtasks: Subtask[] = subtasksResponse.data.subtasks;
          const totalPages: number = subtasksResponse.data.totalPages;
          dispatch(loadSubtasks({
            id: todo.id,
            loadedSubtasks: subtasks,
            currentPage: todo.currentPage ?? 1,
            totalPages: totalPages,
          }));
          dispatch(updateTodo({
            ...updatedTask,
            currentPage: todo.currentPage,  
            totalPages: totalPages,     
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

  const deleteSubtaskAndSubtasks = async (subtaskId: string) => {
    try {
      // Получаем все подзадачи для текущей подзадачи
      const response = await axios.get(`http://localhost:5000/api/tasks`, {
        params: {
          parentId: subtaskId,
          page: 1, // Страница не имеет значения, так как мы хотим только получить подзадачи
          limit: 5 // Лимит соответствует серверному значению
        }
      });
  
      const subtasks = response.data.tasks;
  
      if (Array.isArray(subtasks) && subtasks.length > 0) {
        // Удаляем все подзадачи рекурсивно
        for (const subtask of subtasks) {
          await deleteSubtaskAndSubtasks(subtask.id);
        }
      }
  
      // Удаляем текущую подзадачу
      await axios.delete(`http://localhost:5000/api/tasks/${subtaskId}`);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error; // Пробрасываем ошибку, чтобы она была обработана в вызывающем коде
    }
  };
  
  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!todo) return;
  
    try {
      await deleteSubtaskAndSubtasks(subtaskId);
      // После удаления, обновляем список подзадач
      const updatedResponse = await axios.get(`http://localhost:5000/api/tasks`, {
        params: {
          parentId: todo.id,
          page: currentPage,
          limit: 5, // Лимит соответствует серверному значению
          includeSubtasks: false
        }
      });
  
      const updatedData = updatedResponse.data;
      if (Array.isArray(updatedData.tasks)) {
        dispatch(loadSubtasks({
          id: todo.id,
          loadedSubtasks: updatedData.tasks,
          currentPage: currentPage,
          totalPages: updatedData.totalPages
        }));
        setTotalPages(updatedData.totalPages);
      } else {
        console.error('Received updated subtasks is not an array:', updatedData.tasks);
      }
    } catch (error) {
      console.error('Error handling delete subtask:', error);
      setError('Error deleting subtask');
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
      {(currentTodo?.loadedSubtasks ?? []).map((subtask) => (
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
          <MenuItem value="waiting">Ожидает</MenuItem>
          <MenuItem value="completed">Выполнено</MenuItem>
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