import { Meteor } from 'meteor/meteor';
import { Files, insertFile, uploadFileChunk, finalizeFileChunk, finalizeFile } from '/imports/api/files';
import './publications';
import { hashBinaryData } from '/imports/utility/collection';

function insertCompleteTextFile(name: string, data: string) {
    const { fileId, chunkIds, chunkSize } = insertFile({
        name,
        size: data.length,
        type: 'text/plain',
    });

    // Upload chunk data for each chunk.
    for (let i = 0; i < chunkIds.length; i++) {
        const chunkId = chunkIds[i];
        const start = i * chunkSize;
        const end = (i + 1) * chunkSize;
        const chunkData = data.slice(start, end);
        // Convert chunkData from string to Uint8Array.
        const chunkDataBytes = new TextEncoder().encode(chunkData);

        uploadFileChunk({
            fileId,
            index: i,
            chunkId,
            size: chunkData.length,
            data: chunkDataBytes,
        });
        finalizeFileChunk({
            fileId,
            index: i,
            chunkId,
            expectedHash: hashBinaryData(chunkDataBytes),
        });
    }

    finalizeFile({
        fileId,
        size: data.length,
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
