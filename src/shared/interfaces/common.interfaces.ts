/**
 * Shared interfaces and types for the application
 */

export interface IEmailService {
  isValidEmail(email: string): boolean;
  extractMentionedEmails(text: string): string[];
}

export interface IStudentOperations {
  findOrCreateStudent(email: string): Promise<any>;
  findStudentsByEmails(emails: string[]): Promise<any[]>;
  suspendStudent(email: string): Promise<void>;
  bulkCreateStudents(emails: string[]): Promise<IBatchOperationResult<any>>;
}

export interface ITeacherOperations {
  findOrCreateTeacher(email: string): Promise<any>;
  registerStudentsToTeacher(
    teacherEmail: string,
    studentEmails: string[],
  ): Promise<void>;
  getTeacherStudents(teacherEmail: string): Promise<string[]>;
}

export interface INotificationData {
  teacherEmail: string;
  notification: string;
  mentionedEmails: string[];
  registeredStudents: string[];
}

export interface IBatchOperationResult<T> {
  successful: T[];
  failed: { item: any; error: string }[];
  totalProcessed: number;
}

export type EmailList = string[];
export type StudentEmailMap = Map<string, any>;
export type TeacherEmailMap = Map<string, any>;
