import { Meteor } from 'meteor/meteor';
import { Files } from '/imports/api/files';
import './publications';

function insertFile(name: string) {
    const now = new Date();

    Files.insert({
        name,
        size: 0,
        type: '',
        createdAt: now,
        modifiedAt: now,
        chunks: [],
        chunkSize: 15 * 1024 * 1024,
        lastModified: now.valueOf(),
    });
}

Meteor.startup(() => {
    // If the Links collection is empty, add some data.
    if (Files.find().count() === 0) {
        insertFile('Do the Tutorial');

        insertFile('Follow the Guide');

        insertFile('Read the Docs');

        insertFile('Discussions');
    }
});
