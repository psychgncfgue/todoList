import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Status } from '../utils/enums';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Task, task => task.parent, { cascade: true })
  subtasks?: Task[];

  @ManyToOne(() => Task, task => task.subtasks, { onDelete: 'CASCADE', nullable: true })
  parent?: Task;

  @Column({ nullable: true })
  parentId?: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.WAITING
  })
  status!: Status;
}
