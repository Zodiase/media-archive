/**
 * This file exports apis for the files collection.
 * APIs exported:
 * - insertFile: This method is used to insert a file.
 * - uploadFileChunk: This method is used to upload the data of a file chunk.
 * - finalizeFileChunk: This method is used to mark a file chunk as uploaded.
 * - finalizeFile: This method is used to mark a file as uploaded.
 * - findFileById
 * - findFileChunkById
 * - findFileChunksByFileId
 * - findFileChunksByFileIdAndOffsetAndLimit
 *
 * The files collection stores metadata about files.
 * The file-chunks collection stores the actual file data.
 *
 * The files collection has a one-to-many relationship with the file-chunks collection.
 *
 * The entire process of uploading a file is as follows:
 * 1. The client calls insertFile to insert a file.
 *     - The server creates a record in the files collection.
 *     - The server responds with the ID of the inserted file, and the size of each chunk (except the last one) in bytes that the client should use to upload the file.
 * 2. The client calls uploadFileChunk to upload each chunk of the file.
 * 3. The client calls finalizeFileChunk to mark each chunk as uploaded.
 * 3. The client calls finalizeFile to mark the file as uploaded.
 */

import { Meteor } from 'meteor/meteor';
import { Files, FileChunks } from './collections';
import {
    File,
    FileChunkInfo,
    FileChunk,
    FileChunkSize,
    StatesWhereFileCanBeUploaded,
    StatesWhereFileDoesNotExist,
    StatesWhereFileIsAlreadyUploaded,
    StatesWhereChunkIsAlreadyUploaded,
    StatesWhereChunkCanBeUpdated,
    StatesWhereChunkCanBeFinalized,
    StatesWhereFileCanBeFinalized,
} from './chunkedFile';
import { hashBinaryData } from '/imports/utility/collection';

/**
 * This interface represents the info sent from the client to the server to insert a file.
 */
export interface InsertFileRequest {
    /**
     * The name of the file.
     */
    name: string;

    /**
     * The size of the file in bytes.
     */
    size: number;

    /**
     * The type of the file.
     */
    type: string;
}

/**
 * This interface represents the info received from the server after inserting a file.
 */
export interface InsertFileResponse {
    /**
     * The ID of the inserted file.
     */
    fileId: string;

    /**
     * The size of each chunk (except the last one) in bytes.
     */
    chunkSize: number;

    /**
     * The IDs of the chunks of this file..
     */
    chunkIds: string[];
}

/**
 * TODO: add the concept of upload tasks with unique IDs so clients can accurately track the progress of each upload task.
 * This method is used to insert a file.
 * An inserted is not uploaded yet.
 * The finalizeFile method must be called to mark the file as uploaded.
 * @param file The file to insert.
 * @returns The ID of the inserted file.
 * @throws If the file is not inserted.
 * @throws If the file is already inserted.
 * @throws If the file is already uploaded.
 * @throws If the file is already finalized.
 * @throws If the file is already deleted.
 */
export const insertFile = (file: InsertFileRequest): InsertFileResponse => {
    console.log('insertFile', file);
    const { name, size, type } = file;
    const chunkSize = FileChunkSize;
    const currentDate = new Date();

    const fileId = Files.insert({
        name,
        size,
        type,
        state: 'creating',
        chunkSize,
        chunks: [],
        createdAt: currentDate,
        modifiedAt: currentDate,
        hash: '',
    });
    console.log('insertFile.fileId', fileId);

    const chunkCount = Math.ceil(size / chunkSize);
    const chunks: FileChunkInfo[] = Array.from({ length: chunkCount }).map((_, index) => {
        const chunk: FileChunk = {
            fileId,
            index,
            state: 'created',
            size: index === chunkCount - 1 ? size % chunkSize : chunkSize,
            data: new Uint8Array(),
            hash: '',
        };
        console.log('insertFile.chunk', chunk);

        const chunkId = FileChunks.insert(chunk);

        return {
            fileId,
            chunkId,
            index,
            state: chunk.state,
            size: chunk.size,
            hash: chunk.hash,
        };
    });

    Files.update(fileId, {
        $set: {
            state: 'created',
            chunks,
        },
    });

    return {
        fileId,
        chunkSize,
        chunkIds: chunks.map((chunk) => chunk.chunkId),
    };
};

