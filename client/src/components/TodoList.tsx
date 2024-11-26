import { Container, Typography, List } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTodos } from "../actions/actions";
import { AppDispatch, RootState } from "../store/store";
import TodoItem from './TodoItem';

const TodoList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);
  const { tasks } = useSelector((state: RootState) => state.todos.tasks);

  return (
    <Container>
      <Typography variant="h6" sx={{ marginBottom: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        Дела
      </Typography>
      <List>
        {tasks && tasks.length > 0 ? (
          tasks.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Нет задач
          </Typography>
        )}
      </List>
    </Container>
  );
};

export default TodoList;