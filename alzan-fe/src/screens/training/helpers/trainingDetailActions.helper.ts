export const canDeleteActivitySession = (
  sessionId: string | undefined,
  isPendingSession: boolean,
  isDeleting: boolean,
): boolean => Boolean(sessionId && !isPendingSession && !isDeleting);
