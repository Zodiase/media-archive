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
     */
    name: string;
    /**
     * Size of the file in bytes.
     */
    size: number;

    /**
     * IDs of file chunks.
     */
    chunks: string[];

    /**
     * Time this file was created.
     */
    createdAt: Date;

    /**
     * Time this file was last modified.
     */
    modifiedAt: Date;
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
