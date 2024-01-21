import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createRoot } from 'react-dom/client';
import App from '/imports/ui/App';

Meteor.startup(() => {
    const container = document.getElementById('react-target');
    if (!container) {
        throw new Error('No react-target element found');
    }
    createRoot(container).render(<App />);
});
