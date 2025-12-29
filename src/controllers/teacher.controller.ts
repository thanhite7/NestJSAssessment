import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { TeacherService } from '../services/teacher.service';
import { RegisterStudentsDto } from '../dto/register-students.dto';
import { SuspendStudentDto } from '../dto/suspend-student.dto';
import { NotificationDto } from '../dto/notification.dto';
import { CommonStudentsDto } from '../dto/common-students.dto';

@Controller('api')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerStudents(@Body() registerStudentsDto: RegisterStudentsDto) {
    await this.teacherService.registerStudents(
      registerStudentsDto.teacher,
      registerStudentsDto.students,
    );
  }

  @Get('commonstudents')
  async getCommonStudents(@Query() query: CommonStudentsDto) {
    const students = await this.teacherService.getCommonStudents(query.teacher);
    return { students };
  }

  @Post('suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspendStudent(@Body() suspendStudentDto: SuspendStudentDto) {
    await this.teacherService.suspendStudent(suspendStudentDto.student);
  }

  @Post('retrievefornotifications')
  async getNotificationRecipients(@Body() notificationDto: NotificationDto) {
    const recipients = await this.teacherService.getNotificationRecipients(
      notificationDto.teacher,
      notificationDto.notification,
    );
    return { recipients };
  }
}
