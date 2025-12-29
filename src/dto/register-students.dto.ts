import { IsEmail, IsArray, ArrayMinSize } from 'class-validator';

export class RegisterStudentsDto {
  @IsEmail({}, { message: 'Teacher must be a valid email address' })
  teacher: string;

  @IsArray({ message: 'Students must be an array' })
  @ArrayMinSize(1, { message: 'At least one student email is required' })
  @IsEmail(
    {},
    {
      each: true,
      message: 'All student entries must be valid email addresses',
    },
  )
  students: string[];
}
