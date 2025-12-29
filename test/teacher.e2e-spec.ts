import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module';
import { Teacher } from '../src/entities/teacher.entity';
import { Student } from '../src/entities/student.entity';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';

describe('Teacher API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: 'root',
          database: 'test_class',
          entities: [Teacher, Student],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    app.useGlobalFilters(new GlobalExceptionFilter());
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /register', () => {
    it('should register students to a teacher successfully', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentjon@gmail.com', 'studenthon@gmail.com'],
        })
        .expect(204);
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'invalid-email',
          students: ['studentjon@gmail.com'],
        })
        .expect(400);
    });
  });

  describe('GET /commonstudents', () => {
    it('should return common students for multiple teachers', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['commonstudent1@gmail.com', 'commonstudent2@gmail.com'],
        });

      await request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'teacherjoe@gmail.com',
          students: ['commonstudent1@gmail.com', 'commonstudent2@gmail.com'],
        });

      return request(app.getHttpServer())
        .get('/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com')
        .expect(200)
        .expect((res) => {
          expect(res.body.students).toEqual(
            expect.arrayContaining(['commonstudent1@gmail.com', 'commonstudent2@gmail.com'])
          );
        });
    });
  });

  describe('POST /suspend', () => {
    it('should suspend a student successfully', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentmary@gmail.com'],
        });

      return request(app.getHttpServer())
        .post('/suspend')
        .send({
          student: 'studentmary@gmail.com',
        })
        .expect(204);
    });
  });

  describe('POST /retrievefornotifications', () => {
    it('should return recipients including mentioned students', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send({
          teacher: 'teacherken@gmail.com',
          students: ['studentbob@gmail.com'],
        });

      return request(app.getHttpServer())
        .post('/retrievefornotifications')
        .send({
          teacher: 'teacherken@gmail.com',
          notification: 'Hello students! @studentagnes@gmail.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.recipients).toEqual(
            expect.arrayContaining(['studentbob@gmail.com', 'studentagnes@gmail.com'])
          );
        });
    });
  });
});
