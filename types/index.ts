export const States = {
  AUTH: 'auth',
  PROFILE: 'profile',
  LEAGUE: 'league',
  REGISTRATION_CHECK: 'registration_check',
  IDLE: 'idle',
  ERROR: 'error',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
} as const;

export type State = typeof States[keyof typeof States]; // 타입 이름을 State로 유지
