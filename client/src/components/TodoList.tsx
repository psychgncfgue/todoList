import { Container, Typography, List, Pagination } from "@mui/material";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTodos, pageChangeTodo } from "../actions/actions";
import { AppDispatch, RootState } from "../store/store";
import TodoItem from './TodoItem';

const TodoList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, pagination } = useSelector((state: RootState) => state.todos.tasks);

  useEffect(() => {
    dispatch(fetchTodos());
  }, [dispatch]);

  const handlePageChangeMain = useCallback((page: number) => {
    dispatch(pageChangeTodo(page));
  }, [dispatch]);

  useEffect(() => {
    if (
      Array.isArray(tasks) &&
      tasks.length === 0 &&
      pagination.currentPage > 1 &&
      pagination.currentPage > pagination.totalPages
    ) {
      handlePageChangeMain(pagination.currentPage - 1);
    }
  }, [tasks, pagination, handlePageChangeMain]);

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
        {pagination.totalPages > 1 && (
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={(event, page) => handlePageChangeMain(page)}
                  sx={{ marginTop: '1rem', alignSelf: 'center' }}
                />
              )}
      </List>
    </Container>
  );
};

export default TodoList;