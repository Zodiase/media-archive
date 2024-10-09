import * as CollectionExports from './collections';
import { Mongo } from 'meteor/mongo';
import { describe, expect, it } from '@jest/globals';

describe('Files collection', function() {
    //! The instanceof check doesn't work since we are mocking the Mongo.Collection.
    it.skip('should export Files and FileChunks collections', function() {
        const { Files, FileChunks } = CollectionExports;
        expect(Files).toBeInstanceOf(Mongo.Collection);
        expect(FileChunks).toBeInstanceOf(Mongo.Collection);
    });
});
