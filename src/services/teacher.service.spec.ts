import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherService } from '../services/teacher.service';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';
import { NotFoundException } from '@nestjs/common';

describe('TeacherService', () => {
  let service: TeacherService;
  let teacherRepository: Repository<Teacher>;
  let studentRepository: Repository<Student>;

  const mockTeacherRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockStudentRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
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
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);
    teacherRepository = module.get<Repository<Teacher>>(getRepositoryToken(Teacher));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerStudents', () => {
    it('should register students to an existing teacher', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@example.com',
        students: [],
      };
      const mockStudent = {
        id: 1,
        email: 'student@example.com',
        suspended: false,
      };

      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentRepository.findOne.mockResolvedValue(null);
      mockStudentRepository.create.mockReturnValue(mockStudent);
      mockStudentRepository.save.mockResolvedValue(mockStudent);
      mockTeacherRepository.save.mockResolvedValue(mockTeacher);

      await service.registerStudents('teacher@example.com', ['student@example.com']);

      expect(mockTeacherRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'teacher@example.com' },
        relations: ['students'],
      });
      expect(mockStudentRepository.create).toHaveBeenCalledWith({
        email: 'student@example.com',
      });
      expect(mockTeacherRepository.save).toHaveBeenCalled();
    });

    it('should create a new teacher if not exists', async () => {
      const mockTeacher = {
        id: 1,
        email: 'newteacher@example.com',
        students: [],
      };
      const mockStudent = {
        id: 1,
        email: 'student@example.com',
        suspended: false,
      };

      mockTeacherRepository.findOne.mockResolvedValue(null);
      mockTeacherRepository.create.mockReturnValue(mockTeacher);
      mockTeacherRepository.save.mockResolvedValue(mockTeacher);
      mockStudentRepository.findOne.mockResolvedValue(null);
      mockStudentRepository.create.mockReturnValue(mockStudent);
      mockStudentRepository.save.mockResolvedValue(mockStudent);

      await service.registerStudents('newteacher@example.com', ['student@example.com']);

      expect(mockTeacherRepository.create).toHaveBeenCalledWith({
        email: 'newteacher@example.com',
      });
      expect(mockTeacherRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCommonStudents', () => {
    it('should return common students for multiple teachers', async () => {
      const mockTeachers = [
        {
          id: 1,
          email: 'teacher1@example.com',
          students: [
            { email: 'common@example.com', suspended: false },
            { email: 'unique1@example.com', suspended: false },
          ],
        },
        {
          id: 2,
          email: 'teacher2@example.com',
          students: [
            { email: 'common@example.com', suspended: false },
            { email: 'unique2@example.com', suspended: false },
          ],
        },
      ];

      mockTeacherRepository.find.mockResolvedValue(mockTeachers);

      const result = await service.getCommonStudents([
        'teacher1@example.com',
        'teacher2@example.com',
      ]);

      expect(result).toEqual(['common@example.com']);
      expect(mockTeacherRepository.find).toHaveBeenCalledWith({
        where: { email: expect.any(Object) },
        relations: ['students'],
      });
    });

    it('should return empty array if teachers not found', async () => {
      mockTeacherRepository.find.mockResolvedValue([]);

      const result = await service.getCommonStudents(['nonexistent@example.com']);

      expect(result).toEqual([]);
    });
  });

  describe('suspendStudent', () => {
    it('should suspend an existing student', async () => {
      const mockStudent = {
        id: 1,
        email: 'student@example.com',
        suspended: false,
      };

      mockStudentRepository.findOne.mockResolvedValue(mockStudent);
      mockStudentRepository.save.mockResolvedValue({ ...mockStudent, suspended: true });

      await service.suspendStudent('student@example.com');

      expect(mockStudentRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'student@example.com' },
      });
      expect(mockStudent.suspended).toBe(true);
      expect(mockStudentRepository.save).toHaveBeenCalledWith(mockStudent);
    });

    it('should throw NotFoundException if student not found', async () => {
      mockStudentRepository.findOne.mockResolvedValue(null);

      await expect(service.suspendStudent('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getNotificationRecipients', () => {
    it('should return recipients including mentioned students', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@example.com',
        students: [
          { email: 'registered@example.com', suspended: false },
        ],
      };
      const mockMentionedStudent = {
        email: 'mentioned@example.com',
        suspended: false,
      };

      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);
      mockStudentRepository.find.mockResolvedValue([mockMentionedStudent]);
      mockStudentRepository.save.mockResolvedValue([]);

      const result = await service.getNotificationRecipients(
        'teacher@example.com',
        'Hello @mentioned@example.com',
      );

      expect(result).toContain('registered@example.com');
      expect(result).toContain('mentioned@example.com');
    });

    it('should handle notification without mentions', async () => {
      const mockTeacher = {
        id: 1,
        email: 'teacher@example.com',
        students: [
          { email: 'registered@example.com', suspended: false },
        ],
      };

      mockTeacherRepository.findOne.mockResolvedValue(mockTeacher);

      const result = await service.getNotificationRecipients(
        'teacher@example.com',
        'Hello everyone!',
      );

      expect(result).toEqual(['registered@example.com']);
    });
  });
});
