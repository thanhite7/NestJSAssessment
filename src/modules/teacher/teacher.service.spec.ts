/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { Teacher } from '../../entities/teacher.entity';
import { StudentService } from '../student/services/student.service';
import { ERROR_MESSAGES } from '../../shared/constants/app.constants';

describe('TeacherService', () => {
  let service: TeacherService;
  let teacherRepository: jest.Mocked<Repository<Teacher>>;
  let studentService: jest.Mocked<StudentService>;

  const mockTeacherRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockStudentService = {
    bulkCreateStudents: jest.fn(),
    suspendStudent: jest.fn(),
    getStudentsByEmails: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        {
          provide: getRepositoryToken(Teacher),
          useValue: mockTeacherRepository,
        },
        {
          provide: StudentService,
          useValue: mockStudentService,
        },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    teacherRepository = module.get(getRepositoryToken(Teacher));
    studentService = module.get(StudentService);

    // Reset all mocks
    Object.values(mockTeacherRepository).forEach(
      (mock) => typeof mock === 'function' && mock.mockReset(),
    );
    Object.values(mockStudentService).forEach(
      (mock) => typeof mock === 'function' && mock.mockReset(),
    );
    Object.values(mockQueryBuilder).forEach(
      (mock) => typeof mock === 'function' && mock.mockReset(),
    );
  });

  describe('findTeacherByEmail', () => {
    it('should find teacher by valid email', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [],
      };
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.findTeacherByEmail('Teacher@Test.com');

      expect(result).toEqual(mockTeacher);
      expect(teacherRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'teacher@test.com' },
        relations: ['students'],
      });
    });

    it('should throw BadRequestException for invalid email', async () => {
      await expect(service.findTeacherByEmail('invalid-email')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findTeacherByEmail('invalid-email')).rejects.toThrow(
        ERROR_MESSAGES.INVALID_EMAIL_FORMAT,
      );
    });

    it('should return null if teacher not found', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      const result = await service.findTeacherByEmail('notfound@test.com');

      expect(result).toBeNull();
    });
  });

  describe('createTeacher', () => {
    it('should create new teacher with valid email', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [],
      };
      teacherRepository.create.mockReturnValue(mockTeacher as Teacher);
      teacherRepository.save.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.createTeacher('Teacher@Test.com');

      expect(result).toEqual(mockTeacher);
      expect(teacherRepository.create).toHaveBeenCalledWith({
        email: 'teacher@test.com',
      });
      expect(teacherRepository.save).toHaveBeenCalledWith(mockTeacher);
    });

    it('should throw BadRequestException for invalid email', async () => {
      await expect(service.createTeacher('invalid-email')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registerStudentsToTeacher', () => {
    const mockTeacher = {
      id: 1,
      email: 'teacher@test.com',
      students: [{ id: 1, email: 'existing@test.com', suspended: false }],
    };

    it('should register new students to existing teacher', async () => {
      const studentEmails = ['new1@test.com', 'new2@test.com'];
      const newStudents = [
        { id: 2, email: 'new1@test.com', suspended: false },
        { id: 3, email: 'new2@test.com', suspended: false },
      ];

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      studentService.bulkCreateStudents.mockResolvedValue({
        successful: newStudents,
        failed: [],
        totalProcessed: 2,
      } as any);
      teacherRepository.save.mockResolvedValue(mockTeacher as Teacher);

      await service.registerStudentsToTeacher(
        'teacher@test.com',
        studentEmails,
      );

      expect(teacherRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          students: expect.arrayContaining([
            expect.objectContaining({ email: 'existing@test.com' }),
            expect.objectContaining({ email: 'new1@test.com' }),
            expect.objectContaining({ email: 'new2@test.com' }),
          ]),
        }),
      );
    });

    it('should throw NotFoundException if teacher does not exist', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      await expect(
        service.registerStudentsToTeacher('notfound@test.com', [
          'student@test.com',
        ]),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.registerStudentsToTeacher('notfound@test.com', [
          'student@test.com',
        ]),
      ).rejects.toThrow(ERROR_MESSAGES.TEACHER_NOT_FOUND);
    });

    it('should throw BadRequestException for empty student list', async () => {
      await expect(
        service.registerStudentsToTeacher('teacher@test.com', []),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.registerStudentsToTeacher('teacher@test.com', []),
      ).rejects.toThrow(ERROR_MESSAGES.EMPTY_STUDENT_LIST);
    });

    it('should handle duplicate students gracefully', async () => {
      const studentEmails = ['existing@test.com', 'new@test.com'];
      const students = [
        { id: 1, email: 'existing@test.com', suspended: false },
        { id: 2, email: 'new@test.com', suspended: false },
      ];

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      studentService.bulkCreateStudents.mockResolvedValue({
        successful: students,
        failed: [],
        totalProcessed: 2,
      } as any);

      await service.registerStudentsToTeacher(
        'teacher@test.com',
        studentEmails,
      );

      // Should only add the new student
      expect(teacherRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          students: expect.arrayContaining([
            expect.objectContaining({ email: 'existing@test.com' }),
            expect.objectContaining({ email: 'new@test.com' }),
          ]),
        }),
      );
    });

    it('should handle invalid student emails', async () => {
      await expect(
        service.registerStudentsToTeacher('teacher@test.com', [
          'invalid-email',
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should normalize duplicate input emails', async () => {
      const studentEmails = [
        'Student@Test.com',
        'student@test.com',
        'STUDENT@TEST.COM',
      ];

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      studentService.bulkCreateStudents.mockResolvedValue({
        successful: [{ id: 2, email: 'student@test.com', suspended: false }],
        failed: [],
        totalProcessed: 1,
      } as any);

      await service.registerStudentsToTeacher(
        'teacher@test.com',
        studentEmails,
      );

      expect(studentService.bulkCreateStudents).toHaveBeenCalledWith([
        'student@test.com',
      ]);
    });
  });

  describe('getTeacherStudents', () => {
    it('should return sorted student emails for existing teacher', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [
          { id: 1, email: 'student2@test.com', suspended: false },
          { id: 2, email: 'student1@test.com', suspended: false },
          { id: 3, email: 'suspended@test.com', suspended: true },
        ],
      };
      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.getTeacherStudents('teacher@test.com');

      expect(result).toEqual(['student1@test.com', 'student2@test.com']);
      expect(result).toEqual(
        expect.arrayContaining(['student1@test.com', 'student2@test.com']),
      );
      expect(result).not.toContain('suspended@test.com');
    });

    it('should throw NotFoundException if teacher does not exist', async () => {
      teacherRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTeacherStudents('notfound@test.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCommonStudents', () => {
    it('should return common students for multiple teachers', async () => {
      const teachers = [
        {
          id: 1,
          email: 'teacher1@test.com',
          students: [
            { id: 1, email: 'common1@test.com', suspended: false },
            { id: 2, email: 'common2@test.com', suspended: false },
            { id: 3, email: 'unique1@test.com', suspended: false },
          ],
        },
        {
          id: 2,
          email: 'teacher2@test.com',
          students: [
            { id: 1, email: 'common1@test.com', suspended: false },
            { id: 2, email: 'common2@test.com', suspended: false },
            { id: 4, email: 'unique2@test.com', suspended: false },
          ],
        },
      ];

      teacherRepository.find.mockResolvedValue(teachers as Teacher[]);

      const result = await service.getCommonStudents([
        'teacher1@test.com',
        'teacher2@test.com',
      ]);

      expect(result).toEqual(['common1@test.com', 'common2@test.com']);
      expect(result).toHaveLength(2);
    });

    it('should handle single teacher', async () => {
      const teacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [
          { id: 1, email: 'student1@test.com', suspended: false },
          { id: 2, email: 'student2@test.com', suspended: false },
          { id: 3, email: 'suspended@test.com', suspended: true },
        ],
      };

      teacherRepository.find.mockResolvedValue([teacher] as Teacher[]);

      const result = await service.getCommonStudents(['teacher@test.com']);

      expect(result).toEqual(['student1@test.com', 'student2@test.com']);
      expect(result).not.toContain('suspended@test.com');
    });

    it('should return empty array if not all teachers found', async () => {
      teacherRepository.find.mockResolvedValue([]); // No teachers found

      const result = await service.getCommonStudents([
        'teacher1@test.com',
        'teacher2@test.com',
      ]);

      expect(result).toEqual([]);
    });

    it('should throw BadRequestException for empty teacher list', async () => {
      await expect(service.getCommonStudents([])).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle duplicate teacher emails', async () => {
      const teacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [{ id: 1, email: 'student@test.com', suspended: false }],
      };

      teacherRepository.find.mockResolvedValue([teacher] as Teacher[]);

      const result = await service.getCommonStudents([
        'teacher@test.com',
        'Teacher@Test.com',
        'TEACHER@TEST.COM',
      ]);

      expect(result).toEqual(['student@test.com']);
      expect(teacherRepository.find).toHaveBeenCalledWith({
        where: { email: { $in: ['teacher@test.com'] } },
        relations: ['students'],
      });
    });

    it('should filter out suspended students from common results', async () => {
      const teachers = [
        {
          id: 1,
          email: 'teacher1@test.com',
          students: [
            { id: 1, email: 'common@test.com', suspended: true },
            { id: 2, email: 'active@test.com', suspended: false },
          ],
        },
        {
          id: 2,
          email: 'teacher2@test.com',
          students: [
            { id: 1, email: 'common@test.com', suspended: true },
            { id: 2, email: 'active@test.com', suspended: false },
          ],
        },
      ];

      teacherRepository.find.mockResolvedValue(teachers as Teacher[]);

      const result = await service.getCommonStudents([
        'teacher1@test.com',
        'teacher2@test.com',
      ]);

      expect(result).toEqual(['active@test.com']);
      expect(result).not.toContain('common@test.com');
    });
  });

  describe('getNotificationRecipients', () => {
    it('should return recipients including registered and mentioned students', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [{ id: 1, email: 'registered@test.com', suspended: false }],
      };

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      studentService.getStudentsByEmails.mockResolvedValue([
        { id: 2, email: 'mentioned@test.com', suspended: false },
      ] as any);

      const notification =
        'Hello @mentioned@test.com, please attend the meeting.';

      const result = await service.getNotificationRecipients(
        'teacher@test.com',
        notification,
      );

      expect(result).toEqual(['mentioned@test.com', 'registered@test.com']);
      expect(result).toHaveLength(2);
    });

    it('should handle teacher not found gracefully', async () => {
      teacherRepository.findOne.mockResolvedValue(null);
      studentService.getStudentsByEmails.mockResolvedValue([]);

      const result = await service.getNotificationRecipients(
        'notfound@test.com',
        'Hello everyone!',
      );

      expect(result).toEqual([]);
    });

    it('should extract and handle multiple mentions', async () => {
      teacherRepository.findOne.mockResolvedValue(null); // No teacher
      studentService.getStudentsByEmails.mockResolvedValue([
        { id: 1, email: 'student1@test.com', suspended: false },
        { id: 2, email: 'student2@test.com', suspended: false },
      ] as any);

      const notification = 'Hello @student1@test.com and @student2@test.com!';

      const result = await service.getNotificationRecipients(
        'teacher@test.com',
        notification,
      );

      expect(result).toEqual(['student1@test.com', 'student2@test.com']);
      expect(studentService.getStudentsByEmails).toHaveBeenCalledWith(
        ['student1@test.com', 'student2@test.com'],
        false,
      );
    });

    it('should deduplicate recipients', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [{ id: 1, email: 'student@test.com', suspended: false }],
      };

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);
      studentService.getStudentsByEmails.mockResolvedValue([
        { id: 1, email: 'student@test.com', suspended: false },
      ] as any);

      const notification = 'Hello @student@test.com!';

      const result = await service.getNotificationRecipients(
        'teacher@test.com',
        notification,
      );

      expect(result).toEqual(['student@test.com']);
      expect(result).toHaveLength(1);
    });

    it('should handle notification without mentions', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@test.com',
        students: [{ id: 1, email: 'registered@test.com', suspended: false }],
      };

      teacherRepository.findOne.mockResolvedValue(mockTeacher as Teacher);

      const result = await service.getNotificationRecipients(
        'teacher@test.com',
        'Hello everyone!',
      );

      expect(result).toEqual(['registered@test.com']);
      expect(studentService.getStudentsByEmails).not.toHaveBeenCalled();
    });
  });

  describe('suspendStudent', () => {
    it('should delegate to StudentService', async () => {
      studentService.suspendStudent.mockResolvedValue(undefined);

      await service.suspendStudent('student@test.com');

      expect(studentService.suspendStudent).toHaveBeenCalledWith(
        'student@test.com',
      );
    });
  });

  describe('getAllTeachers', () => {
    beforeEach(() => {
      mockTeacherRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
    });

    it('should get all teachers with pagination', async () => {
      const mockTeachers = [
        { id: 1, email: 'teacher1@test.com', students: [] },
        { id: 2, email: 'teacher2@test.com', students: [] },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockTeachers);

      const result = await service.getAllTeachers(10, 0);

      expect(result).toEqual(mockTeachers);
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });

    it('should get all teachers without pagination', async () => {
      const mockTeachers = [{ id: 1, email: 'teacher@test.com', students: [] }];
      mockQueryBuilder.getMany.mockResolvedValue(mockTeachers);

      await service.getAllTeachers();

      expect(mockQueryBuilder.limit).not.toHaveBeenCalled();
      expect(mockQueryBuilder.offset).not.toHaveBeenCalled();
    });
  });

  describe('countTeachers', () => {
    it('should return teacher count', async () => {
      teacherRepository.count.mockResolvedValue(5);

      const result = await service.countTeachers();

      expect(result).toBe(5);
      expect(teacherRepository.count).toHaveBeenCalled();
    });
  });
});
