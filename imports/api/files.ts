import { Mongo } from 'meteor/mongo';

/**
 * This interface describes a file.
 *
 * This contains basic metadata of a file.
 *
 * It does not contain the actual data of the file since we use chunking to store the file data.
 */
export interface File {
    _id?: string;

    /**
     * Name of the file in the traditional sense in a file system.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File/name
     */
    name: string;

    /**
     * Size of the file in bytes.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File/size
     */
    size: number;

    /**
     * The MIME type of the file.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File/type
     */
    type: string;

    /**
     * IDs of file chunks.
     */
    chunks: string[];

    /**
     * Size of each chunk (except the last one) in bytes.
     *
     * This makes it easier to index a specific chunk.
     */
    chunkSize: number;

    /**
     * Time this document was created.
     */
    createdAt: Date;

    /**
     * Time this document was last modified.
     */
    modifiedAt: Date;

    /**
     * The last modified time of the file, in millisecond since the UNIX epoch (January 1st, 1970 at Midnight).
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File/lastModified
     */
    lastModified: number;
}

/**
 * This represents a chunk of data of a file.
 *
 * Mongo documents can not exceed 16MB.
 * @see https://docs.mongodb.com/manual/reference/limits/#bson-documents
 */
export interface FileChunk {
    _id?: string;

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

export const Files = new Mongo.Collection<File>('files');
export const FileChunks = new Mongo.Collection<FileChunk>('file-chunks');
