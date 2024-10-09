import { TrackedRequest } from '/imports/utility/request';

/**
 * This represents the info sent from the client to the server to insert a file.
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
 * This represents the info received from the server after inserting a file.
 */
export interface InsertFileResponse {
    /**
     * The ID of the inserted file.
     */
    fileId: string;
}

/**
 * This method is used to insert a file.
 * An inserted file is not uploaded yet.
 * The finalizeFile method must be called to mark the file as uploaded.
 * @param request
 * @returns
 * @throws If the file is not inserted.
 * @throws If the file is already inserted.
 * @throws If the file is already uploaded.
 * @throws If the file is already finalized.
 * @throws If the file is already deleted.
 */
export interface InsertFile {
    (request: TrackedRequest<InsertFileRequest>): TrackedRequest<InsertFileResponse>;
}

/**
 * This interface represents the info sent from the client to the server to upload a portion of a file.
 */
export interface UploadFileRequest {
    /**
     * The ID of the file.
     */
    fileId: string;

    /**
     * The start byte of this chunk in the file.
     */
    start: number;

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
 * This interface represents the info received from the server after uploading a portion of a file.
 */
export interface UploadFileChunkResponse {
    /**
     * Hash of the uploaded chunk.
     */
    fingerprint: string;
    /**
     * The size of received chunk in bytes.
     */
    size: number;
}

/**
 * This method is used to upload a portion of a file.
 * @param request
 * @returns
 * @throws If the file does not exist.
 * @throws If the portion is already uploaded.
 * @throws If the file is in a state where it can not be uploaded.
 */
export interface UploadFile {
    (request: UploadFileRequest): UploadFileChunkResponse;
}

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

    /**
     * The expected hash of the file.
     */
    fingerprint: string;
}

/**
 * This interface represents the info received from the server after finalizing a file.
 * It includes everything in the request.
 */
export interface FinalizeFileResponse extends FinalizeFileRequest {}

/**
 * This method is used to finalize a file.
 * @param request
 * @returns
 * @throws If the file does not exist.
 * @throws If the file can not be finalized.
 * @throws If the fingerprint does not match the file.
 */
export interface FinalizeFile {
    (request: FinalizeFileRequest): FinalizeFileResponse;
}

/**
 * This interface represents the info sent from the client to the server to delete a file.
 */
export interface DeleteFileRequest {
    /**
     * The ID of the file.
     */
    fileId: string;

    /**
     * The size of the file in bytes.
     */
    size: number;

    /**
     * The expected hash of the file.
     */
    fingerprint: string;
}

/**
 * This interface represents the info received from the server after deleting a file.
 * It includes everything in the request.
 */
export interface DeleteFileResponse extends DeleteFileRequest {}

/**
 * This method is used to delete a file.
 * @param request
 * @returns
 * @throws If the file does not exist.
 */
export interface DeleteFile {
    (request: DeleteFileRequest): DeleteFileResponse;
}

interface File_Base {
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
}

/**
 * This helps to write different File interfaces in an expressive way to help understand how File states transition.
 */
type OverrideFileState<T_Base extends { state: FileState }, T_State extends FileState, T_Ext extends FileStateExtensions, T_More extends {}> = Omit<T_Base, 'state'> & {
    state: T_State;
} & T_Ext[T_State] & T_More;

type FileStateExtensions = { [S in FileState]?: {} };

/**
 * A file record stuck in the creating state, determined by the `createdAt` property, can be deleted (not the same as the Deleted state).
 */
type File_Creating<T extends FileStateExtensions> = OverrideFileState<
    File_Base,
    FileState.Creating,
    T,
    {
        /**
         * Time this document entry was created.
         */
        createdAt: Date;
    }
>;

type File_Created<T extends FileStateExtensions> = OverrideFileState<
    File_Creating<T>,
    FileState.Created,
    T,
    {
        /**
         * Time this document was last modified.
         */
        modifiedAt: Date;
    }
>;

type File_Uploading<T extends FileStateExtensions> = OverrideFileState<
    File_Created<T>,
    FileState.Uploading,
    T,
    {}
>;

/**
 * This can be transitioned to from the creating state.
 */
