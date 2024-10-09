import { DiffTowards } from '../../../utility/type-helpers/DiffTowards';
import {
    File as AbstractFile,
    fileExists,
    FileState,
    FinalizeFile,
    InsertFile,
    StatesWhereFileCanBeFinalized,
    StatesWhereFileCanBeUploaded,
    UploadFile,
} from '../abstractApi';
import { getChunkDataHash, getChunkedUploadDetails } from './chunkingHelpers';
import { FileChunks, Files } from './collections';
import { FileChunkSize } from './properties';

/**
 * Inserts a new file record into the database.
 * This creates empty chunk records for the file, ready to be uploaded with data.
 * @param request
 * @returns
 */
export const insertFile: InsertFile = (request) => {
    console.log('insertFile', request);
    const { requestId, name, size, type } = request;
    const chunkSize = FileChunkSize;
    const currentDate = new Date();

    const newFile: File['creating'] = {
        version: 'chunked-file-v1',
        chunkSize,
        state: FileState.Creating,
        name,
        size,
        type,
        createdAt: currentDate,
    };
    const fileId = Files.insert(newFile);

    try {
        initializeFileChunks(fileId);
    } catch (error) {
        // If there was an error initializing the chunks, delete the file.
        Files.remove(fileId);
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`Could not insert file. File chunks could not be initialized. ${errMsg}`);
    }

    return { requestId, fileId };
};

/**
 * Creates file chunk data storage records for a file, and updates the file record to reference the chunks.
 * @param fileId The ID of the file to initialize chunks for.
 *        The file must be in the creating state.
 *        The file record will be updated to reference the created chunks.
 * @returns The IDs of the created chunks.
 */
function initializeFileChunks(fileId: string): string[] {
    const now = new Date();
    const file = Files.findOne(fileId);
    if (!file) {
        throw new Error('File not found');
    }
    // Can only initialize chunks for a file in the creating state.
    if (file.state !== FileState.Creating) {
        throw new Error('File is not in the creating state');
    }
    const chunkCount = Math.ceil(file.size / file.chunkSize);
    const chunks: FileChunkInfo[] = Array.from({
        length: chunkCount,
    }).map((_, index) => {
        const chunk: FileChunk['created'] = {
            fileId,
            state: FileChunkState.Created,
            start: index * file.chunkSize,
            chunkSize: file.chunkSize,
            dataSize: index === chunkCount - 1 ? file.size % file.chunkSize : file.chunkSize,
            createdAt: new Date(),
        };
        console.log('insertFile.chunk', chunk);

        const chunkId = FileChunks.insert(chunk);
        const chunkInfo: FileChunkInfo = {
            chunkId,
            start: chunk.start,
            state: chunk.state,
            dataSize: chunk.dataSize,
            fingerprint: '',
        };

        return chunkInfo;
    });

    const fileOverride: DiffTowards<File['creating'], File['created']> = {
        state: FileState.Created,
        chunks,
        modifiedAt: now,
    };

    Files.update(fileId, {
        $set: fileOverride,
    });

    const chunkIds = chunks.map((chunk) => chunk.chunkId);
    return chunkIds;
}

/**
 * Uploads a portion of a file.
 * The file needs to be finalized after all data has been uploaded.
 * @param request
 * @returns
 */
