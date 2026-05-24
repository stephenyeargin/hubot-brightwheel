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

describe('hubot-brightwheel for Slack', () => {
  let bot;

  before(async () => {
    process.env.TZ = 'America/Chicago';
    process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT = '1';
    bot = await createTestBot({ adapterName: 'slack' });
  });

  after(() => {
    delete process.env.TZ;
    delete process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT;
    bot.shutdown();
  });

  test('gets most recent photo activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_photo' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-photo.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel photo');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Linda Reid',
            fallback: 'Jenny was in a photo. - https://github.com/github.png',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            image_url: 'https://github.com/github.png',
            text: 'Riding the tricycle today🤩',
            thumb_url: 'https://github.com/github.png',
            title: 'Jenny was in a photo.',
            title_link: 'https://github.com/github.png',
            ts: '1626792906',
          },
        ],
      },
    ]);
  });

  test('gets most recent video activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_video' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-video.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel video');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Linda Reid',
            fallback: 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/1-download.mp4',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            image_url: 'https://cdn.mybrightwheel.com/videos/1-thumbnail.0000000.jpg',
            text: 'Water play🤩',
            thumb_url: 'https://cdn.mybrightwheel.com/videos/1-thumbnail.0000000.jpg',
            title: 'Jenny was in a video.',
            title_link: 'https://cdn.mybrightwheel.com/videos/1-download.mp4',
            ts: '1626445670',
          },
        ],
      },
    ]);
  });

  test('gets most recent potty activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_potty' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-potty.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel potty');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Linda Reid',
            fallback: 'Jenny went potty. (diaper - wet)',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            text: 'diaper - wet',
            title: 'Jenny went potty.',
            ts: '1626897830',
          },
        ],
      },
    ]);
  });

  test('gets most recent nap activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_nap' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-nap.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel nap');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Mary Reed',
            fallback: 'Jenny ended a nap.',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            title: 'Jenny ended a nap.',
            text: null,
            ts: '1626893483',
          },
        ],
      },
    ]);
  });

  test('gets most recent food activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_food' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-food.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel food');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Linda Reid',
            fallback: 'Jenny ate gold fish, raisins and h20.',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            text: 'gold fish, raisins and h20',
            title: 'Jenny ate.',
            ts: '1626897952',
          },
        ],
      },
    ]);
  });

  test('gets most recent kudo activities', async () => {
    setupCommonNocks();
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({ page_size: '1', action_type: 'ac_kudo' })
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, `${FIXTURES}/activities-kudo.json`, { 'Content-type': 'application/json' });

    bot.sends = [];
    await bot.send('hubot brightwheel kudo');

    assert.deepEqual(bot.sends, [
      {
        attachments: [
          {
            author_name: 'Mary Reed',
            fallback: 'Jenny received kudos.',
            footer: 'Brightwheel',
            footer_icon: 'https://github.com/brightwheel.png',
            text: "Today Jenny rode the tricycle around the playground and didn't fall off!",
            title: 'Jenny received kudos.',
            ts: '1633019580',
          },
        ],
      },
    ]);
  });
});
