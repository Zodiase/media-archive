/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.jest.json', // Point Jest to use the test-specific tsconfig
        },
    },
    testEnvironment: 'node',
    moduleNameMapper: {
        '^meteor/(.*)': '<rootDir>/__mocks__/meteor/$1',
        '^/(.*)': '<rootDir>/$1', // For absolute imports used in Meteor code.
    },
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
};
