import { IsEmail, IsArray, ArrayMinSize } from 'class-validator';
import { Transform } from 'class-transformer';
import { ERROR_MESSAGES } from '../../../shared/constants/app.constants';

/**
 * DTO for getting common students among teachers
 * Handles both single and multiple teacher emails with validation
 */
export class CommonStudentsDto {
  @IsArray({ message: ERROR_MESSAGES.EMPTY_TEACHER_LIST })
  @ArrayMinSize(1, { message: ERROR_MESSAGES.EMPTY_TEACHER_LIST })
  @IsEmail({}, { each: true, message: ERROR_MESSAGES.INVALID_EMAIL_FORMAT })
  @Transform(({ value }) => {
    return Array.isArray(value) ? value : [value];
  })
  teacher: string[];
}
