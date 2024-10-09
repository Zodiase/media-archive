import { Meteor } from 'meteor/meteor';
import { v4 as uuid } from 'uuid';
import { Files, insertFile, uploadFile, finalizeFile } from '/imports/api/files';
import './publications';
import { FileChunkSize } from '/imports/api/files/chunkedFile/properties';

function insertCompleteTextFile(name: string, data: string) {
    const { fileId } = insertFile({
        requestId: uuid(),
        name,
        size: data.length,
        type: 'text/plain',
    });

    const fingerprints = [];

    // Upload chunk data for each chunk.
    for (let i = 0; i < data.length; i += FileChunkSize) {
        const start = i;
        const end = i + FileChunkSize;
        const chunkData = data.slice(start, end);
        // Convert chunkData from string to Uint8Array.
        const chunkDataBytes = new TextEncoder().encode(chunkData);

        const { fingerprint } = uploadFile({
            fileId,
            start,
            size: chunkData.length,
            data: chunkDataBytes,
        });
        fingerprints.push(fingerprint);
    }

    finalizeFile({
        fileId,
        size: data.length,
        fingerprint: fingerprints.join(':'),
    });
}

Meteor.startup(() => {
    // If the Links collection is empty, add some data.
    if (Files.find().count() === 0) {
        insertCompleteTextFile('Tutorial.md', '# Tutorial\n\nThis is a tutorial.');

        insertCompleteTextFile('Guide.md', '# Guide\n\nThis is a guide.');

        insertCompleteTextFile('Docs.md', '# Docs\n\nThis is a documentation.');

        insertCompleteTextFile('Discussions.md', '# Discussions\n\nThis is a discussion.');
    }
});
