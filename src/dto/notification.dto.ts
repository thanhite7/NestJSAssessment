import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class NotificationDto {
  @IsEmail({}, { message: 'Teacher must be a valid email address' })
  teacher: string;

  @IsString({ message: 'Notification must be a string' })
  @IsNotEmpty({ message: 'Notification cannot be empty' })
  notification: string;
}