type File_Failed<T extends FileStateExtensions> = OverrideFileState<File_Uploading<T>, FileState.Failed, T, {}>;

/**
 * This can be transitioned to from the uploading state.
 */
type File_Finalized<T extends FileStateExtensions> = OverrideFileState<
    File_Uploading<T>,
    FileState.Finalized,
    T,
    {
        /**
         * The hash of this file.
         * This property is only set when the file is finalized.
         */
        fingerprint: string;
    }
>;

/**
 * This can be transitioned to from the finalized state.
 */
type File_Deleted<T extends FileStateExtensions> = OverrideFileState<
    File_Finalized<T>,
    FileState.Deleted,
    T,
    {
        /**
         * Time this document was deleted.
         */
        deletedAt: Date;
    }
>;

/**
 * This can be transitioned to from the created state.
 */
type File_Abandoned<T extends FileStateExtensions> = OverrideFileState<
    File_Finalized<T>,
    FileState.Abandoned,
    T,
    {
        /**
         * Time this document was abandoned.
         */
        abandonedAt: Date;
    }
>;

type File_General<T extends FileStateExtensions> =
    | File_Creating<T>
    | File_Created<T>
    | File_Uploading<T>
    | File_Failed<T>
    | File_Finalized<T>
    | File_Deleted<T>
    | File_Abandoned<T>;

/**
 * This interface describes a file.
 *
 * This contains basic metadata of a file.
 *
 * It does not contain the actual data of the file since the data is likely larger than size limit of a document in MongoDB.
 */
export interface File<T extends FileStateExtensions = {}> {
    general: File_General<T>;
    [FileState.Creating]: File_Creating<T>;
    [FileState.Created]: File_Created<T>;
    [FileState.Uploading]: File_Uploading<T>;
    [FileState.Failed]: File_Failed<T>;
    [FileState.Finalized]: File_Finalized<T>;
    [FileState.Deleted]: File_Deleted<T>;
    [FileState.Abandoned]: File_Abandoned<T>;
}

export type ExistingFile = File['created'] | File['uploading'] | File['failed'] | File['finalized'];

/**
 * This enum represents the state of a file.
 */
export enum FileState {
    /**
     * The file is being created. Records of this file are being created in the files and file-chunks collections. In this state, the properties of this file are not yet finalized.
     * Can transition to:
     * - created
     */
    Creating = 'creating',
    /**
     * The file has been created but not uploaded yet.
     * Can transition to:
     * - uploading
     * - abandoned
     */
    Created = 'created',
    /**
     * The file is being uploaded.
     * Can transition to:
     * - finalized
     * - failed
     * - abandoned
     */
    Uploading = 'uploading',
    /**
     * The file has failed to upload. It can be retried.
     * Can transition to:
     * - uploading
     * - abandoned
     */
    Failed = 'failed',
    /**
     * The file has been uploaded.
     * Can transition to:
     * - deleted
     */
    Finalized = 'finalized',
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

export const StateTransitions: { [S in FileState]: FileState[] } = {
    [FileState.Creating]: [FileState.Created],
    [FileState.Created]: [FileState.Uploading, FileState.Abandoned],
    [FileState.Uploading]: [FileState.Finalized, FileState.Failed, FileState.Abandoned],
    [FileState.Failed]: [FileState.Uploading, FileState.Abandoned],
    [FileState.Finalized]: [FileState.Deleted],
    [FileState.Deleted]: [],
    [FileState.Abandoned]: [],
};

export const StatesWhereFileDoesNotExist: FileState[] = [FileState.Creating, FileState.Deleted, FileState.Abandoned];
export const StatesWhereFileCanBeUploaded: FileState[] = [FileState.Created, FileState.Uploading, FileState.Failed];
export const StatesWhereFileIsAlreadyUploaded: FileState[] = [FileState.Finalized];
export const StatesWhereFileCanBeFinalized: FileState[] = [FileState.Uploading];
export const StatesWhereFileCanBeDeleted: FileState[] = [FileState.Finalized];

export const fileExists = (file: undefined | File['general']): file is ExistingFile =>
    typeof file !== 'undefined' && !StatesWhereFileDoesNotExist.includes(file.state);
