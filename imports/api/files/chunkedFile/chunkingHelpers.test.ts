import { expect } from 'expect';
import { getChunkedUploadDetails, getChunkDataHash } from './chunkingHelpers';

describe('getChunkedUploadDetails', () => {
    it('should return correct details for data starting at the beginning of a chunk', () => {
        const result = getChunkedUploadDetails(0, 1024, 2048);
        expect(result).toEqual({
            offsetIntoFirstChunk: 0,
            startChunkIndex: 0,
            chunkCount: 2,
        });
    });

    it('should return correct details for data starting in the middle of a chunk', () => {
        const result = getChunkedUploadDetails(512, 1024, 2048);
        expect(result).toEqual({
            offsetIntoFirstChunk: 512,
            startChunkIndex: 0,
            chunkCount: 3,
        });
    });

    it('should return correct details for data spanning multiple chunks', () => {
        const result = getChunkedUploadDetails(1024, 1024, 3072);
        expect(result).toEqual({
            offsetIntoFirstChunk: 0,
            startChunkIndex: 1,
            chunkCount: 3,
        });
    });

    it('should return correct details for data starting at the end of a chunk', () => {
        const result = getChunkedUploadDetails(1023, 1024, 2048);
        expect(result).toEqual({
            offsetIntoFirstChunk: 1023,
            startChunkIndex: 0,
            chunkCount: 3,
        });
    });
});

describe('getChunkDataHash', () => {
    it('should return correct hash for given data', () => {
        const data = new Uint8Array([1, 2, 3, 4, 5]);
        const hash = getChunkDataHash(data);
        expect(hash).toBe('74f81fe167d99b4cb41d6d0ccda82278caee9f3e2f25d5e5a3936ff3dcec60d0');
    });
});
