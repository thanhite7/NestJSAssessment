import { VALIDATION_RULES } from '../../../shared/constants/app.constants';

/**
 * Email utility functions for validation and extraction
 */
export class EmailUtils {
  /**
   * Validates email format using regex pattern
   * @param email - Email to validate
   * @returns boolean indicating if email is valid
   */
  static isValidEmail(email: string): boolean {
    return VALIDATION_RULES.EMAIL_REGEX.test(email);
  }

  /**
   * Removes duplicate emails from array while preserving order
   * @param emails - Array of emails that may contain duplicates
   * @returns Array of unique emails
   */
  static removeDuplicateEmails(emails: string[]): string[] {
    return [...new Set(emails)];
  }

  /**
   * Filters and validates emails, removing invalid ones
   * @param emails - Array of emails to filter
   * @returns Array of valid unique emails
   */
  static filterValidEmails(emails: string[]): string[] {
    const uniqueEmails = this.removeDuplicateEmails(emails);
    return uniqueEmails.filter((email) => this.isValidEmail(email));
  }

  /**
   * Extracts mentioned email addresses from notification text
   * Handles duplicates and validates email format
   * @param notification - Notification text containing mentions
   * @returns Array of valid unique mentioned email addresses
   */
  static extractMentionedEmails(notification: string): string[] {
    if (!notification || typeof notification !== 'string') {
      return [];
    }

    const mentionedEmails: string[] = [];
    const matches = notification.matchAll(VALIDATION_RULES.MENTION_REGEX);

    for (const match of matches) {
      if (match[1] && this.isValidEmail(match[1])) {
        mentionedEmails.push(match[1]);
      }
    }

    return this.removeDuplicateEmails(mentionedEmails);
  }

  /**
   * Normalizes email by trimming and converting to lowercase
   * @param email - Email to normalize
   * @returns Normalized email
   */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Batch normalizes multiple emails
   * @param emails - Array of emails to normalize
   * @returns Array of normalized unique emails
   */
  static normalizeEmails(emails: string[]): string[] {
    return this.removeDuplicateEmails(
      emails.map((email) => this.normalizeEmail(email)),
    );
  }
}