/**
 * Find the file collection entry this chunk belongs to.
 * Throw an error if:
 * - The file entry does not exist. This does not mean the file exists for the user.
 * @returns The file.
 */
const findFileEntryOfFileChunk = (fileId: string, index: number, chunkId: string): File => {
    const file = Files.findOne({
        _id: fileId,
        [`chunks.${index}.chunkId`]: chunkId,
    });
    if (!file) {
        throw new Error('File entry not found.');
    }
    return file;
};

/**
 * Find the chunk info from the file with the given index.
 * Throw an error if:
 * - The chunk info does not exist in the file.
 * - The chunk does not exist in the file-chunks collection.
 * @param file
 * @param index
 * @returns The chunk info.
 */
const findFileChunkInfoByIndexInFile = (file: File, index: number): FileChunkInfo => {
    if (index >= file.chunks.length) {
        throw new Meteor.Error('Chunk index is out of bounds.');
    }
    const chunkInfo = file.chunks[index];
    const chunk = FileChunks.findOne({
        _id: chunkInfo.chunkId,
        fileId: chunkInfo.fileId,
        index: chunkInfo.index,
    });

    if (!chunk) {
        throw new Meteor.Error('Chunk not found.');
    }

    return chunkInfo;
};

/**
 * This interface represents the info sent from the client to the server to insert a file chunk.
 */
export interface UploadFileChunkRequest {
    /**
     * The ID of the file this chunk belongs to.
     */
    fileId: string;

    /**
     * The index of this chunk.
     */
    index: number;

    /**
     * The ID of the chunk.
     */
    chunkId: string;

    /**
     * The size of this chunk in bytes.
     */
    size: number;

    /**
     * The data of this chunk.
     */
    data: Uint8Array;
}

/**
 * This interface represents the info received from the server after inserting a file chunk.
 */
export interface UploadFileChunkResponse {
    /**
     * The ID of the inserted file chunk.
     */
    chunkId: string;
}

/**
 * This method is used to upload a file chunk.
 * The following steps are taken:
 * 1. Find the file this chunk belongs to.
 * 2. Make sure the file can be uploaded.
 * 3. Find the chunk info.
 * 4. Make sure the chunk can be updated.
 * 5. Update the chunk data and hash.
 * 6. Update the chunk info and the modified date of the file.
 *
 * @param fileChunk The file chunk to upload.
 * @throws If the file containing this chunk does not exist.
 * @throws If the file containing this chunk can not be uploaded.
 * @throws If the file chunk is already uploaded.
 */
