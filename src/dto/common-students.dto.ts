import { IsEmail, IsArray, ArrayMinSize, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CommonStudentsDto {
  @IsArray({ message: 'Teacher must be an array of emails' })
  @ArrayMinSize(1, { message: 'At least one teacher email is required' })
  @IsEmail(
    {},
    {
      each: true,
      message: 'All teacher entries must be valid email addresses',
    },
  )
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  teacher: string[];
}
