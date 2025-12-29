import { Test, TestingModule } from '@nestjs/testing';
import { TeacherController } from '../controllers/teacher.controller';
import { TeacherService } from '../services/teacher.service';

describe('TeacherController', () => {
  let controller: TeacherController;
  let teacherService: TeacherService;

  const mockTeacherService = {
    registerStudents: jest.fn(),
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
      const registerDto = {
        teacher: 'teacher@example.com',
        students: ['student1@example.com', 'student2@example.com'],
      };

      mockTeacherService.registerStudents.mockResolvedValue(undefined);

      await controller.registerStudents(registerDto);

      expect(mockTeacherService.registerStudents).toHaveBeenCalledWith(
        'teacher@example.com',
        ['student1@example.com', 'student2@example.com'],
      );
    });
  });

  describe('getCommonStudents', () => {
    it('should return common students', async () => {
      const query = {
        teacher: ['teacher1@example.com', 'teacher2@example.com'],
      };
      const expectedStudents = ['common@example.com'];

      mockTeacherService.getCommonStudents.mockResolvedValue(expectedStudents);

      const result = await controller.getCommonStudents(query);

      expect(result).toEqual({ students: expectedStudents });
      expect(mockTeacherService.getCommonStudents).toHaveBeenCalledWith([
        'teacher1@example.com',
        'teacher2@example.com',
      ]);
    });
  });

  describe('suspendStudent', () => {
    it('should suspend student successfully', async () => {
      const suspendDto = {
        student: 'student@example.com',
      };

      mockTeacherService.suspendStudent.mockResolvedValue(undefined);

      await controller.suspendStudent(suspendDto);

      expect(mockTeacherService.suspendStudent).toHaveBeenCalledWith('student@example.com');
    });
  });

  describe('getNotificationRecipients', () => {
    it('should return notification recipients', async () => {
      const notificationDto = {
        teacher: 'teacher@example.com',
        notification: 'Hello @student@example.com',
      };
      const expectedRecipients = ['student@example.com'];

      mockTeacherService.getNotificationRecipients.mockResolvedValue(expectedRecipients);

      const result = await controller.getNotificationRecipients(notificationDto);

      expect(result).toEqual({ recipients: expectedRecipients });
      expect(mockTeacherService.getNotificationRecipients).toHaveBeenCalledWith(
        'teacher@example.com',
        'Hello @student@example.com',
      );
    });
  });
});
