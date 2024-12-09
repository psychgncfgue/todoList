1: Это приложение специализируется на создании, редактировании и удалении задач(todo).

2: Здесь реализовано сложное рекурсивное управление состоянием бесконечно многого уровня вложенности подзадач.

3: В данном приложении для редюсеров используются вспомогательные рекурсивные функции для расчета данных неизвестного уровня вложенности, которые находятся в client/src/utils/todoHelpers.ts

4: Для запросов и обработки успешных/неудачных ответов используется middleware redux-saga, который реализован в client/src/sagas/saga.ts.

5: Для управления состоянием стора используется библиотека redux-toolkit с использованием среза(slice), который находится в client/src/redux/todoSlice.ts.

6: Для вывода данных в UI используется рекурсивный компонент TodoItem, который внутри себя вызывает себя же передавая в себя данные о задачи следующего уровня вложенности. Находится данный компонент в client/src/components/TodoItem.tsx.

7: Для управления запросами и манипуляциями с данными используется MVC модульный сервер написанный на express.js для node.js.

8: Для хранения данных используется реляционная база данных PosgtreSQL, которая поднимается в контейнере докера.

9: Для общения между контейнерами фронтэнда и бэкэнда используется обратный прокси веб-сервер Nginx.

10: Для запуска всего приложения в корне проекта команда: docker-compose up --build. После чего можно открыть фронт на http://localhost/