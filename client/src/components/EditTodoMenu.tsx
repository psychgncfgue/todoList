import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Box, List, ListItem, ListItemText, Select, MenuItem
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { updateTodo, setEditingTodo } from '../features/todoSlice';
import { Add, Delete } from '@mui/icons-material';
import { Todo, Subtask, EditTodoMenuProps } from '../types/interfaces';

const EditTodoMenu: React.FC<EditTodoMenuProps> = ({ open, onClose, todo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const editingTodo = useSelector((state: RootState) => state.todos.editingTodo);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'completed'>('waiting');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskTitle, setSubtaskTitle] = useState<string>('');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description);
      setStatus(todo.status);
      setSubtasks(todo.subtasks || []);
    }
  }, [todo]);

  const handleUpdate = async () => {
    if (todo && title.trim() && description.trim()) {
      const updatedTodo = {
        ...todo,
        title,
        description,
        subtasks,
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
          dispatch(updateTodo(updatedTask));
          dispatch(setEditingTodo(null));
          onClose();
        } else {
          const errorData = await response.json();
          console.error(errorData.error);
        }
      } catch (error) {
        console.error('Server error:', error);
      }
    }
  };

  const handleAddSubtask = () => {
    if (subtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: new Date().toISOString(),
        title: subtaskTitle,
        status: 'waiting',
      };
      setSubtasks([...subtasks, newSubtask]);
      setSubtaskTitle('');
    }
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(subtask => subtask.id !== id));
  };

  const handleCancel = () => {
    dispatch(setEditingTodo(null));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Редактировать дело</DialogTitle>
      <DialogContent>
        <TextField
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
        />
        <TextField
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
        />
        <Box marginY={2}>
          <Select
            label="Статус"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'waiting' | 'completed')}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="waiting">Waiting</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </Box>
        <Box display="flex" alignItems="center" marginY={2}>
          <TextField
            label="Подзадача"
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            fullWidth
            variant="outlined"
          />
          <IconButton onClick={handleAddSubtask} color="primary">
            <Add />
          </IconButton>
        </Box>
        <List>
          {subtasks.map(subtask => (
            <ListItem key={subtask.id}>
              <ListItemText primary={subtask.title} />
              <Select
                value={subtask.status}
                onChange={(e) => {
                  setSubtasks(subtasks.map(st =>
                    st.id === subtask.id ? { ...st, status: e.target.value as 'waiting' | 'completed' } : st
                  ));
                }}
              >
                <MenuItem value="waiting">Waiting</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
              <IconButton edge="end" onClick={() => handleDeleteSubtask(subtask.id)} color="secondary">
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="secondary">
          Отмена
        </Button>
        <Button onClick={handleUpdate} color="primary">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTodoMenu;