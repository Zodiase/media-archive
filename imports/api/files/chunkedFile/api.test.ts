import { afterEach, describe, expect, it, test } from '@jest/globals';
import { v4 as uuid } from 'uuid';
import { Mongo as MockedMongo } from '/tests/__mocks__/meteor/mongo';
import { FileState } from '../abstractApi';
import { File, FileChunk, FileChunkState } from './api';
import { FileChunkSize } from './properties';
import { insertFile } from './api';
import { FileChunks, Files } from './collections';

describe('Files.chunkedFile.api', function() {
    describe('File interfaces', function() {
        it('has correct properties at various states', function() {
            let file: File['general'] = {
                version: 'chunked-file-v1',
                chunkSize: FileChunkSize,
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
                chunks: [
                    {
                        chunkId: 'chunkId',
                        start: 0,
                        state: FileChunkState.Created,
                        dataSize: 0,
                        fingerprint: 'fingerprint',
                    },
                ],
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

    describe('FileChunk interfaces', function() {
        it('has correct properties at various states', function() {
            let fileChunk: FileChunk = {
                state: FileChunkState.Created,
                fileId: 'fileId',
                start: 0,
                chunkSize: 0,
                dataSize: 0,
                createdAt: new Date(),
            };

            fileChunk = {
                ...fileChunk,
                state: FileChunkState.Uploading,
                lastUploadedAt: new Date(),
            };

            fileChunk = {
                ...fileChunk,
                state: FileChunkState.Failed,
            };

            fileChunk = {
                ...fileChunk,
                state: FileChunkState.Finalized,
                data: new Uint8Array(0),
                fingerprint: 'fingerprint',
            };
        });
    });

    describe('APIs', function() {
        const clearTestData = () => {
            ((Files as unknown) as ReturnType<typeof MockedMongo.Collection>)._clearMockData();
            ((FileChunks as unknown) as ReturnType<typeof MockedMongo.Collection>)._clearMockData();
        };

        describe('insertFile', function() {
            afterEach(function() {
                clearTestData();
            });

            test('insert file of size 0', function() {
                const fileId = insertFile({
                    requestId: uuid(),
                    name: 'name',
                    size: 0,
                    type: 'type',
                });
                expect(Files.insert).toBeCalledTimes(1);
                expect(FileChunks.insert).toBeCalledTimes(0);
            });

            test('insert file of some size smaller than chunk size', function() {
                const fileId = insertFile({
                    requestId: uuid(),
                    name: 'name',
                    size: FileChunkSize - 1,
                    type: 'type',
                });
                expect(Files.insert).toBeCalledTimes(1);
                expect(FileChunks.insert).toBeCalledTimes(1);
            });

            test('insert file of some size greater than chunk size', function() {
                const fileId = insertFile({
                    requestId: uuid(),
                    name: 'name',
                    size: FileChunkSize * 2 + 1,
                    type: 'type',
                });
                expect(Files.insert).toBeCalledTimes(1);
                expect(FileChunks.insert).toBeCalledTimes(3);
            });
        });
    });
});
