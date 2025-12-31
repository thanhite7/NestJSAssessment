/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { StudentService } from '../services/student.service';
import { Student } from '../../../entities/student.entity';
import { ERROR_MESSAGES } from '../../../shared/constants/app.constants';

describe('StudentService', () => {
  let service: StudentService;
  let repository: jest.Mocked<Repository<Student>>;

  const mockStudentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    repository = module.get(getRepositoryToken(Student));

    // Reset all mocks
    Object.values(mockStudentRepository).forEach(
      (mock) => typeof mock === 'function' && mock.mockReset(),
    );
    Object.values(mockQueryBuilder).forEach(
      (mock) => typeof mock === 'function' && mock.mockReset(),
    );
  });

  describe('findStudentByEmail', () => {
    it('should find student by valid email', async () => {
      const mockStudent = {
        id: 1,
        email: 'student@test.com',
        suspended: false,
      };
      repository.findOne.mockResolvedValue(mockStudent as Student);

      const result = await service.findStudentByEmail('Student@Test.com');

      expect(result).toEqual(mockStudent);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'student@test.com' },
      });
    });

    it('should return null if student not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findStudentByEmail('notfound@test.com');

      expect(result).toBeNull();
    });

    it('should throw error for invalid email format', async () => {
      await expect(service.findStudentByEmail('invalid-email')).rejects.toThrow(
        ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
      );
    });

    it('should handle empty email', async () => {
      await expect(service.findStudentByEmail('')).rejects.toThrow(
        ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
      );
    });

    it('should handle null/undefined email', async () => {
      await expect(service.findStudentByEmail(null as any)).rejects.toThrow();
      await expect(
        service.findStudentByEmail(undefined as any),
      ).rejects.toThrow();
    });
  });

  describe('findStudentsByEmails', () => {
    it('should find students by multiple valid emails', async () => {
      const mockStudents = [
        { id: 1, email: 'student1@test.com', suspended: false },
        { id: 2, email: 'student2@test.com', suspended: false },
      ];
      repository.find.mockResolvedValue(mockStudents as Student[]);

      const result = await service.findStudentsByEmails([
        'Student1@Test.com',
        'Student2@Test.com',
      ]);

      expect(result).toEqual(mockStudents);
      expect(repository.find).toHaveBeenCalledWith({
        where: { email: { $in: ['student1@test.com', 'student2@test.com'] } },
      });
    });

    it('should return empty array for empty input', async () => {
      const result = await service.findStudentsByEmails([]);
      expect(result).toEqual([]);
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('should filter out invalid emails', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findStudentsByEmails([
        'valid@test.com',
        'invalid-email',
        'another@test.com',
      ]);

      expect(repository.find).toHaveBeenCalledWith({
        where: { email: { $in: ['valid@test.com', 'another@test.com'] } },
      });
    });

    it('should handle duplicate emails', async () => {
      repository.find.mockResolvedValue([]);

      await service.findStudentsByEmails([
        'student@test.com',
        'Student@Test.com',
        'STUDENT@TEST.COM',
      ]);

      expect(repository.find).toHaveBeenCalledWith({
        where: { email: { $in: ['student@test.com'] } },
      });
    });
  });

  describe('bulkCreateStudents', () => {
    it('should create new students and return existing ones', async () => {
      const emails = ['new@test.com', 'existing@test.com'];
      const existingStudent = {
        id: 1,
        email: 'existing@test.com',
        suspended: false,
      };
      const newStudent = { id: 2, email: 'new@test.com', suspended: false };

      repository.find.mockResolvedValue([existingStudent] as Student[]);
      repository.create.mockReturnValue(newStudent as Student);
      repository.save.mockResolvedValue([newStudent] as Student[]);

      const result = await service.bulkCreateStudents(emails);

      expect(result.totalProcessed).toBe(2);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.successful).toContain(existingStudent);
      expect(result.successful).toContain(newStudent);
    });

    it('should handle invalid emails in batch', async () => {
      const emails = ['valid@test.com', 'invalid-email', 'another@test.com'];

      repository.find.mockResolvedValue([]);
      repository.create.mockImplementation((data) => data as Student);
      repository.save.mockResolvedValue([
        { id: 1, email: 'valid@test.com', suspended: false },
        { id: 2, email: 'another@test.com', suspended: false },
      ] as Student[]);

      const result = await service.bulkCreateStudents(emails);

      expect(result.totalProcessed).toBe(3);
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe(ERROR_MESSAGES.INVALID_EMAIL_FORMAT);
    });

    it('should handle database errors gracefully', async () => {
      const emails = ['student@test.com'];

      repository.find.mockResolvedValue([]);
      repository.save.mockRejectedValue(new Error('Database error'));

      const result = await service.bulkCreateStudents(emails);

      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].error).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should handle empty email list', async () => {
      const result = await service.bulkCreateStudents([]);

      expect(result.totalProcessed).toBe(0);
      expect(result.successful).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    it('should deduplicate input emails', async () => {
      const emails = [
        'student@test.com',
        'Student@Test.com',
        'student@test.com',
      ];

      repository.find.mockResolvedValue([]);
      repository.create.mockReturnValue({
        email: 'student@test.com',
      } as Student);
      repository.save.mockResolvedValue([
        { id: 1, email: 'student@test.com', suspended: false },
      ] as Student[]);

      await service.bulkCreateStudents(emails);

      expect(repository.save).toHaveBeenCalledWith([
        expect.objectContaining({ email: 'student@test.com' }),
      ]);
    });
  });

  describe('suspendStudent', () => {
    it('should suspend existing student using UPDATE', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(updateResult);

      await service.suspendStudent('student@test.com');

      expect(repository.update).toHaveBeenCalledWith(
        { email: 'student@test.com' },
        { suspended: true },
      );
    });

    it('should throw NotFoundException if student does not exist', async () => {
      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(updateResult);

      await expect(service.suspendStudent('notfound@test.com')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.suspendStudent('notfound@test.com')).rejects.toThrow(
        ERROR_MESSAGES.STUDENT_NOT_FOUND,
      );
    });

    it('should throw error for invalid email', async () => {
      await expect(service.suspendStudent('invalid-email')).rejects.toThrow(
        ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
      );
    });

    it('should normalize email before suspension', async () => {
      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };
      repository.update.mockResolvedValue(updateResult);

      await service.suspendStudent('Student@Test.COM');

      expect(repository.update).toHaveBeenCalledWith(
        { email: 'student@test.com' },
        { suspended: true },
      );
    });
  });

  describe('getActiveStudents', () => {
    beforeEach(() => {
      mockStudentRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('should get active students with pagination', async () => {
      const mockStudents = [
        { id: 1, email: 'student1@test.com', suspended: false },
        { id: 2, email: 'student2@test.com', suspended: false },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockStudents);

      const result = await service.getActiveStudents(10, 0);

      expect(result).toEqual(mockStudents);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'student.suspended = :suspended',
        { suspended: false },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });

    it('should get active students without pagination', async () => {
      const mockStudents = [
        { id: 1, email: 'student@test.com', suspended: false },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockStudents);

      await service.getActiveStudents();

      expect(mockQueryBuilder.limit).not.toHaveBeenCalled();
      expect(mockQueryBuilder.offset).not.toHaveBeenCalled();
    });
  });

  describe('countStudents', () => {
    beforeEach(() => {
      mockStudentRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('should count all students when no filter provided', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(10);

      const result = await service.countStudents();

      expect(result).toBe(10);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should count suspended students', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(3);

      const result = await service.countStudents(true);

      expect(result).toBe(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'student.suspended = :suspended',
        { suspended: true },
      );
    });

    it('should count active students', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(7);

      const result = await service.countStudents(false);

      expect(result).toBe(7);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'student.suspended = :suspended',
        { suspended: false },
      );
    });
  });
});
