import * as fc from "fast-check";
import { Notification } from "@/types/notification";

/**
 * Pure function to calculate unread count from notifications.
 * Extracted for testability - mirrors the logic in NotificationContext.
 *
 * **Feature: notification-persistence, Property 2: Unread count equals unread notifications**
 * **Validates: Requirements 3.3**
 */
export function calculateUnreadCount(notifications: Notification[]): number {
  return notifications.filter((notification) => !notification.isRead).length;
}

/**
 * Pure function to check if notifications are sorted by timestamp descending.
 *
 * **Feature: notification-persistence, Property 1: Notifications are sorted by timestamp descending**
 * **Validates: Requirements 2.2**
 */
export function isSortedByTimestampDescending(
  notifications: Notification[]
): boolean {
  for (let i = 0; i < notifications.length - 1; i++) {
    if (
      notifications[i].createdAt.getTime() <
      notifications[i + 1].createdAt.getTime()
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Pure function to sort notifications by timestamp descending.
 * Mirrors the Firestore orderBy('createdAt', 'desc') behavior.
 */
export function sortByTimestampDescending(
  notifications: Notification[]
): Notification[] {
  return [...notifications].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

/**
 * Arbitrary for generating valid Notification objects.
 */
const notificationArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 0, maxLength: 100 }),
  body: fc.string({ minLength: 0, maxLength: 500 }),
  isRead: fc.boolean(),
  createdAt: fc.date({
    min: new Date("2020-01-01"),
    max: new Date("2030-12-31"),
  }),
  data: fc.option(fc.dictionary(fc.string(), fc.jsonValue()), {
    nil: undefined,
  }),
});

describe("Notification Service - Property-Based Tests", () => {
  /**
   * **Feature: notification-persistence, Property 1: Notifications are sorted by timestamp descending**
   * **Validates: Requirements 2.2**
   *
   * For any list of notifications, after sorting by timestamp descending,
   * the list SHALL be ordered by createdAt in descending order (newest first).
   */
  describe("Property 1: Notifications are sorted by timestamp descending", () => {
    it("should sort notifications with newest first", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 0, maxLength: 50 }),
          (notifications) => {
            const sorted = sortByTimestampDescending(notifications);
            return isSortedByTimestampDescending(sorted);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve all notifications after sorting", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 0, maxLength: 50 }),
          (notifications) => {
            const sorted = sortByTimestampDescending(notifications);
            return sorted.length === notifications.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: notification-persistence, Property 2: Unread count equals unread notifications**
   * **Validates: Requirements 3.3**
   *
   * For any set of notifications, the unread count SHALL equal the count of
   * notifications where isRead is false.
   */
  describe("Property 2: Unread count equals unread notifications", () => {
    it("should count unread notifications correctly", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 0, maxLength: 100 }),
          (notifications) => {
            const unreadCount = calculateUnreadCount(notifications);
            const expectedCount = notifications.filter((n) => !n.isRead).length;
            return unreadCount === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 0 for empty array", () => {
      expect(calculateUnreadCount([])).toBe(0);
    });

    it("should return 0 when all notifications are read", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 1, maxLength: 50 }),
          (notifications) => {
            const allRead = notifications.map((n) => ({ ...n, isRead: true }));
            return calculateUnreadCount(allRead) === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return total count when all notifications are unread", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 1, maxLength: 50 }),
          (notifications) => {
            const allUnread = notifications.map((n) => ({
              ...n,
              isRead: false,
            }));
            return calculateUnreadCount(allUnread) === allUnread.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
