# media-archive

[![CircleCI](https://circleci.com/gh/Zodiase/media-archive.svg?style=svg)](https://circleci.com/gh/Zodiase/media-archive)
[![Build Status](https://travis-ci.com/Zodiase/media-archive.svg?branch=master)](https://travis-ci.com/Zodiase/media-archive)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4e5315e3723649d58f8df54d5e77a09d)](https://app.codacy.com/manual/zodiase/media-archive?utm_source=github.com&utm_medium=referral&utm_content=Zodiase/media-archive&utm_campaign=Badge_Grade_Dashboard)
[![GuardRails badge](https://badges.guardrails.io/Zodiase/media-archive.svg?token=10cefad07b00ac917d8ba03cf0f46e72d95b0e2cdc200f52e510980b84dbd873&provider=github)](https://dashboard.guardrails.io/default/gh/Zodiase/media-archive)

## Testing

### Meteor tests

Tests running inside Meteor environment (from `meteor test`) are instrumented by `/tests/main.ts`. This is achieved by specifying `meteor.testModule`. This is done to stop `meteor test` from including other test files intended for Jest.

### Unit tests

All unit tests, tests next to the modules, use Jest.
