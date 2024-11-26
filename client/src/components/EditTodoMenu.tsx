import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Select, MenuItem,
  Collapse,
  IconButton
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { Add, Close } from '@mui/icons-material';
import { EditTodoMenuProps, NewTodo } from '../types/interfaces';
import { editTodo, addTodo } from '../actions/actions';

const EditTodoMenu: React.FC<EditTodoMenuProps> = ({ open, onClose, todo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'completed'>('waiting');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [newSubtaskDiscription, setNewSubtaskDiscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isBoxVisible, setIsBoxVisible] = useState(false);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setStatus(todo.status || 'waiting');
      setNewSubtaskTitle('');
    }
  }, [todo]);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim() && todo?.id) {
      const newSubtask: NewTodo = {
        title: newSubtaskTitle,
        description: newSubtaskDiscription,
        status: 'waiting',
        parentId: todo.id,
      };
      setNewSubtaskTitle('');
      dispatch(addTodo(newSubtask));
      return true
    } else {
      setError('Введите название подзадачи');
    }
  };

  const handleUpdate = (id?: string) => {
    if (id && title.trim()) {
      const updatedFields = { title, description: description || '', status };
      dispatch(editTodo({ id, ...updatedFields }));
      onClose();
    } else {
      setError('Заполните все поля');
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
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
            <DialogTitle>Добавить подзадачу</DialogTitle>
            <IconButton
              color="primary"
              onClick={() => {setIsBoxVisible((prev) => !prev); setError(null)}}
            >
              {isBoxVisible ? <Close /> : <Add />}
            </IconButton>
          </Box>
          <Collapse in={isBoxVisible}>
            <Box mt={2}>
              <TextField
                label="Название подзадачи"
                fullWidth
                margin="normal"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
              />
              <TextField
                label="Описание подзадачи"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={newSubtaskDiscription}
                onChange={(e) => setNewSubtaskDiscription(e.target.value)}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const result = handleAddSubtask();
                  if (result) {
                    setIsBoxVisible(false);
                  }
                }}
                startIcon={<Add />}
              >
                Добавить подзадачу
              </Button>
            </Box>
          </Collapse>
        </Box>
        {error && <p>{error}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Отмена</Button>
        <Button
          color="primary"
          onClick={() => handleUpdate(todo?.id)}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTodoMenu;