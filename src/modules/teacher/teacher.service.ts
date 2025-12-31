import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Teacher } from '../../entities/teacher.entity';
import { StudentService } from '../student/services/student.service';
import { EmailUtils } from '../shared/utils/email.utils';
import { ERROR_MESSAGES } from '../../shared/constants/app.constants';
import { EmailList } from '../../shared/interfaces/common.interfaces';

/**
 * Service responsible for teacher-related operations and student-teacher relationships
 * Handles registration, common students, and notification logic with optimized batch operations
 * Fixed logic issues: proper teacher validation, batch operations, duplicate handling
 */
@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly studentService: StudentService,
  ) {}

  /**
   * Finds an existing teacher by email
   * @param email - Teacher email (normalized)
   * @returns Promise<Teacher | null> - Teacher entity or null if not found
   */
  async findTeacherByEmail(email: string): Promise<Teacher | null> {
    const normalizedEmail = EmailUtils.normalizeEmail(email);

    if (!EmailUtils.isValidEmail(normalizedEmail)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    return this.teacherRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['students'],
    });
  }

  /**
   * Creates a new teacher - only when explicitly needed (not from student registration)
   * @param email - Teacher email
   * @returns Promise<Teacher> - Created teacher entity
   */
  async createTeacher(email: string): Promise<Teacher> {
    const normalizedEmail = EmailUtils.normalizeEmail(email);

    if (!EmailUtils.isValidEmail(normalizedEmail)) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    const teacher = this.teacherRepository.create({ email: normalizedEmail });
    const savedTeacher = await this.teacherRepository.save(teacher);
    savedTeacher.students = [];

    this.logger.log(`Created new teacher: ${normalizedEmail}`);
    return savedTeacher;
  }

  /**
   * Registers multiple students to a teacher using batch operations
   * Fixed logic: Only register to existing teachers, don't auto-create teachers
   * Optimized to avoid N+1 queries and handle duplicates efficiently
   * @param teacherEmail - Teacher email (must exist)
   * @param studentEmails - Array of student emails to register
   * @throws NotFoundException if teacher doesn't exist
   */
  async registerStudentsToTeacher(
    teacherEmail: string,
    studentEmails: EmailList,
  ): Promise<void> {
    if (studentEmails.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPTY_STUDENT_LIST);
    }

    const normalizedTeacherEmail = EmailUtils.normalizeEmail(teacherEmail);

    // Find existing teacher - DO NOT create if not exists
    const teacher = await this.findTeacherByEmail(normalizedTeacherEmail);
    if (!teacher) {
      throw new NotFoundException(ERROR_MESSAGES.TEACHER_NOT_FOUND);
    }

    // Remove duplicates and validate student emails
    const validStudentEmails = EmailUtils.filterValidEmails(studentEmails);
    if (validStudentEmails.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    // Batch create/find students
    const studentsResult =
      await this.studentService.bulkCreateStudents(validStudentEmails);
    const students = studentsResult.successful;

    if (students.length === 0) {
      this.logger.warn(
        `No valid students to register for teacher: ${normalizedTeacherEmail}`,
      );
      return;
    }

    // Filter out students already registered to this teacher to avoid duplicates
    const existingStudentIds = new Set(teacher.students.map((s) => s.id));
    const newStudents = students.filter(
      (student) => !existingStudentIds.has(student.id),
    );

    if (newStudents.length === 0) {
      this.logger.log(
        `All students already registered to teacher: ${normalizedTeacherEmail}`,
      );
      return;
    }

    // Add new students to teacher using spread operator (no mutation)
    const updatedTeacher = {
      ...teacher,
      students: [...teacher.students, ...newStudents],
    };

    await this.teacherRepository.save(updatedTeacher);

    this.logger.log(
      `Registered ${newStudents.length} students to teacher: ${normalizedTeacherEmail}`,
    );
  }

  /**
   * Gets students registered to a specific teacher
   * @param teacherEmail - Teacher email
   * @returns Promise<EmailList> - Array of student emails (sorted)
   * @throws NotFoundException if teacher doesn't exist
   */
  async getTeacherStudents(teacherEmail: string): Promise<EmailList> {
    const teacher = await this.findTeacherByEmail(teacherEmail);

    if (!teacher) {
      throw new NotFoundException(ERROR_MESSAGES.TEACHER_NOT_FOUND);
    }

    const activeStudentEmails = teacher.students
      .filter((student) => !student.suspended)
      .map((student) => student.email);

    return [...activeStudentEmails].sort();
  }

  /**
   * Finds common students among multiple teachers using efficient set operations
   * Fixed logic: Handle duplicate teacher emails, proper validation
   * Optimized to reduce database queries and improve performance
   * @param teacherEmails - Array of teacher emails (duplicates will be removed)
   * @returns Promise<EmailList> - Array of common student emails (sorted)
   */
  async getCommonStudents(teacherEmails: EmailList): Promise<EmailList> {
    if (teacherEmails.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMPTY_TEACHER_LIST);
    }

    // Remove duplicates and validate teacher emails
    const validTeacherEmails = EmailUtils.filterValidEmails(teacherEmails);
    if (validTeacherEmails.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    const normalizedTeacherEmails =
      EmailUtils.normalizeEmails(validTeacherEmails);

    // Batch fetch all teachers with their students
    const teachers = await this.teacherRepository.find({
      where: { email: In(normalizedTeacherEmails) },
      relations: ['students'],
    });

    // Return empty if not all teachers found
    if (teachers.length !== normalizedTeacherEmails.length) {
      const foundEmails = new Set(teachers.map((t) => t.email));
      const missingEmails = normalizedTeacherEmails.filter(
        (email) => !foundEmails.has(email),
      );
      this.logger.warn(`Teachers not found: ${missingEmails.join(', ')}`);
      return [];
    }

    // Handle single teacher case for optimization
    if (teachers.length === 1) {
      return teachers[0].students
        .filter((student) => !student.suspended)
        .map((student) => student.email)
        .sort();
    }

    // Find intersection of all teacher's active students using Set operations
    const studentEmailSets = teachers.map(
      (teacher) =>
        new Set(
          teacher.students
            .filter((student) => !student.suspended)
            .map((student) => student.email),
        ),
    );

    // Get intersection of all sets efficiently
    const firstSet = studentEmailSets[0];
    const commonStudentEmails = [...firstSet].filter((email) =>
      studentEmailSets.slice(1).every((set) => set.has(email)),
    );

    return commonStudentEmails.sort();
  }

  /**
   * Gets notification recipients including registered students and mentioned students
   * Fixed logic: Don't auto-create students from mentions, only find existing ones
   * Uses batch operations and optimized database queries
   * @param teacherEmail - Teacher sending the notification
   * @param notification - Notification text
   * @returns Promise<EmailList> - Array of recipient emails (sorted)
   */
  async getNotificationRecipients(
    teacherEmail: string,
    notification: string,
  ): Promise<EmailList> {
    const normalizedTeacherEmail = EmailUtils.normalizeEmail(teacherEmail);

    // Get teacher's registered students (empty array if teacher doesn't exist)
    const registeredStudents = await this.getTeacherStudents(
      normalizedTeacherEmail,
    ).catch(() => []); // Don't throw if teacher not found, just return empty array

    // Extract and deduplicate mentioned emails from notification
    const mentionedEmails = EmailUtils.extractMentionedEmails(notification);

    // Find existing mentioned students (don't create new ones)
    let mentionedActiveStudents: EmailList = [];
    if (mentionedEmails.length > 0) {
      const existingMentionedStudents =
        await this.studentService.getStudentsByEmails(
          mentionedEmails,
          false, // Only get active (non-suspended) students
        );

      mentionedActiveStudents = existingMentionedStudents.map(
        (student) => student.email,
      );
    }

    // Combine and deduplicate recipients using Set
    const allRecipientsSet = new Set([
      ...registeredStudents,
      ...mentionedActiveStudents,
    ]);

    const recipients = [...allRecipientsSet].sort();

    this.logger.log(
      `Notification recipients for ${normalizedTeacherEmail}: ${recipients.length} students`,
    );

    return recipients;
  }

  /**
   * Delegates student suspension to StudentService
   * @param studentEmail - Email of student to suspend
   */
  async suspendStudent(studentEmail: string): Promise<void> {
    return this.studentService.suspendStudent(studentEmail);
  }

  /**
   * Gets all teachers with pagination support
   * @param limit - Maximum number of teachers to return
   * @param offset - Number of teachers to skip
   * @returns Promise<Teacher[]> - Array of teachers
   */
  async getAllTeachers(limit?: number, offset?: number): Promise<Teacher[]> {
    const query = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.students', 'student')
      .orderBy('teacher.email', 'ASC');

    if (limit) query.limit(limit);
    if (offset) query.offset(offset);

    return query.getMany();
  }

  /**
   * Counts total number of teachers
   * @returns Promise<number> - Count of teachers
   */
  async countTeachers(): Promise<number> {
    return this.teacherRepository.count();
  }
}
