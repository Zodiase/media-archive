// import crypto from 'crypto';
import { hashBinaryData } from '/imports/utility/collection';

export interface ChunkedUploadDetails {
    /**
     * The index of the first chunk where the uploaded data starts.
     */
    startChunkIndex: number;
    /**
     * The offset into the first chunk where the data starts.
     */
    offsetIntoFirstChunk: number;
    /**
     * The number of chunks that the data spans.
     */
    chunkCount: number;
}

export const getChunkedUploadDetails = (
    start: number,
    chunkSize: number,
    dataSize: number,
): { offsetIntoFirstChunk: number; startChunkIndex: number; chunkCount: number } => {
    const offsetIntoFirstChunk = start % chunkSize;
    const startChunkIndex = (start - offsetIntoFirstChunk) / chunkSize;
    const chunkCount = Math.ceil((offsetIntoFirstChunk + dataSize) / chunkSize);

    return { offsetIntoFirstChunk, startChunkIndex, chunkCount };
};

export const getChunkDataHash = (data: Uint8Array): string => {
    // const hash = crypto.createHash('sha256');
    // hash.update(data);
    // return hash.digest('hex');
    return hashBinaryData(data);
};
