import CryptoJS from 'crypto-js';

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
