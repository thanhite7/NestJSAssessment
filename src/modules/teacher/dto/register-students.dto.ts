import { IsEmail, IsArray, ArrayMinSize } from 'class-validator';
import { ERROR_MESSAGES } from '../../../shared/constants/app.constants';

/**
 * DTO for registering students to a teacher
 * Includes validation for teacher and student emails
 */
export class RegisterStudentsDto {
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  teacher: string;

  @IsArray({ message: 'Students must be an array' })
  @ArrayMinSize(1, { message: ERROR_MESSAGES.EMPTY_STUDENT_LIST })
  @IsEmail(
    {},
    {
      each: true,
      message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
    },
  )
  students: string[];
}
