/**
 * This module contains the logic for handling files in a chunked manner.
 */

/**
 * This interface describes a file.
 *
 * This contains basic metadata of a file.
 *
 * It does not contain the actual data of the file since we use chunking to store the file data.
 */
export interface File {
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
     * The state of this file.
     */
    state: FileState;

    /**
     * Size of each chunk (except the last one) in bytes.
     *
     * This makes it easier to index a specific chunk.
     */
    chunkSize: number;

    /**
     * List of chunks that make up this file.
     */
    chunks: FileChunkInfo[];

    /**
     * Time this document was created.
     */
    createdAt: Date;

    /**
     * Time this document was last modified.
     */
    modifiedAt: Date;

    /**
     * The hash of this file.
     * This property is only set when the file is finalized.
     */
    hash: string;
}

/**
 * This enum represents the state of a file.
 */
export enum FileState {
    /**
     * The file is being created. Records of this file are being created in the files and file-chunks collections. In this state, the properties of this file are not yet finalized.
     * Can transition to: created, failed.
     */
    Creating = 'creating',
    /**
     * The file has been created but not uploaded yet.
     * Can transition to: uploading, failed, abandoned.
     */
    Created = 'created',
    /**
     * The file is being uploaded.
     * Can transition to: finalized, failed, abandoned.
     */
    Uploading = 'uploading',
    /**
     * The file has been uploaded.
     * Can transition to: deleted.
     */
    Finalized = 'finalized',
    /**
     * The file has failed to upload. It can be retried.
     * Can transition to: uploading, abandoned.
     */
    Failed = 'failed',
    /**
     * The file has been deleted.
     * Can not transition to any other state.
     */
    Deleted = 'deleted',
    /**
     * The file has been abandoned during upload. It can not be retried. This record can be deleted.
     * Can not transition to any other state.
     */
    Abandoned = 'abandoned',
}

export const StatesWhereFileDoesNotExist: FileState[] = [FileState.Creating, FileState.Deleted, FileState.Abandoned];
export const StatesWhereFileCanBeUploaded: FileState[] = [FileState.Created, FileState.Uploading, FileState.Failed];
export const StatesWhereFileIsAlreadyUploaded: FileState[] = [FileState.Finalized];
export const StatesWhereFileCanBeFinalized: FileState[] = [FileState.Uploading];
export const StatesWhereFileCanBeDeleted: FileState[] = [FileState.Finalized];

export interface FileChunkInfo {
    /**
     * The ID of the file this chunk belongs to.
     */
    fileId: string;

    /**
     * The ID of this chunk in the file-chunks collection.
     */
    chunkId: string;

    /**
     * The index of this chunk.
     */
    index: number;

    /**
     * The state of this chunk.
     */
    state: FileChunkState;

    /**
     * The size of this chunk in bytes.
     */
    size: number;

    /**
     * The hash of this chunk.
     * This property is only set when the chunk is finalized.
     */
    hash: string;
}

/**
 * This represents a chunk of data of a file.
 *
 * Mongo documents can not exceed 16MB.
 * @see https://docs.mongodb.com/manual/reference/limits/#bson-documents
 */
export interface FileChunk {
    /**
     * The ID of the file this chunk belongs to.
     */
    fileId: string;

    /**
     * The index of this chunk.
     */
    index: number;

    /**
     * The state of this chunk.
     */
    state: FileChunkState;

    /**
     * The size of this chunk.
     */
    size: number;

    /**
     * The data of this chunk.
     */
    data: Uint8Array;

    /**
     * The hash of this chunk.
     * This property is only set when the chunk is finalized.
     */
    hash: string;
}

export enum FileChunkState {
    /**
     * The chunk has been created but not uploaded yet.
     * Can transition to: uploading, failed.
     */
    Created = 'created',
    /**
     * The chunk is being uploaded.
     * Can transition to: finalized, failed.
     */
    Uploading = 'uploading',
    /**
     * The chunk has been uploaded.
     * Can not transition to any other state.
     */
    Finalized = 'finalized',
    /**
     * The chunk has failed to upload. It can be retried.
     * Can transition to: uploading.
     */
    Failed = 'failed',
}

export const FileChunkSize = 2 * 1024 * 1024; // 2MB

export const StatesWhereChunkIsAlreadyUploaded: FileChunkState[] = [FileChunkState.Finalized];
export const StatesWhereChunkCanBeUpdated: FileChunkState[] = [
    FileChunkState.Created,
    FileChunkState.Uploading,
    FileChunkState.Failed,
];
export const StatesWhereChunkCanBeFinalized: FileChunkState[] = [FileChunkState.Uploading];
