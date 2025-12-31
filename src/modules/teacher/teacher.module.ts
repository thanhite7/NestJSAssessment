import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from '../../entities/teacher.entity';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { StudentModule } from '../student/student.module';

/**
 * Teacher module that encapsulates teacher-related functionality
 * Imports StudentModule for dependency injection and collaboration
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher]),
    StudentModule, // Import StudentModule to use StudentService
  ],
  controllers: [TeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule {}
