/**
 * This is a mock for Meteor Mongo Collection so we can test our code without a real database.
 *
 * Existing challenges:
 * 1. As the product code checks the api call results more strictly, we need to implement the mock with higher fidelity.
 *    The current implementation only fakes the results and doesn't actually correctly respond to the input.
 */

import { fn } from 'jest-mock';
import { v4 as uuid } from 'uuid';
import { ms } from '/imports/utility/awaitDuration';

export const Mongo = {
    Collection: fn(function() {
        let mockCollectionData: Record<string, any> = {};

        return {
            _clearMockData() {
                mockCollectionData = {};
                this.insertAsync.mockClear();
                this.find.mockClear();
                this.findOneAsync.mockClear();
                this.updateAsync.mockClear();
                this.removeAsync.mockClear();
            },
            insertAsync: fn().mockImplementation(async (data: any) => {
                await ms(0);
                const id = uuid();
                mockCollectionData[id] = { ...data, _id: id };
                return id;
            }),
            find: fn(),
            findOneAsync: fn().mockImplementation(async (docId: any) => {
                await ms(0);
                return mockCollectionData[docId];
            }),
            updateAsync: fn().mockImplementation(
                async (): Promise<number> => {
                    await ms(0);
                    return 1;
                },
            ),
            removeAsync: fn().mockImplementation(
                async (docId: any): Promise<number> => {
                    await ms(0);
                    if (docId in mockCollectionData) {
                        delete mockCollectionData[docId];
                        return 1;
                    } else {
                        return 0;
                    }
                },
            ),
        };
    }),
};
