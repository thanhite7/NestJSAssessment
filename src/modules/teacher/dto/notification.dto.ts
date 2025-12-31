import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ERROR_MESSAGES } from '../../../shared/constants/app.constants';

/**
 * DTO for notification recipients request
 * Includes email validation and notification text validation
 */
export class NotificationDto {
  @IsEmail({}, { message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  @IsString({ message: 'Teacher email must be a string' })
  @IsNotEmpty({ message: ERROR_MESSAGES.EMPTY_TEACHER_LIST })
  teacher: string;

  @IsString({ message: 'Notification must be a string' })
  @IsNotEmpty({ message: 'Notification text cannot be empty' })
  notification: string;
}
