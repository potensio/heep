export const queryKeys = {
  notifications: {
    all: ["notifications"] as const,
    list: () => [...queryKeys.notifications.all, "list"] as const,
    detail: (id: string) =>
      [...queryKeys.notifications.all, "detail", id] as const,
  },
} as const;
