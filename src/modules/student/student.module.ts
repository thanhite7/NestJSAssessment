import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../../entities/student.entity';
import { StudentService } from './student.service';

/**
 * Student module that encapsulates student-related functionality
 * Provides student service and repository access for dependency injection
 */
@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  providers: [StudentService],
  exports: [StudentService, TypeOrmModule],
})
export class StudentModule {}
