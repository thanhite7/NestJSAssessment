import { IsEmail } from 'class-validator';

export class SuspendStudentDto {
  @IsEmail({}, { message: 'Student must be a valid email address' })
  student: string;
}
