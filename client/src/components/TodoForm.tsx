import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { addTodo } from '../actions/actions';
import { TextField, Button, Typography, Container, Box, Alert } from '@mui/material';
import { NewTodo } from '../types/interfaces';

const TodoForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }
    const newTodo: NewTodo = {
      title,
      description,
      status: 'waiting',
    };
    dispatch(addTodo(newTodo));
    setTitle('');
    setDescription('');
    setError(null);
  };

  return (
    <Container>
      <Box>
        <Typography variant="h6">На сегодня</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleSubmit} sx={{mt: 4}}>
          Добавить
        </Button>
      </Box>
    </Container>
  );
};

export default TodoForm;