/**
 * This helper type adds a consistent `requestId` property to a request object.
 */
export type TrackedRequest<T> = T & { requestId: string };
