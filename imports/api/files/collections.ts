import { Mongo } from 'meteor/mongo';
import { File } from './file';
import { FileChunk } from './fileChunk';

export const Files = new Mongo.Collection<File>('files');
export const FileChunks = new Mongo.Collection<FileChunk>('file-chunks');
