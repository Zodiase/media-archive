import { Mongo } from 'meteor/mongo';
import { File, FileChunk } from './api';
import { InStorage } from '/imports/utility/collection';

export const Files = new Mongo.Collection<InStorage<File['general']>>('files');
export const FileChunks = new Mongo.Collection<InStorage<FileChunk['general']>>('file-chunks');
