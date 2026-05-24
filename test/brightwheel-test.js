const {
  test, before, after, describe,
} = require('node:test');
const assert = require('node:assert/strict');
const nock = require('nock');
const path = require('path');
const { createTestBot } = require('./common/TestBot');

const FIXTURES = path.join(__dirname, 'fixtures');

function setupCommonNocks() {
  nock('https://schools.mybrightwheel.com')
    .post('/api/v1/sessions', { user: { email: 'parent@example.org', password: 'testing123' } })
    .reply(201, { success: true }, { 'set-cookie': '_brightwheel_v2=thelongauthstring; domain=.mybrightwheel.com; path=/; expires=Fri, 29 Oct 2021 21:30:10 -0000; secure; HttpOnly; SameSite=Lax' });
  nock('https://schools.mybrightwheel.com')
    .get('/api/v1/users/me')
    .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
    .replyWithFile(200, `${FIXTURES}/users-me.json`, { 'Content-type': 'application/json' });
  nock('https://schools.mybrightwheel.com')
    .get('/api/v1/guardians/cf19adc5-947d-4ebc-89ac-b364e0644a8a/students')
    .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
    .replyWithFile(200, `${FIXTURES}/students.json`, { 'Content-type': 'application/json' });
}

describe('hubot-brightwheel', () => {
  let bot;

  before(async () => {
    process.env.TZ = 'America/Chicago';
    bot = await createTestBot();
  });

  after(() => {
    delete process.env.TZ;
    bot.shutdown();
  });

  test('gets most recent activities of any type', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel');

    assert.deepEqual(bot.sends, [
      'Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM',
      'Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM',
      'Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM',
      'Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM',
      'Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM',
    ]);
  });

  test('gets an empty activity list', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-empty.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel');

    assert.deepEqual(bot.sends, ['No activities available.']);
  });

  test('gets most recent checkin activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_checkin' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-checkin.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel checkin');

    assert.deepEqual(bot.sends, [
      'Jenny was checked out. | Feb 17, 2022 2:32 PM',
      'Jenny was checked in. | Feb 17, 2022 8:12 AM',
      'Jenny was checked out. | Feb 16, 2022 5:01 PM',
      'Jenny was checked in. | Feb 16, 2022 8:11 AM',
      'Jenny was checked out. | Feb 15, 2022 5:01 PM',
    ]);
  });

  test('gets most recent photo activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_photo' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-photo.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel photo');

    assert.deepEqual(bot.sends, [
      'Jenny was in a photo. - https://github.com/github.png - Riding the tricycle today🤩 | Jul 20, 2021 9:55 AM',
      'Jenny was in a photo. - https://github.com/github.png | Jul 16, 2021 9:35 AM',
      'Jenny was in a photo. - https://github.com/github.png | Jun 29, 2021 9:23 AM',
      'Jenny was in a photo. - https://github.com/github.png | Jun 28, 2021 11:43 AM',
      'Jenny was in a photo. - https://github.com/github.png | Jun 23, 2021 10:41 AM',
    ]);
  });

  test('gets most recent video activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_video' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-video.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel video');

    assert.deepEqual(bot.sends, [
      'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/1-download.mp4 - Water play🤩 | Jul 16, 2021 9:27 AM',
      'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/2-download.mp4 - 🤩 | Jul 9, 2021 9:54 AM',
      'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/3-download.mp4 - Water play🤩 | Jul 9, 2021 9:43 AM',
      'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/4-download.mp4 - Jenny uses her gross motor skills and coordination to take a few steps!! Good job Jenny🤩 | Jul 6, 2021 8:51 AM',
      'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/5-download.mp4 | May 19, 2021 5:23 PM',
    ]);
  });

  test('gets most recent potty activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_potty' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-potty.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel potty');

    assert.deepEqual(bot.sends, [
      'Jenny went potty. (diaper - wet) | Jul 21, 2021 3:03 PM',
      'Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM',
      'Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM',
      'Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM',
      'Jenny went potty. (diaper - wet) | Jul 20, 2021 4:18 PM',
    ]);
  });

  test('gets most recent nap activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_nap' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-nap.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel nap');

    assert.deepEqual(bot.sends, [
      'Jenny ended a nap. | Jul 21, 2021 1:51 PM',
      'Jenny started a nap. | Jul 21, 2021 12:17 PM',
      'Jenny ended a nap. | Jul 20, 2021 2:37 PM',
      'Jenny started a nap. | Jul 20, 2021 12:29 PM',
      'Jenny ended a nap. | Jul 19, 2021 2:31 PM',
    ]);
  });

  test('gets most recent food activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_food' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-food.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel food');

    assert.deepEqual(bot.sends, [
      'Jenny ate gold fish, raisins and h20. | Jul 21, 2021 3:05 PM',
      'Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM',
      'Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM',
      'Jenny ate cheese cubes, raspberries, water. | Jul 20, 2021 3:12 PM',
      'Jenny ate diced pears, mac and cheese, milk, salad. | Jul 20, 2021 11:32 AM',
    ]);
  });

  test('gets most recent kudo activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '5', action_type: 'ac_kudo' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-kudo.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel kudo');

    assert.deepEqual(bot.sends, [
      "Jenny received kudos. - Today Jenny rode the tricycle around the playground and didn't fall off! | Sep 30, 2021 11:33 AM",
    ]);
  });
});

describe('hubot-brightwheel login failure', () => {
  let bot;

  before(async () => {
    process.env.TZ = 'America/Chicago';
    bot = await createTestBot();
  });

  after(() => {
    delete process.env.TZ;
    bot.shutdown();
  });

  test('returns a login failure message', async () => {
    nock('https://schools.mybrightwheel.com')
      .post('/api/v1/sessions', { user: { email: 'parent@example.org', password: 'testing123' } })
      .replyWithFile(200, `${FIXTURES}/login-failure.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel');

    assert.deepEqual(bot.sends, ['User is invalid: You must specify the user [E1205]']);
  });
});
