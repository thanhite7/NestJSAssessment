/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, UpdateResult } from 'typeorm';
import { Student } from '../../entities/student.entity';
import {
  ERROR_MESSAGES
} from '../../shared/constants/app.constants';
import { EmailUtils } from '../shared/utils/email.utils';
import {
  IBatchOperationResult,
  EmailList,
} from '../../shared/interfaces/common.interfaces';

/**
 * Service responsible for student-related operations
 * Handles CRUD operations with optimized batch processing and proper error handling
 */
@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  /**
   * Finds an existing student by email
   * @param email - Student email (normalized)
   * @returns Promise<Student | null> - Student entity or null if not found
   */
  async findStudentByEmail(email: string): Promise<Student | null> {
    const normalizedEmail = EmailUtils.normalizeEmail(email);

    if (!EmailUtils.isValidEmail(normalizedEmail)) {
      throw new Error(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    return this.studentRepository.findOne({
      where: { email: normalizedEmail },
    });
  }

  /**
   * Batch operation to find students by emails with optimized query
   * @param emails - Array of student emails
   * @returns Promise<Student[]> - Array of found students
   */
  async findStudentsByEmails(emails: EmailList): Promise<Student[]> {
    if (emails.length === 0) return [];

    const validEmails = EmailUtils.filterValidEmails(emails);
    if (validEmails.length === 0) return [];

    const normalizedEmails = EmailUtils.normalizeEmails(validEmails);

    return this.studentRepository.find({
      where: { email: In(normalizedEmails) },
    });
  }

  /**
   * Creates multiple students in batch operation with comprehensive error handling
   * Only creates students that don't already exist to avoid duplicates
   * @param emails - Array of student emails to create
   * @returns Promise<IBatchOperationResult<Student>>
   */
  async bulkCreateStudents(
    emails: EmailList,
  ): Promise<IBatchOperationResult<Student>> {
    const result: IBatchOperationResult<Student> = {
      successful: [],
      failed: [],
      totalProcessed: emails.length,
    };

    if (emails.length === 0) return result;

    // Remove duplicates and validate emails
    const validEmails = EmailUtils.filterValidEmails(emails);
    const invalidEmails = emails.filter(
      (email) => !EmailUtils.isValidEmail(email),
    );

    // Add invalid emails to failed results
    invalidEmails.forEach((email) => {
      result.failed.push({
        item: email,
        error: ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
      });
    });

    if (validEmails.length === 0) return result;

    const normalizedEmails = EmailUtils.normalizeEmails(validEmails);

    try {
      // Find existing students to avoid creating duplicates
      const existingStudents =
        await this.findStudentsByEmails(normalizedEmails);
      const existingEmailsSet = new Set(existingStudents.map((s) => s.email));

      // Add existing students to successful results
      result.successful.push(...existingStudents);

      // Create new students for emails that don't exist
      const newEmails = normalizedEmails.filter(
        (email) => !existingEmailsSet.has(email),
      );

      if (newEmails.length > 0) {
        const newStudents = newEmails.map((email) =>
          this.studentRepository.create({ email, suspended: false }),
        );

        const savedStudents = await this.studentRepository.save(newStudents);
        result.successful.push(...savedStudents);

        this.logger.log(
          `Successfully created ${savedStudents.length} new students`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to bulk create students:', error);
      normalizedEmails.forEach((email) => {
        result.failed.push({
          item: email,
          error: ERROR_MESSAGES.DATABASE_ERROR,
        });
      });
    }

    return result;
  }

  /**
   * Suspends a student using optimized UPDATE query instead of save()
   * @param email - Student email to suspend
   * @throws NotFoundException if student doesn't exist
   */
  async suspendStudent(email: string): Promise<void> {
    const normalizedEmail = EmailUtils.normalizeEmail(email);

    if (!EmailUtils.isValidEmail(normalizedEmail)) {
      throw new Error(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    }

    // Use UPDATE query for better performance instead of find + save
    const updateResult: UpdateResult = await this.studentRepository.update(
      { email: normalizedEmail },
      { suspended: true },
    );

    if (updateResult.affected === 0) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENT_NOT_FOUND);
    }

    this.logger.log(`Successfully suspended student: ${normalizedEmail}`);
  }

  /**
   * Gets all active (non-suspended) students with pagination support
   * @param limit - Maximum number of students to return
   * @param offset - Number of students to skip
   * @returns Promise<Student[]> - Array of active students
   */
  async getActiveStudents(limit?: number, offset?: number): Promise<Student[]> {
    const query = this.studentRepository
      .createQueryBuilder('student')
      .where('student.suspended = :suspended', { suspended: false })
      .orderBy('student.email', 'ASC');

    if (limit) query.limit(limit);
    if (offset) query.offset(offset);

    return query.getMany();
  }

  /**
   * Gets students by emails with optional suspension status filter
   * @param emails - Array of student emails
   * @param includeSuspended - Whether to include suspended students
   * @returns Promise<Student[]>
   */
  async getStudentsByEmails(
    emails: EmailList,
    includeSuspended = false,
  ): Promise<Student[]> {
    if (emails.length === 0) return [];

    const validEmails = EmailUtils.filterValidEmails(emails);
    if (validEmails.length === 0) return [];

    const normalizedEmails = EmailUtils.normalizeEmails(validEmails);

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .where('student.email IN (:...emails)', { emails: normalizedEmails });

    if (!includeSuspended) {
      queryBuilder.andWhere('student.suspended = :suspended', {
        suspended: false,
      });
    }

    return queryBuilder.orderBy('student.email', 'ASC').getMany();
  }

  /**
   * Counts total number of students with optional status filter
   * @param suspended - Filter by suspension status (optional)
   * @returns Promise<number> - Count of students
   */
  async countStudents(suspended?: boolean): Promise<number> {
    const query = this.studentRepository.createQueryBuilder('student');

    if (suspended !== undefined) {
      query.where('student.suspended = :suspended', { suspended });
    }

    return query.getCount();
  }
}
