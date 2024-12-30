import CryptoJS from 'crypto-js';
import { Mongo } from 'meteor/mongo';
import { Document } from 'bson';

/**
 * When defining basic models, we are omitting the `_id` field.
 * This helper type adds the `_id` field back to the model.
 */
export type InStorage<T> = T & { _id: string };

/**
 * This function hashes the given binary data using SHA256.
 * It's used for generating hashes of binary data stored in the database.
 */
export const hashBinaryData = (data: Uint8Array): string => {
    const words = [];
    for (let i = 0; i < data.length; i += 4) {
        words.push((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]);
    }
    const wordArray = CryptoJS.lib.WordArray.create(words, data.length);
    return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
};

type AsyncMethods = 'findOne' | 'insert' | 'update' | 'remove';
type RemoveNonAsyncMethods<T> = {
    [K in keyof T as K extends AsyncMethods ? never : K]: T[K];
};
export function enforceAsyncMethods<T extends Document, U>(collection: Mongo.Collection<T, U>): RemoveNonAsyncMethods<Mongo.Collection<T, U>> {
    return collection;
}

export function defineMongoCollection<T extends Document, U = T>(name: string): RemoveNonAsyncMethods<Mongo.Collection<InStorage<T>, InStorage<U>>> {
    return new Mongo.Collection<InStorage<T>, InStorage<U>>(name);
}
