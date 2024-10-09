import { jest } from '@jest/globals';
import { v4 as uuid } from 'uuid';

export const Mongo = {
    Collection: jest.fn(function() {
        let mockCollectionData: Record<string, any> = {};

        return {
            _clearMockData() {
                mockCollectionData = {};
                this.insert.mockClear();
                this.find.mockClear();
                this.findOne.mockClear();
                this.update.mockClear();
                this.remove.mockClear();
            },
            insert: jest.fn().mockImplementation((data: any) => {
                const id = uuid();
                mockCollectionData[id] = { ...data, _id: id };
                return id;
            }),
            find: jest.fn(),
            findOne: jest.fn().mockImplementation((docId: any) => {
                return mockCollectionData[docId];
            }),
            update: jest.fn(),
            remove: jest.fn().mockImplementation((docId: any) => {
                delete mockCollectionData[docId];
            }),
        };
    }),
};
