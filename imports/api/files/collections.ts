import { Mongo } from 'meteor/mongo';
import { File, FileChunk } from './chunkedFile';
import { InStorage } from '/imports/utility/collection';

export const Files = new Mongo.Collection<InStorage<File>>('files');
export const FileChunks = new Mongo.Collection<InStorage<FileChunk>>('file-chunks');
