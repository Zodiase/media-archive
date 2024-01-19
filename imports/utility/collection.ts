/**
 * When defining basic models, we are omitting the `_id` field.
 * This helper type adds the `_id` field back to the model.
 */
export type InStorage<T> = T & { _id: string };
