import { createConnection } from 'typeorm';
import dotenv from 'dotenv';
import { Task } from '../models/taskModel';

dotenv.config();

const connection = createConnection({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Task],
  synchronize: true,
});

export default connection;