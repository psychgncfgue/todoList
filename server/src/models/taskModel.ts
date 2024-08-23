import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Status } from '../utils/enums';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  subtasks?: object[];
  

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.WAITING
  })
  status!: Status;
}