export const uploadFileChunk = (fileChunk: UploadFileChunkRequest): UploadFileChunkResponse => {
    console.log('uploadFileChunk', fileChunk);

    // Input checks.
    const checkInputs = (fileChunk: UploadFileChunkRequest): UploadFileChunkRequest => {
        if (fileChunk.index < 0) {
            throw new Meteor.Error('Index must be non-negative.');
        }
        if (fileChunk.size !== fileChunk.data.length) {
            throw new Meteor.Error('Size does not match data length.');
        }
        return fileChunk;
    };

    const { fileId, index, chunkId, data } = checkInputs(fileChunk);

    // Find file and make sure it can be uploaded.
    const file = findFileEntryOfFileChunk(fileId, index, chunkId);
    if (!StatesWhereFileCanBeUploaded.includes(file.state)) {
        if (StatesWhereFileDoesNotExist.includes(file.state)) {
            throw new Meteor.Error('File does not exist.');
        }
        if (StatesWhereFileIsAlreadyUploaded.includes(file.state)) {
            throw new Meteor.Error('File is already uploaded.');
        }
        throw new Meteor.Error('File can not be uploaded.');
    }
    // Find chunk info.
    const chunkInfo = findFileChunkInfoByIndexInFile(file, index);

    /*
     * Update the chunk data and hash.
     * Also update the modified date of the file containing the chunk.
     * Throw an error if:
     * - The chunk is already uploaded.
     * - The data size does not match the chunk size.
     */
    const currentDate = new Date();
    if (StatesWhereChunkIsAlreadyUploaded.includes(chunkInfo.state)) {
        throw new Meteor.Error('Chunk is already uploaded.');
    }
    if (chunkInfo.size !== data.length) {
        throw new Meteor.Error('Chunk size does not match data length.');
    }

    const hash = hashBinaryData(data);

    FileChunks.update(
        {
            _id: chunkInfo.chunkId,
            // check if the chunk is in the expected state.
            state: {
                $in: StatesWhereChunkCanBeUpdated,
            },
        },
        {
            $set: {
                state: 'uploading',
                data,
                hash,
            },
        },
    );

    // Update the chunk info and the modified date of the file.
    Files.update(
        {
            _id: chunkInfo.fileId,
            [`chunks.${chunkInfo.index}.chunkId`]: chunkInfo.chunkId,
            state: {
                $in: StatesWhereFileCanBeUploaded,
            },
        },
        {
            $set: {
                state: 'uploading',
                modifiedAt: currentDate,
                [`chunks.${chunkInfo.index}.state`]: 'uploading',
                [`chunks.${chunkInfo.index}.hash`]: hash,
            },
        },
    );

    return {
        chunkId: chunkInfo.chunkId,
    };
};

/**
 * This interface represents the info sent from the client to the server to finalize a file chunk.
 */
export interface FinalizeFileChunkRequest {
    /**
     * The ID of the file this chunk belongs to.
     */
    fileId: string;

    /**
     * The index of this chunk.
     */
    index: number;

    /**
     * The ID of the chunk.
     */
    chunkId: string;

    /**
     * The expected hash of this chunk.
     */
    expectedHash: string;
}

/**
 * This interface represents the info received from the server after finalizing a file chunk.
 */
export interface FinalizeFileChunkResponse {}

/**
 * This method is used to finalize a file chunk.
 * @param fileChunk The file chunk to finalize.
 * @throws If the file chunk does not exist.
 * @throws If the file chunk can not be finalized.
 */
export const finalizeFileChunk = (fileChunk: FinalizeFileChunkRequest): FinalizeFileChunkResponse => {
    console.log('finalizeFileChunk', fileChunk);

    // Input checks.
    const checkInputs = (fileChunk: FinalizeFileChunkRequest): FinalizeFileChunkRequest => {
        if (fileChunk.index < 0) {
            throw new Meteor.Error('Index must be non-negative.');
        }
        return fileChunk;
    };

    const { fileId, index, chunkId, expectedHash } = checkInputs(fileChunk);

    // Find file.
    const file = findFileEntryOfFileChunk(fileId, index, chunkId);
    // Check if the file can be uploaded.
    if (!StatesWhereFileCanBeUploaded.includes(file.state)) {
        if (StatesWhereFileDoesNotExist.includes(file.state)) {
            throw new Meteor.Error('File does not exist.');
        }
        if (StatesWhereFileIsAlreadyUploaded.includes(file.state)) {
            throw new Meteor.Error('File is already uploaded.');
        }
        throw new Meteor.Error('File can not be uploaded.');
    }
    // Find chunk info.
    const chunkInfo = findFileChunkInfoByIndexInFile(file, index);

    // Update the chunk to mark it as finalized.
    const currentDate = new Date();

    if (!StatesWhereChunkCanBeFinalized.includes(chunkInfo.state)) {
        throw new Meteor.Error('Chunk can not be finalized. Invalid state.');
    }
    if (chunkInfo.hash !== expectedHash) {
        throw new Meteor.Error('Chunk can not be finalized. Hash does not match.');
    }

    FileChunks.update(
        {
            _id: chunkInfo.chunkId,
            // check if the chunk is in the expected state.
            state: {
                $in: StatesWhereChunkCanBeFinalized,
            },
            hash: expectedHash,
        },
        {
            $set: {
                state: 'finalized',
            },
        },
    );

    // Update the modified date of the file,
    // and also the chunk info.
    Files.update(
        {
            _id: chunkInfo.fileId,
            [`chunks.${chunkInfo.index}.chunkId`]: chunkInfo.chunkId,
            state: {
                $in: StatesWhereFileCanBeUploaded,
            },
        },
        {
            $set: {
                state: 'uploading',
                modifiedAt: currentDate,
                [`chunks.${chunkInfo.index}.state`]: 'finalized',
            },
        },
    );

    return {};
};

