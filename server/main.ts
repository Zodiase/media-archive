import { Meteor } from 'meteor/meteor';
import { v4 as uuid } from 'uuid';
import { Files, insertFile, uploadFile, finalizeFile } from '/imports/api/files';
import './publications';
import { FileChunkSize } from '/imports/api/files/chunkedFile/properties';
import { DiagnosticContext, log } from '/imports/utility/diagnosticContext';

async function insertCompleteTextFile(name: string, data: string) {
    log('Inserting file:', name);

    const { fileId } = await insertFile({
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

        const { fingerprint } = await uploadFile({
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

    log('Inserted file:', name);
}

Meteor.startup(async () => {
    await DiagnosticContext.wrap('server', async () => {
        // If the Links collection is empty, add some data.
        if ((await Files.find().countAsync()) === 0) {
            await insertCompleteTextFile('Tutorial.md', '# Tutorial\n\nThis is a tutorial.');

            await insertCompleteTextFile('Guide.md', '# Guide\n\nThis is a guide.');

            await insertCompleteTextFile('Docs.md', '# Docs\n\nThis is a documentation.');

            await insertCompleteTextFile('Discussions.md', '# Discussions\n\nThis is a discussion.');
        }
    });
});
