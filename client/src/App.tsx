import React from 'react';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import { RootState } from './store/store';

const App: React.FC = () => {
  const loading = useSelector((state: RootState) => state.todos.loading); 

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)', 
            backdropFilter: 'blur(3px)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000, 
          }}
        >
          <CircularProgress size={60} color="secondary" />
        </Box>
      )}
      <Box sx={{ filter: loading ? 'blur(4px)' : 'none' }}>
        <TodoForm />
        <TodoList />
      </Box>
    </Box>
  );
};

export default App;