export const uploadFile: UploadFile = (request) => {
    const now = new Date();
    console.log('uploadFile', request);
    const { fileId, start, size, data } = request;

    // Verify the file exists.
    const file = Files.findOne(fileId);
    if (!fileExists(file)) {
        throw new Error('File not found');
    }

    // Verify the file is in the correct state.
    if (!StatesWhereFileCanBeUploaded.includes(file.state)) {
        throw new Error('File can not be uploaded.');
    }
    const uploadableFile = file as File['created'];

    // Validate the upload request parameters.
    if (start < 0 || start >= uploadableFile.size) {
        throw new Error('Invalid start position.');
    }
    if (size < 0 || start + size > uploadableFile.size) {
        throw new Error('Invalid size.');
    }
    if (data.length !== size) {
        throw new Error('Data length does not match size.');
    }

    // Find the chunk(s) to upload based on start and actual chunk size.
    const chunkSize = uploadableFile.chunkSize;
    const { offsetIntoFirstChunk, startChunkIndex, chunkCount } = getChunkedUploadDetails(start, chunkSize, size);
    // For simplicity, we do not support uploads that don't match the chunk size.
    // Start must be aligned with the chunk size, and the size must be exactly the chunk size, except for the last chunk.
    if (
        !(
            offsetIntoFirstChunk === 0 &&
            chunkCount === 1 &&
            (size === chunkSize || start + size === uploadableFile.size)
        )
    ) {
        throw new Error('Chunk misalignment.');
    }

    const chunkInfo = uploadableFile.chunks[startChunkIndex];

    // Verify the chunk is in the correct state.
    if (!StatesWhereFileChunkCanBeUploaded.includes(chunkInfo.state)) {
        //! This is bad right? Need to handle this state mismatch/corruption.
        throw new Error('File chunk can not be uploaded.');
    }

    const hash = getChunkDataHash(data);

    const chunkOverride: DiffTowards<FileChunk['created'], FileChunk['finalized']> = {
        state: FileChunkState.Finalized,
        data,
        fingerprint: hash,
        lastUploadedAt: now,
    };

    if (
        FileChunks.update(chunkInfo.chunkId, {
            $set: chunkOverride,
        }) !== 1
    ) {
        throw new Error('Could not update chunk.');
    }

    // Update the metadata of the file.
    Files.update(
        {
            _id: fileId,
            'chunks.chunkId': chunkInfo.chunkId,
            //TODO: enforce file state.
            // state: {
            //     $in: StatesWhereFileCanBeUploaded,
            // }
        },
        {
            $set: {
                state: FileState.Uploading,
                'chunks.$.state': FileChunkState.Finalized,
                'chunks.$.fingerprint': hash,
                modifiedAt: now,
            },
        },
    );

    return { fingerprint: hash, size };
};

/**
 * Finalizes a file after all data has been uploaded.
 * @param request
 * @returns
 */
export const finalizeFile: FinalizeFile = (request) => {
    const now = new Date();
    console.log('finalizeFile', request);
    const { fileId, size, fingerprint } = request;

    // Verify the file exists.
    const file = Files.findOne(fileId);
    if (!fileExists(file)) {
        throw new Error('File not found');
    }

    // Verify the file is in the correct state.
    if (!StatesWhereFileCanBeFinalized.includes(file.state)) {
        throw new Error('File can not be finalized.');
    }

    // Verify the state of all chunks.
    const allChunksFinalized = file.chunks.every((chunk) => chunk.state === FileChunkState.Finalized);
    if (!allChunksFinalized) {
        throw new Error('File not completely uploaded yet.');
    }

    // Verify the fingerprint of all chunks.
    const fingerprintOfAllChunks = file.chunks.map((chunk) => chunk.fingerprint).join(':');
    if (fingerprintOfAllChunks !== fingerprint) {
        throw new Error('Fingerprint does not match.');
    }

    const fileOverride: DiffTowards<File['created'], File['finalized']> = {
        state: FileState.Finalized,
        fingerprint,
        modifiedAt: now,
    };
    Files.update(
        {
            _id: fileId,
            //TODO: enforce file state.
            // state: {
            //     $in: StatesWhereFileCanBeFinalized,
            // }
        },
        {
            $set: fileOverride,
        },
    );

    return { fileId, fingerprint, size };
};

export type File = AbstractFile<{
    [FileState.Creating]: {
        version: 'chunked-file-v1';
        /**
         * Size of each chunk (except the last one) in bytes.
         *
         * This makes it easier to index a specific chunk.
         */
        chunkSize: number;
    };
    [FileChunkState.Created]: {
        /**
         * List of chunks that make up this file.
         */
        chunks: Array<FileChunkInfo>;
    };
}>;

