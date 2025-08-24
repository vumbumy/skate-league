export const States = {
  AUTH: "auth",
  PROFILE: "profile",
  LEAGUE: "league",
  REGISTRATION_CHECK: "registration_check",
  IDLE: "idle",
  ERROR: "error",
  SUBMITTING: "submitting",
  SUCCESS: "success",
} as const;

export type State = (typeof States)[keyof typeof States];

// Re-export commonly used types
export * from "./user";
export * from "./league";
export * from "./auth";
