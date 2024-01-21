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
     * The state of a file can be one of the following:
     * - creating: The file is being created. Records of this file are being created in the files and file-chunks collections. In this state, the properties of this file are not yet finalized.
     *   - Can transition to: created, failed.
     * - created: The file has been created but not uploaded yet.
     *   - Can transition to: uploading, failed, abandoned.
     * - uploading: The file is being uploaded.
     *   - Can transition to: finalized, failed, abandoned.
     * - finalized: The file has been uploaded.
     *   - Can transition to: deleted.
     * - failed: The file has failed to upload. It can be retried.
     *   - Can transition to: abandoned.
     * - deleted: The file has been deleted.
     * - abandoned: The file has been abandoned during upload. It can not be retried. This record can be deleted.
     */
    state: 'creating' | 'created' | 'uploading' | 'finalized' | 'failed' | 'deleted' | 'abandoned';

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

export const StatesWhereFileDoesNotExist: File['state'][] = ['creating', 'deleted', 'abandoned'];
export const StatesWhereFileCanBeUploaded: File['state'][] = ['created', 'uploading', 'failed'];
export const StatesWhereFileIsAlreadyUploaded: File['state'][] = ['finalized'];
export const StatesWhereFileCanBeFinalized: File['state'][] = ['uploading'];
export const StatesWhereFileCanBeDeleted: File['state'][] = ['finalized'];

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
     * The state of a chunk can be one of the following:
     * - created: The chunk has been created but not uploaded yet.
     *  - Can transition to: uploading, failed.
     * - uploading: The chunk is being uploaded.
     * - Can transition to: finalized, failed.
     * - finalized: The chunk has been uploaded.
     * - failed: The chunk has failed to upload. It can be retried.
     */
    state: 'created' | 'uploading' | 'finalized' | 'failed';

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
     * The state of a chunk can be one of the following:
     * - created: The chunk has been created but not uploaded yet.
     *   - Can transition to: uploading, failed.
     * - uploading: The chunk is being uploaded.
     *   - Can transition to: finalized, failed.
     * - finalized: The chunk has been uploaded.
     * - failed: The chunk has failed to upload. It can be retried.
     */
    state: 'created' | 'uploading' | 'finalized' | 'failed';

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

export const FileChunkSize = 2 * 1024 * 1024; // 2MB

export const StatesWhereChunkIsAlreadyUploaded: FileChunkInfo['state'][] = ['finalized'];
export const StatesWhereChunkCanBeUpdated: FileChunkInfo['state'][] = ['created', 'uploading', 'failed'];
export const StatesWhereChunkCanBeFinalized: FileChunkInfo['state'][] = ['uploading'];
