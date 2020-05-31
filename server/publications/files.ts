import { Meteor } from 'meteor/meteor';
import { Files } from '/imports/api/files';

/**
 * Publish all files for prototyping.
 */
Meteor.publish('proto-files', function() {
    return Files.find({}, { sort: [['createdAt', 'desc']] });
});
