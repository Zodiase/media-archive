/**
 * This represents a chunk of data of a file.
 *
 * Mongo documents can not exceed 16MB.
 * @see https://docs.mongodb.com/manual/reference/limits/#bson-documents
 */
export interface FileChunk {
    /**
     * ID of the file this chunk belongs to.
     */
    file: string;

    /**
     * ID of the previous file chunk.
     */
    prevChunk: string;

    /**
     * ID of he next file chunk.
     */
    nextChunk: string;

    /**
     * Size of this chunk.
     */
    size: number;

    /**
     * Data of this chunk.
     */
    data: Buffer;
}

export const FileChunkSize = 2 * 1024 * 1024; // 2MB
