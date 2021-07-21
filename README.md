# Hubot Brightwheel

Show activity and photos from Brightwheel, a daycare management app.

See [`src/brightwheel.coffee`](src/brightwheel.coffee) for full documentation.

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

- `HUBOT_BRIGHTWHEEL_EMAIL` - Email address Brightwheel for login (required)
- `HUBOT_BRIGHTWHEEL_PASSWORD` - Password for Brightwheel login. (required)
- `HUBOT_BRIGHTWHEEL_MAX_COUNT` - Maximum records to return (default: 5)

## Sample Interactions

```
User> @hubot brightwheel
Hubot> Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM
Hubot> Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM
Hubot> Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM
Hubot> Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM
Hubot> Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM
```

## NPM Module

https://www.npmjs.com/package/hubot-brightwheel
