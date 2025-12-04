import * as fc from "fast-check";
import { Notification } from "@/types/notification";

/**
 * Pure deserialization function that converts raw Firestore-like data to Notification.
 * This mirrors the logic in fromFirestoreDoc but without Firebase dependencies.
 *
 * **Feature: notification-persistence, Property 4: Deserialization produces valid Notification objects**
 * **Validates: Requirements 5.2**
 */
export function deserializeNotification(
  id: string,
  data: Record<string, unknown> | null | undefined
): Notification {
  if (!data) {
    return {
      id,
      title: "",
      body: "",
      isRead: false,
      createdAt: new Date(),
      data: undefined,
    };
  }

  // Handle createdAt - could be Date, string, or missing
  let createdAt: Date;
  if (data.createdAt) {
    if (data.createdAt instanceof Date) {
      createdAt = data.createdAt;
    } else if (typeof data.createdAt === "string") {
      createdAt = new Date(data.createdAt);
    } else if (typeof data.createdAt === "number") {
      createdAt = new Date(data.createdAt);
    } else {
      createdAt = new Date();
    }
  } else {
    createdAt = new Date();
  }

  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    body: typeof data.body === "string" ? data.body : "",
    isRead: typeof data.isRead === "boolean" ? data.isRead : false,
    createdAt,
    data:
      data.data && typeof data.data === "object"
        ? (data.data as Record<string, unknown>)
        : undefined,
  };
}

/**
 * Validates that a Notification object has all required fields with correct types.
 */
function isValidNotification(notification: Notification): boolean {
  return (
    typeof notification.id === "string" &&
    typeof notification.title === "string" &&
    typeof notification.body === "string" &&
    typeof notification.isRead === "boolean" &&
    notification.createdAt instanceof Date &&
    !isNaN(notification.createdAt.getTime()) &&
    (notification.data === undefined || typeof notification.data === "object")
  );
}

/**
 * Arbitrary for generating valid dates using integer timestamps.
 * This avoids issues with fc.date() potentially producing invalid dates.
 */
const validDateArbitrary = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts));

/**
 * Arbitrary for generating valid Firestore-like document data.
 */
const firestoreDataArbitrary = fc.record({
  title: fc.string({ minLength: 0, maxLength: 100 }),
  body: fc.string({ minLength: 0, maxLength: 500 }),
  isRead: fc.boolean(),
  createdAt: fc.oneof(
    validDateArbitrary,
    validDateArbitrary.map((d) => d.toISOString()),
    validDateArbitrary.map((d) => d.getTime())
  ),
  data: fc.option(fc.dictionary(fc.string(), fc.jsonValue()), {
    nil: undefined,
  }),
});

describe("Notification Deserialization - Property-Based Tests", () => {
  /**
   * **Feature: notification-persistence, Property 4: Deserialization produces valid Notification objects**
   * **Validates: Requirements 5.2**
   *
   * For any valid Firestore document with required fields, deserializing SHALL produce
   * a Notification object with all field values correctly mapped.
   */
  describe("Property 4: Deserialization produces valid Notification objects", () => {
    it("should produce valid Notification objects from valid Firestore data", () => {
      fc.assert(
        fc.property(fc.uuid(), firestoreDataArbitrary, (id, data) => {
          const notification = deserializeNotification(id, data);
          return isValidNotification(notification);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve id from document", () => {
      fc.assert(
        fc.property(fc.uuid(), firestoreDataArbitrary, (id, data) => {
          const notification = deserializeNotification(id, data);
          return notification.id === id;
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve title from data", () => {
      fc.assert(
        fc.property(fc.uuid(), firestoreDataArbitrary, (id, data) => {
          const notification = deserializeNotification(id, data);
          return notification.title === data.title;
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve body from data", () => {
      fc.assert(
        fc.property(fc.uuid(), firestoreDataArbitrary, (id, data) => {
          const notification = deserializeNotification(id, data);
          return notification.body === data.body;
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve isRead from data", () => {
      fc.assert(
        fc.property(fc.uuid(), firestoreDataArbitrary, (id, data) => {
          const notification = deserializeNotification(id, data);
          return notification.isRead === data.isRead;
        }),
        { numRuns: 100 }
      );
    });

    it("should handle null/undefined data gracefully", () => {
      fc.assert(
        fc.property(fc.uuid(), fc.constantFrom(null, undefined), (id, data) => {
          const notification = deserializeNotification(id, data);
          return (
            isValidNotification(notification) &&
            notification.id === id &&
            notification.title === "" &&
            notification.body === "" &&
            notification.isRead === false
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should handle missing fields with defaults", () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.record({
            title: fc.option(fc.string(), { nil: undefined }),
            body: fc.option(fc.string(), { nil: undefined }),
            isRead: fc.option(fc.boolean(), { nil: undefined }),
          }),
          (id, partialData) => {
            const notification = deserializeNotification(
              id,
              partialData as Record<string, unknown>
            );
            return (
              isValidNotification(notification) &&
              notification.id === id &&
              (partialData.title === undefined
                ? notification.title === ""
                : notification.title === partialData.title) &&
              (partialData.body === undefined
                ? notification.body === ""
                : notification.body === partialData.body) &&
              (partialData.isRead === undefined
                ? notification.isRead === false
                : notification.isRead === partialData.isRead)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
