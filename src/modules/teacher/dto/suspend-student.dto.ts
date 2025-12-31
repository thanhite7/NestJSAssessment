import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ERROR_MESSAGES } from '../../../shared/constants/app.constants';

/**
 * DTO for suspending a student
 * Includes email validation
 */
export class SuspendStudentDto {
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  @IsString({ message: 'Student email must be a string' })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMPTY_STUDENT_LIST })
  student: string;
}
