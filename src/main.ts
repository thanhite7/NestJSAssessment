// Crypto polyfill for Docker environments - must be at the very top
import { randomUUID } from 'crypto';

// Enhanced crypto polyfill with fallback
if (!globalThis.crypto) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (globalThis as any).crypto = { randomUUID };
  } catch (error) {
    console.warn('Primary crypto polyfill failed, using fallback:', error);
    // Fallback implementation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (globalThis as any).crypto = {
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      },
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { API_CONFIG } from './shared/constants/app.constants';

/**
 * Bootstrap function to initialize and configure the NestJS application
 * Sets up global pipes, filters, CORS, API versioning, and starts the server
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Set global API prefix with version
  app.setGlobalPrefix(`${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}`);

  // Remove versioning configuration since we handle it in global prefix

  // Global validation pipe with comprehensive options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Setup Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Student-Teacher Management API')
      .setDescription(
        'API for managing student-teacher relationships and notifications',
      )
      .setVersion('1.0')
      .addTag('teacher', 'Teacher related operations')
      .addTag('health', 'Health check operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(
      `${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}/docs`,
      app,
      document,
      {
        customSiteTitle: 'Student-Teacher Management API Documentation',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      },
    );
  }

  // Enable CORS with security considerations
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT || API_CONFIG.DEFAULT_PORT;
  await app.listen(port, '0.0.0.0');

  console.log(
    `🚀 Application is running on: http://localhost:${port}/${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}`,
  );
  console.log(
    `🏥 Health check available at: http://localhost:${port}/${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}/health`,
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `📖 Swagger documentation available at: http://localhost:${port}/${API_CONFIG.PREFIX}/${API_CONFIG.VERSION}/docs`,
    );
  }
}

void bootstrap();
