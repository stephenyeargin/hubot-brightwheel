# Hubot Brightwheel

[![npm version](https://badge.fury.io/js/hubot-brightwheel.svg)](https://badge.fury.io/js/hubot-brightwheel) [![Node CI](https://github.com/stephenyeargin/hubot-brightwheel/actions/workflows/nodejs.yml/badge.svg)](https://github.com/stephenyeargin/hubot-brightwheel/actions/workflows/nodejs.yml)

Show activity and photos from Brightwheel, a daycare management app.

## Installation

In hubot project repo, run:

`npm install hubot-brightwheel --save`

Then add **hubot-brightwheel** to your `external-scripts.json`:

```json
[
  "hubot-brightwheel"
]
```

## Configuration

Set these alongside your other Hubot environment variables.

- `HUBOT_BRIGHTWHEEL_EMAIL` - Email address for Brightwheel login (required)
- `HUBOT_BRIGHTWHEEL_PASSWORD` - Password for Brightwheel login. (required)
- `HUBOT_BRIGHTWHEEL_MAX_COUNT` - Maximum records to return. (default: 5)

## Sample Interaction

```
User> @hubot brightwheel
Hubot> Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM
Hubot> Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM
Hubot> Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM
Hubot> Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM
Hubot> Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM
```

## Available Command

### `hubot brightwheel`

Retrieves latest activity of any type.

### `hubot brightwheel photo`

Retrieves latest photos.

### `hubot brightwheel video`

Retrieves latest videos.

### `hubot brightwheel nap`

Retrieves latest nap status (started or stopped).

### `hubot brightwheel potty`

Retrieves latest potty reports.

### `hubot brightwheel food`

Retrieves latest food activities.

## NPM Module

https://www.npmjs.com/package/hubot-brightwheel
