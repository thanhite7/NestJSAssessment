import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  HttpCode,
  Query,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { RegisterStudentsDto } from './dto/register-students.dto';
import { CommonStudentsDto } from './dto/common-students.dto';
import { SuspendStudentDto } from './dto/suspend-student.dto';
import { NotificationDto } from './dto/notification.dto';

/**
 * Teacher controller handles all teacher-related endpoints
 * Follows RESTful conventions with proper HTTP status codes and error handling
 */
@Controller()
export class TeacherController {
  private readonly logger = new Logger(TeacherController.name);

  constructor(private readonly teacherService: TeacherService) {}

  /**
   * Register students to a teacher
   * POST /api/v1/register
   * @param registerDto - Registration data containing teacher and student emails
   * @returns 204 No Content on success
   */
  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerStudents(
    @Body(ValidationPipe) registerDto: RegisterStudentsDto,
  ): Promise<void> {
    const { teacher, students } = registerDto;

    this.logger.log(
      `Registering ${students.length} students to teacher: ${teacher}`,
    );
    await this.teacherService.registerStudentsToTeacher(teacher, students);
  }

  /**
   * Get common students for multiple teachers
   * GET /api/v1/commonstudents?teacher=email1&teacher=email2
   * @param commonStudentsDto - Query parameters with teacher emails
   * @returns 200 OK with students array
   */
  @Get('commonstudents')
  @HttpCode(HttpStatus.OK)
  async getCommonStudents(
    @Query(ValidationPipe) commonStudentsDto: CommonStudentsDto,
  ): Promise<{ students: string[] }> {
    const { teacher } = commonStudentsDto;

    this.logger.log(
      `Getting common students for teachers: ${teacher.join(', ')}`,
    );
    const students = await this.teacherService.getCommonStudents(teacher);

    return { students };
  }

  /**
   * Suspend a student
   * POST /api/v1/suspend
   * @param suspendDto - Suspension data containing student email
   * @returns 204 No Content on success
   */
  @Post('suspend')
  @HttpCode(HttpStatus.NO_CONTENT)
  async suspendStudent(
    @Body(ValidationPipe) suspendDto: SuspendStudentDto,
  ): Promise<void> {
    const { student } = suspendDto;

    this.logger.log(`Suspending student: ${student}`);
    await this.teacherService.suspendStudent(student);
  }

  /**
   * Get notification recipients
   * POST /api/v1/retrievefornotifications
   * @param notificationDto - Notification data containing teacher and notification text
   * @returns 200 OK with recipients array
   */
  @Post('retrievefornotifications')
  @HttpCode(HttpStatus.OK)
  async getNotificationRecipients(
    @Body(ValidationPipe) notificationDto: NotificationDto,
  ): Promise<{ recipients: string[] }> {
    const { teacher, notification } = notificationDto;

    this.logger.log(`Getting notification recipients for teacher: ${teacher}`);
    const recipients = await this.teacherService.getNotificationRecipients(
      teacher,
      notification,
    );

    return { recipients };
  }
}
