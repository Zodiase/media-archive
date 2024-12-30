/**
 * This file defines the methods for every file API.
 */

import { Meteor } from 'meteor/meteor';
import { insertFile, uploadFile, finalizeFile } from './chunkedFile/api';

Meteor.methods({
    insertFile,
    uploadFile,
    finalizeFile,
});
