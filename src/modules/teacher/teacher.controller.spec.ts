/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { RegisterStudentsDto } from './dto/register-students.dto';
import { CommonStudentsDto } from './dto/common-students.dto';
import { SuspendStudentDto } from './dto/suspend-student.dto';
import { NotificationDto } from './dto/notification.dto';

/**
 * Comprehensive unit tests for TeacherController
 * Tests all endpoints with various scenarios and edge cases
 */
describe('TeacherController', () => {
  let controller: TeacherController;
  let teacherService: TeacherService;

  const mockTeacherService = {
    registerStudentsToTeacher: jest.fn(),
    getCommonStudents: jest.fn(),
    suspendStudent: jest.fn(),
    getNotificationRecipients: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherController],
      providers: [
        {
          provide: TeacherService,
          useValue: mockTeacherService,
        },
      ],
    }).compile();

    controller = module.get<TeacherController>(TeacherController);
    teacherService = module.get<TeacherService>(TeacherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerStudents', () => {
    it('should register students successfully', async () => {
      const registerDto: RegisterStudentsDto = {
        teacher: 'teacher@example.com',
        students: ['student1@example.com', 'student2@example.com'],
      };

      mockTeacherService.registerStudentsToTeacher.mockResolvedValue(undefined);

      const result = await controller.registerStudents(registerDto);

      expect(result).toBeUndefined();
      expect(teacherService.registerStudentsToTeacher).toHaveBeenCalledWith(
        'teacher@example.com',
        ['student1@example.com', 'student2@example.com'],
      );
    });

    it('should handle empty student list', async () => {
      const registerDto: RegisterStudentsDto = {
        teacher: 'teacher@example.com',
        students: [],
      };

      mockTeacherService.registerStudentsToTeacher.mockResolvedValue(undefined);

      await controller.registerStudents(registerDto);

      expect(teacherService.registerStudentsToTeacher).toHaveBeenCalledWith(
        'teacher@example.com',
        [],
      );
    });

    it('should handle single student registration', async () => {
      const registerDto: RegisterStudentsDto = {
        teacher: 'teacher@example.com',
        students: ['student@example.com'],
      };

      mockTeacherService.registerStudentsToTeacher.mockResolvedValue(undefined);

      await controller.registerStudents(registerDto);

      expect(teacherService.registerStudentsToTeacher).toHaveBeenCalledWith(
        'teacher@example.com',
        ['student@example.com'],
      );
    });
  });

  describe('getCommonStudents', () => {
    it('should get common students for single teacher', async () => {
      const commonStudentsDto: CommonStudentsDto = {
        teacher: ['teacher@example.com'],
      };

      const expectedStudents = ['student1@example.com', 'student2@example.com'];
      mockTeacherService.getCommonStudents.mockResolvedValue(expectedStudents);

      const result = await controller.getCommonStudents(commonStudentsDto);

      expect(result).toEqual({ students: expectedStudents });
      expect(teacherService.getCommonStudents).toHaveBeenCalledWith([
        'teacher@example.com',
      ]);
    });

    it('should get common students for multiple teachers', async () => {
      const commonStudentsDto: CommonStudentsDto = {
        teacher: ['teacher1@example.com', 'teacher2@example.com'],
      };

      const expectedStudents = ['common@example.com'];
      mockTeacherService.getCommonStudents.mockResolvedValue(expectedStudents);

      const result = await controller.getCommonStudents(commonStudentsDto);

      expect(result).toEqual({ students: expectedStudents });
      expect(teacherService.getCommonStudents).toHaveBeenCalledWith([
        'teacher1@example.com',
        'teacher2@example.com',
      ]);
    });

    it('should handle empty common students result', async () => {
      const commonStudentsDto: CommonStudentsDto = {
        teacher: ['teacher1@example.com', 'teacher2@example.com'],
      };

      mockTeacherService.getCommonStudents.mockResolvedValue([]);

      const result = await controller.getCommonStudents(commonStudentsDto);

      expect(result).toEqual({ students: [] });
    });

    it('should handle single teacher in array format', async () => {
      const commonStudentsDto: CommonStudentsDto = {
        teacher: ['single-teacher@example.com'],
      };

      mockTeacherService.getCommonStudents.mockResolvedValue([
        'student@example.com',
      ]);

      const result = await controller.getCommonStudents(commonStudentsDto);

      expect(result).toEqual({ students: ['student@example.com'] });
      expect(teacherService.getCommonStudents).toHaveBeenCalledWith([
        'single-teacher@example.com',
      ]);
    });
  });

  describe('suspendStudent', () => {
    it('should suspend student successfully', async () => {
      const suspendDto: SuspendStudentDto = {
        student: 'student@example.com',
      };

      mockTeacherService.suspendStudent.mockResolvedValue(undefined);

      const result = await controller.suspendStudent(suspendDto);

      expect(result).toBeUndefined();
      expect(teacherService.suspendStudent).toHaveBeenCalledWith(
        'student@example.com',
      );
    });

    it('should handle suspension of non-existent student', async () => {
      const suspendDto: SuspendStudentDto = {
        student: 'nonexistent@example.com',
      };

      mockTeacherService.suspendStudent.mockRejectedValue(
        new Error('Student not found'),
      );

      await expect(controller.suspendStudent(suspendDto)).rejects.toThrow(
        'Student not found',
      );
    });
  });

  describe('getNotificationRecipients', () => {
    it('should get notification recipients with registered students only', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification: 'Hello everyone!',
      };

      const expectedRecipients = [
        'student1@example.com',
        'student2@example.com',
      ];
      mockTeacherService.getNotificationRecipients.mockResolvedValue(
        expectedRecipients,
      );

      const result =
        await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: expectedRecipients });
      expect(teacherService.getNotificationRecipients).toHaveBeenCalledWith(
        'teacher@example.com',
        'Hello everyone!',
      );
    });

    it('should get notification recipients with mentions', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification: 'Hello @mentioned@example.com!',
      };

      const expectedRecipients = [
        'registered@example.com',
        'mentioned@example.com',
      ];
      mockTeacherService.getNotificationRecipients.mockResolvedValue(
        expectedRecipients,
      );

      const result =
        await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: expectedRecipients });
      expect(teacherService.getNotificationRecipients).toHaveBeenCalledWith(
        'teacher@example.com',
        'Hello @mentioned@example.com!',
      );
    });

    it('should handle empty recipients list', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification: 'No recipients',
      };

      mockTeacherService.getNotificationRecipients.mockResolvedValue([]);

      const result =
        await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: [] });
    });

    it('should handle notification with multiple mentions', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification:
          'Please submit @student1@example.com and @student2@example.com your assignments.',
      };

      const expectedRecipients = [
        'student1@example.com',
        'student2@example.com',
      ];
      mockTeacherService.getNotificationRecipients.mockResolvedValue(
        expectedRecipients,
      );

      const result =
        await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: expectedRecipients });
    });

    it('should handle notification with special characters and mentions', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification:
          'Hello class! @student1@example.com, please review your work. Thanks!',
      };

      const expectedRecipients = [
        'registered@example.com',
        'student1@example.com',
      ];
      mockTeacherService.getNotificationRecipients.mockResolvedValue(
        expectedRecipients,
      );

      const result =
        await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: expectedRecipients });
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors in registerStudents', async () => {
      const registerDto: RegisterStudentsDto = {
        teacher: 'teacher@example.com',
        students: ['invalid-student'],
      };

      mockTeacherService.registerStudentsToTeacher.mockRejectedValue(
        new Error('Invalid email format'),
      );

      await expect(controller.registerStudents(registerDto)).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should propagate service errors in getCommonStudents', async () => {
      const commonStudentsDto: CommonStudentsDto = {
        teacher: ['invalid-teacher'],
      };

      mockTeacherService.getCommonStudents.mockRejectedValue(
        new Error('Invalid teacher email'),
      );

      await expect(
        controller.getCommonStudents(commonStudentsDto),
      ).rejects.toThrow('Invalid teacher email');
    });

    it('should propagate service errors in getNotificationRecipients', async () => {
      const notificationDto: NotificationDto = {
        teacher: 'teacher@example.com',
        notification: '',
      };

      mockTeacherService.getNotificationRecipients.mockRejectedValue(
        new Error('Empty notification'),
      );

      await expect(
        controller.getNotificationRecipients(notificationDto),
      ).rejects.toThrow('Empty notification');
    });
  });
});
