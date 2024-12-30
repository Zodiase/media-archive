import { expect } from 'expect';
import {
    DeleteFile,
    File,
    FileState,
    FinalizeFile,
    InsertFile,
    StatesWhereFileCanBeDeleted,
    StatesWhereFileCanBeFinalized,
    StatesWhereFileCanBeUploaded,
    StatesWhereFileDoesNotExist,
    StatesWhereFileIsAlreadyUploaded,
    StateTransitions,
    UploadFile,
} from './abstractApi';

describe('Files.abstractApi', function() {
    describe('FileState', function() {
        it('has all file states', function() {
            const states = Object.values(FileState);
            expect(states).toContain('creating');
            expect(states).toContain('created');
            expect(states).toContain('uploading');
            expect(states).toContain('failed');
            expect(states).toContain('finalized');
            expect(states).toContain('deleted');
            expect(states).toContain('abandoned');
        });

        it('has correct state transitions', async function() {
            const transitions = {
                creating: ['created'],
                created: ['uploading', 'abandoned'],
                uploading: ['finalized', 'failed', 'abandoned'],
                failed: ['uploading', 'abandoned'],
                finalized: ['deleted'],
                deleted: [],
                abandoned: [],
            };
            for (const state of Object.values(FileState)) {
                expect(StateTransitions[state]).toEqual(transitions[state]);
            }
        });
    });

    describe('FileState constraints', function() {
        it('has correct constraints', function() {
            expect(StatesWhereFileDoesNotExist).toEqual(['creating', 'deleted', 'abandoned']);
            expect(StatesWhereFileCanBeUploaded).toEqual(['created', 'uploading', 'failed']);
            expect(StatesWhereFileIsAlreadyUploaded).toEqual(['finalized']);
            expect(StatesWhereFileCanBeFinalized).toEqual(['uploading']);
            expect(StatesWhereFileCanBeDeleted).toEqual(['finalized']);
        });
    });

    describe('public interfaces', function() {
        it('exports insert file API', function() {
            const insertFile: InsertFile = async ({ requestId }) => {
                return { requestId, fileId: 'fileId' };
            };
            insertFile({ requestId: 'requestId', name: 'name', size: 0, type: 'type' });
        });

        it('exports upload file API', function() {
            const uploadFile: UploadFile = async (request) => {
                return { fingerprint: 'fingerprint', size: 0 };
            };
            uploadFile({ fileId: 'fileId', start: 0, size: 0, data: new Uint8Array(0) });
        });

        it('exports finalize file API', function() {
            const finalizeFile: FinalizeFile = async (request) => {
                return { fileId: 'fileId', fingerprint: 'fingerprint', size: 0 };
            };
            finalizeFile({ fileId: 'fileId', size: 0, fingerprint: 'fingerprint' });
        });

        it('exports delete file API', function() {
            const deleteFile: DeleteFile = async (request) => {
                return { fileId: 'fileId', fingerprint: 'fingerprint', size: 0 };
            };
            deleteFile({ fileId: 'fileId', size: 0, fingerprint: 'fingerprint' });
        });
    });

    describe('File interface', function() {
        it('has correct properties at various states', function() {
            // Creating a file
            let file: File['general'] = {
                state: FileState.Creating,
                name: 'name',
                size: 0,
                type: 'type',
                createdAt: new Date(),
            };

            file = {
                ...file,
                state: FileState.Created,
                modifiedAt: new Date(),
            };

            file = {
                ...file,
                state: FileState.Uploading,
            };

            file = {
                ...file,
                state: FileState.Failed,
            };

            file = {
                ...file,
                state: FileState.Finalized,
                fingerprint: 'fingerprint',
            };

            const deletedFile: File['deleted'] = {
                ...file,
                state: FileState.Deleted,
                deletedAt: new Date(),
            };

            const abandonedFile: File['abandoned'] = {
                ...file,
                state: FileState.Abandoned,
                abandonedAt: new Date(),
            };
        });
    });
});
