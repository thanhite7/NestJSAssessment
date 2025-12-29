import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async registerStudents(
    teacherEmail: string,
    studentEmails: string[],
  ): Promise<void> {
    let teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    if (!teacher) {
      teacher = this.teacherRepository.create({ email: teacherEmail });
      await this.teacherRepository.save(teacher);
      teacher.students = [];
    }

    const students = await Promise.all(
      studentEmails.map(async (email) => {
        let student = await this.studentRepository.findOne({
          where: { email },
        });

        if (!student) {
          student = this.studentRepository.create({ email });
          await this.studentRepository.save(student);
        }

        return student;
      }),
    );

    const existingStudentIds = teacher.students.map((s) => s.id);
    const newStudents = students.filter(
      (student) => !existingStudentIds.includes(student.id),
    );

    if (newStudents.length > 0) {
      teacher.students = [...teacher.students, ...newStudents];
      await this.teacherRepository.save(teacher);
    }
  }

  async getCommonStudents(teacherEmails: string[]): Promise<string[]> {
    if (teacherEmails.length === 0) {
      return [];
    }

    const teachers = await this.teacherRepository.find({
      where: { email: In(teacherEmails) },
      relations: ['students'],
    });

    if (teachers.length !== teacherEmails.length) {
      return [];
    }

    if (teachers.length === 1) {
      return teachers[0].students
        .filter((student) => !student.suspended)
        .map((student) => student.email)
        .sort();
    }

    let commonStudents = teachers[0].students
      .filter((student) => !student.suspended)
      .map((student) => student.email);

    for (let i = 1; i < teachers.length; i++) {
      const currentTeacherStudents = teachers[i].students
        .filter((student) => !student.suspended)
        .map((student) => student.email);
      commonStudents = commonStudents.filter((email) =>
        currentTeacherStudents.includes(email),
      );
    }

    return commonStudents.sort();
  }

  async suspendStudent(studentEmail: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { email: studentEmail },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    student.suspended = true;
    await this.studentRepository.save(student);
  }

  async getNotificationRecipients(
    teacherEmail: string,
    notification: string,
  ): Promise<string[]> {
    const mentionPattern = /@([^\s@]+@[^\s@]+\.[^\s@]+)/g;
    const mentionedEmails: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = mentionPattern.exec(notification)) !== null) {
      mentionedEmails.push(match[1]);
    }

    const teacher = await this.teacherRepository.findOne({
      where: { email: teacherEmail },
      relations: ['students'],
    });

    const registeredStudents = teacher
      ? teacher.students
          .filter((student) => !student.suspended)
          .map((student) => student.email)
      : [];

    const mentionedStudents: string[] = [];
    if (mentionedEmails.length > 0) {
      const existingMentionedStudents = await this.studentRepository.find({
        where: {
          email: In(mentionedEmails),
          suspended: false,
        },
      });

      mentionedStudents.push(
        ...existingMentionedStudents.map((student) => student.email),
      );

      const existingEmails = existingMentionedStudents.map(
        (student) => student.email,
      );
      const newMentionedEmails = mentionedEmails.filter(
        (email) => !existingEmails.includes(email),
      );

      if (newMentionedEmails.length > 0) {
        const newStudents = newMentionedEmails.map((email) =>
          this.studentRepository.create({ email, suspended: false }),
        );
        await this.studentRepository.save(newStudents);
        mentionedStudents.push(...newMentionedEmails);
      }
    }

    const allRecipients = [
      ...new Set([...registeredStudents, ...mentionedStudents]),
    ];

    return allRecipients.sort();
  }
}
