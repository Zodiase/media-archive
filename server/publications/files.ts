import { Meteor } from 'meteor/meteor';
import { Files } from '/imports/api/files/collections';

/**
 * Publish all files for prototyping.
 */
Meteor.publish('proto-files', function() {
    return Files.find({}, { sort: [['createdAt', 'desc']] });
});