/**
 * This is kept inside a `File` to represent a chunk of data of a file.
 * This is used to present quick info about the chunks without loading the actual data.
 */
interface FileChunkInfo {
    /**
     * The ID of this chunk in the file-chunks collection.
     */
    chunkId: string;
    /**
     * The index of the first byte of this chunk.
     */
    start: number;
    /**
     * The state of this chunk.
     */
    state: FileChunkState;
    /**
     * The size of the data in this chunk in bytes.
     * Get the chunk size from the `File` containing this object.
     */
    dataSize: number;
    /**
     * The hash of this chunk.
     * This property is only set when the chunk is finalized.
     */
    fingerprint: string;
}

interface FileChunk_Base {
    /**
     * The ID of the file this chunk belongs to.
     */
    fileId: string;

    /**
     * The state of this chunk.
     */
    state: FileChunkState;

    /**
     * The index of the first byte of this chunk.
     */
    start: number;

    /**
     * The size of this chunk in bytes.
     */
    chunkSize: number;

    /**
     * The size of the data in this chunk in bytes.
     */
    dataSize: number;
}

type OverrideFileChunkState<
    T_Base extends { state: FileChunkState },
    T_State extends FileChunkState,
    T_Ext extends FileChunkStateExtensions,
    T_More extends {}
> = Omit<T_Base, 'state'> & { state: T_State } & T_Ext[T_State] & T_More;

type FileChunkStateExtensions = { [S in FileChunkState]?: {} };

export type FileChunk_Created<T extends FileChunkStateExtensions> = OverrideFileChunkState<
    FileChunk_Base,
    FileChunkState.Created,
    T,
    {
        /**
         * Time this document entry was created.
         */
        createdAt: Date;
    }
>;

export type FileChunk_Uploading<T extends FileChunkStateExtensions> = OverrideFileChunkState<
    FileChunk_Created<T>,
    FileChunkState.Uploading,
    T,
    {
        /**
         * Time of the last attempted upload. This helps to determine if the chunk is stale.
         */
        lastUploadedAt: Date;
    }
>;

export type FileChunk_Failed<T extends FileChunkStateExtensions> = OverrideFileChunkState<
    FileChunk_Uploading<T>,
    FileChunkState.Failed,
    T,
    {}
>;

export type FileChunk_Finalized<T extends FileChunkStateExtensions> = OverrideFileChunkState<
    FileChunk_Uploading<T>,
    FileChunkState.Finalized,
    T,
    {
        /**
         * The data of this chunk.
         */
        data: Uint8Array;
        /**
         * The hash of this chunk.
         * This property is only set when the chunk is finalized.
         */
        fingerprint: string;
    }
>;

type FileChunk_General<T extends FileChunkStateExtensions> =
    | FileChunk_Created<T>
    | FileChunk_Uploading<T>
    | FileChunk_Failed<T>
    | FileChunk_Finalized<T>;

/**
 * This represents a chunk of data of a file.
 * It's maintained in an all-or-nothing manner. There is no partially uploaded chunks.
 *
 * Mongo documents can not exceed 16MB.
 * @see https://docs.mongodb.com/manual/reference/limits/#bson-documents
 */
export type FileChunk<T extends FileChunkStateExtensions = {}> = {
    general: FileChunk_General<T>;
    [FileChunkState.Created]: FileChunk_Created<T>;
    [FileChunkState.Uploading]: FileChunk_Uploading<T>;
    [FileChunkState.Failed]: FileChunk_Failed<T>;
    [FileChunkState.Finalized]: FileChunk_Finalized<T>;
};

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
     * The chunk has failed to upload. It can be retried.
     * Can transition to: uploading.
     */
    Failed = 'failed',
    /**
     * The chunk has been uploaded.
     * Can not transition to any other state.
     */
    Finalized = 'finalized',
}

export const StatesWhereFileChunkCanBeUploaded: FileChunkState[] = [
    FileChunkState.Created,
    FileChunkState.Uploading,
    FileChunkState.Failed,
];
