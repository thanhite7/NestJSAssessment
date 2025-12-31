/**
 * Application constants for error messages, validation rules, and other shared values
 */

export const ERROR_MESSAGES = {
  STUDENT_NOT_FOUND: 'Student not found',
  TEACHER_NOT_FOUND: 'Teacher not found',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  EMPTY_TEACHER_LIST: 'Teacher list cannot be empty',
  EMPTY_STUDENT_LIST: 'Student list cannot be empty',
  DUPLICATE_REGISTRATION: 'Student is already registered',
  ALREADY_SUSPENDED: 'Student is already suspended',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
} as const;

export const SUCCESS_MESSAGES = {
  STUDENTS_REGISTERED: 'Students successfully registered',
  STUDENT_SUSPENDED: 'Student successfully suspended',
  NOTIFICATION_SENT: 'Notification recipients retrieved successfully',
} as const;

export const HTTP_STATUS_MESSAGES = {
  NO_CONTENT: 'Operation completed successfully',
  OK: 'Request processed successfully',
  BAD_REQUEST: 'Invalid request parameters',
  NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MENTION_REGEX: /@([^\s@]+@[^\s@]+\.[^\s@]+)/g,
  MIN_TEACHER_COUNT: 1,
  MIN_STUDENT_COUNT: 1,
  MAX_BATCH_SIZE: 100,
} as const;

export const API_CONFIG = {
  PREFIX: 'api',
  VERSION: 'v1',
  DEFAULT_PORT: 3000,
} as const;
