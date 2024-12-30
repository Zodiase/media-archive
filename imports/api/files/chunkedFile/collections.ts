import { File, FileChunk } from './api';
import { defineMongoCollection } from '/imports/utility/collection';

export const Files = defineMongoCollection<File['general']>('files');
export const FileChunks = defineMongoCollection<FileChunk['general']>('file-chunks');
