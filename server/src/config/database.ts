import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Task } from '../models/taskModel';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD);
console.log('POSTGRES_DB:', process.env.POSTGRES_DB);

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST?.trim(),
  port: Number(process.env.DB_PORT?.trim()),
  username: process.env.POSTGRES_USER?.trim(),
  password: process.env.POSTGRES_PASSWORD?.trim(),
  database: process.env.POSTGRES_DB?.trim(),
  entities: [Task],
  synchronize: true,
  logging: false,
});

export default dataSource;