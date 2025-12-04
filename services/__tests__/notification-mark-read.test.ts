import * as fc from "fast-check";
import { Notification } from "@/types/notification";

/**
 * Pure function to simulate marking a notification as read.
 * This mirrors the expected behavior of markAsRead in the service.
 *
 * **Feature: notification-persistence, Property 3: Mark as read updates status**
 * **Validates: Requirements 4.1**
 */
export function markNotificationAsRead(
  notifications: Notification[],
  notificationId: string
): Notification[] {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification
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

describe("Notification Mark as Read - Property-Based Tests", () => {
  /**
   * **Feature: notification-persistence, Property 3: Mark as read updates status**
   * **Validates: Requirements 4.1**
   *
   * For any notification, after calling markAsRead, the notification's isRead field
   * SHALL be true.
   */
  describe("Property 3: Mark as read updates status", () => {
    it("should set isRead to true for the specified notification", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 1, maxLength: 50 }),
          fc.nat(),
          (notifications, indexSeed) => {
            // Pick a random notification from the array
            const index = indexSeed % notifications.length;
            const targetId = notifications[index].id;

            const updated = markNotificationAsRead(notifications, targetId);
            const targetNotification = updated.find((n) => n.id === targetId);

            return (
              targetNotification !== undefined &&
              targetNotification.isRead === true
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not modify other notifications", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 2, maxLength: 50 }),
          fc.nat(),
          (notifications, indexSeed) => {
            const index = indexSeed % notifications.length;
            const targetId = notifications[index].id;

            const updated = markNotificationAsRead(notifications, targetId);

            // Check that all other notifications remain unchanged
            return notifications.every((original, i) => {
              if (original.id === targetId) return true;
              const updatedNotification = updated.find(
                (n) => n.id === original.id
              );
              return (
                updatedNotification !== undefined &&
                updatedNotification.isRead === original.isRead &&
                updatedNotification.title === original.title &&
                updatedNotification.body === original.body
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve array length after marking as read", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 0, maxLength: 50 }),
          fc.uuid(),
          (notifications, targetId) => {
            const updated = markNotificationAsRead(notifications, targetId);
            return updated.length === notifications.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should be idempotent - marking as read twice has same effect", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 1, maxLength: 50 }),
          fc.nat(),
          (notifications, indexSeed) => {
            const index = indexSeed % notifications.length;
            const targetId = notifications[index].id;

            const onceMarked = markNotificationAsRead(notifications, targetId);
            const twiceMarked = markNotificationAsRead(onceMarked, targetId);

            const onceTarget = onceMarked.find((n) => n.id === targetId);
            const twiceTarget = twiceMarked.find((n) => n.id === targetId);

            return (
              onceTarget !== undefined &&
              twiceTarget !== undefined &&
              onceTarget.isRead === twiceTarget.isRead &&
              onceTarget.isRead === true
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle non-existent notification id gracefully", () => {
      fc.assert(
        fc.property(
          fc.array(notificationArbitrary, { minLength: 0, maxLength: 50 }),
          fc.uuid(),
          (notifications, nonExistentId) => {
            // Ensure the id doesn't exist in the array
            const existingIds = new Set(notifications.map((n) => n.id));
            if (existingIds.has(nonExistentId)) return true; // Skip this case

            const updated = markNotificationAsRead(
              notifications,
              nonExistentId
            );

            // All notifications should remain unchanged
            return notifications.every((original, i) => {
              return (
                updated[i].id === original.id &&
                updated[i].isRead === original.isRead &&
                updated[i].title === original.title &&
                updated[i].body === original.body
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
