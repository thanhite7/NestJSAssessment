import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { TeacherService } from '../services/teacher.service';
import { TeacherController } from '../controllers/teacher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, Student])],
  providers: [TeacherService],
  controllers: [TeacherController],
})
export class TeacherModule {}