/**
 * This interface represents the info sent from the client to the server to finalize a file.
 */
export interface FinalizeFileRequest {
    /**
     * The ID of the file.
     */
    fileId: string;

    /**
     * The size of the file in bytes.
     */
    size: number;
}

/**
 * This interface represents the info received from the server after finalizing a file.
 * It includes everything in the request, plus the hash of the file.
 */
export interface FinalizeFileResponse extends FinalizeFileRequest {
    hash: string;
}

/**
 * This method is used to finalize a file.
 * The following steps are taken:
 * 1. Find the file.
 * 2. Make sure the file can be finalized.
 * 3. Make sure all chunks of the file are finalized.
 * 4. Update the file to mark it as finalized.
 *
 * @param file The file to finalize.
 * @throws If the file does not exist.
 * @throws If the file can not be finalized.
 */
export const finalizeFile = (file: FinalizeFileRequest): FinalizeFileResponse => {
    console.log('finalizeFile', file);

    // Input checks.
    const checkInputs = (file: FinalizeFileRequest): FinalizeFileRequest => {
        return file;
    };

    const { fileId, size } = checkInputs(file);

    // Find file.
    const fileEntry = Files.findOne({
        _id: fileId,
    });
    if (!fileEntry || StatesWhereFileDoesNotExist.includes(fileEntry.state)) {
        throw new Meteor.Error('File not found.');
    }

    // Check if the file can be finalized.
    if (!StatesWhereFileCanBeFinalized.includes(fileEntry.state)) {
        throw new Meteor.Error('File can not be finalized.');
    }

    // Check if all metadata of the file is correct.
    if (fileEntry.size !== size) {
        throw new Meteor.Error('File size does not match.');
    }

    // Make sure all chunks of the file are finalized.
    const chunkIds = fileEntry.chunks.map((chunk) => chunk.chunkId);
    const chunkCount = chunkIds.length;
    const finalizedChunkCount = FileChunks.find({
        _id: {
            $in: chunkIds,
        },
        fileId,
        state: 'finalized',
    }).count();

    if (finalizedChunkCount !== chunkCount) {
        throw new Meteor.Error('Not all chunks are finalized.');
    }

    /*
     * Calculate hash from all the chunks.
     * Read one chunk at a time to avoid running out of memory.
     */
    const hasher = chunkIds.reduce((hasher, chunkId) => {
        const chunk = FileChunks.findOne({
            _id: chunkId,
            fileId,
        });
        if (!chunk) {
            throw new Meteor.Error('Chunk not found.');
        }

        const words = [];
        for (let i = 0; i < chunk.data.length; i += 4) {
            words.push(
                (chunk.data[i] << 24) | (chunk.data[i + 1] << 16) | (chunk.data[i + 2] << 8) | chunk.data[i + 3],
            );
        }
        const wordArray = CryptoJS.lib.WordArray.create(words, chunk.data.length);
        hasher.update(wordArray);

        return hasher;
    }, CryptoJS.algo.SHA256.create());
    const hashString = hasher.finalize().toString(CryptoJS.enc.Hex);

    // Update the file to mark it as finalized.
    const currentDate = new Date();
    Files.update(
        {
            _id: fileId,
            state: {
                $in: StatesWhereFileCanBeFinalized,
            },
        },
        {
            $set: {
                state: 'finalized',
                modifiedAt: currentDate,
                hash: hashString,
            },
        },
    );

    return {
        ...file,
        hash: hashString,
    };
};
