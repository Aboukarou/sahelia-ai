export const USER_ROLES = ["SUPER_ADMIN", "ADMIN", "CLIENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface ApiHealth {
  service: "sahelia-api";
  status: "ok";
  timestamp: string;
}
