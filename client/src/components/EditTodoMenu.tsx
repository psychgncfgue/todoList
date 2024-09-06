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

const EditTodoMenu: React.FC<EditTodoMenuProps> = ({ open, onClose, todo, fetchAllSubtasks }) => {
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
    }
  }, [todo, dispatch, currentPage]);


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

  const handleUpdate = async () => {
    if (todo && title.trim()) {
        const updatedFields = {
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
                body: JSON.stringify(updatedFields),
            });

            if (!response.ok) {
                console.error('Failed to update todo:', response.statusText);
            } else {
                console.log('Todo updated successfully');
                dispatch(updateTodo({
                    id: todo.id,
                    title: updatedFields.title,
                    description: updatedFields.description,
                    status: updatedFields.status,
                    isExpanded: todo.isExpanded,
                }));
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        } finally {
            onClose();
        }
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