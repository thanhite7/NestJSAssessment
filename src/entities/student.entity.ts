import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Teacher } from './teacher.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  suspended: boolean;

  @ManyToMany(() => Teacher, (teacher) => teacher.students)
  teachers: Teacher[];
}
