Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  './adapters/slack.coffee'
  '../src/brightwheel.coffee'
]

describe 'hubot-brightwheel for Slack', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.TZ = 'America/Chicago'
    process.env.HUBOT_BRIGHTWHEEL_EMAIL='parent@example.org'
    process.env.HUBOT_BRIGHTWHEEL_PASSWORD='testing123'
    process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT='1'
    nock.disableNetConnect()
    @room = helper.createRoom()
    nock('https://schools.mybrightwheel.com')
      .post('/api/v1/sessions', {user: {email: 'parent@example.org', password: 'testing123'}})
      .reply(201, {success: true}, {'set-cookie': '_brightwheel_v2=thelongauthstring; domain=.mybrightwheel.com; path=/; expires=Fri, 29 Oct 2021 21:30:10 -0000; secure; HttpOnly; SameSite=Lax'})
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/users/me')
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/users-me.json', {'Content-type': 'application/json'})
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/guardians/cf19adc5-947d-4ebc-89ac-b364e0644a8a/students')
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/students.json', {'Content-type': 'application/json'})

  afterEach ->
    delete process.env.HUBOT_LOG_LEVEL
    delete process.env.TZ
    delete process.env.HUBOT_BRIGHTWHEEL_EMAIL
    delete process.env.HUBOT_BRIGHTWHEEL_PASSWORD
    delete process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT
    nock.cleanAll()
    @room.destroy()

  it 'gets most recent photo activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 1, action_type: 'ac_photo'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-photo.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel photo')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel photo']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "Linda Reid"
                  "fallback": "Jenny was in a photo. - https://github.com/github.png"
                  "footer": "Brightwheel"
                  "footer_icon": "https://github.com/brightwheel.png"
                  "image_url": "https://github.com/github.png"
                  "text": "Riding the tricycle today🤩"
                  "thumb_url": "https://github.com/github.png"
                  "title": "Jenny was in a photo."
                  "title_link": "https://github.com/github.png"
                  "ts": "1626792906"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent video activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 1, action_type: 'ac_video'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-video.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel video')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel video']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "Linda Reid"
                  "fallback": "Jenny was in a video. - https://cdn.mybrightwheel.com/videos/1-download.mp4"
                  "footer": "Brightwheel"
                  "footer_icon": "https://github.com/brightwheel.png"
                  "image_url": "https://cdn.mybrightwheel.com/videos/1-thumbnail.0000000.jpg"
                  "text": "Water play🤩"
                  "thumb_url": "https://cdn.mybrightwheel.com/videos/1-thumbnail.0000000.jpg"
                  "title":  "Jenny was in a video."
                  "title_link": "https://cdn.mybrightwheel.com/videos/1-download.mp4"
                  "ts": "1626445670"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent potty activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 1, action_type: 'ac_potty'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-potty.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel potty')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel potty']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "Linda Reid"
                  "fallback": "Jenny went potty. (diaper - wet)"
                  "footer": "Brightwheel"
                  "footer_icon": "https://github.com/brightwheel.png"
                  "text": "diaper - wet"
                  "title": "Jenny went potty."
                  "ts": "1626897830"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent nap activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 1, action_type: 'ac_nap'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-nap.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel nap')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel nap']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "Mary Reed"
                  "fallback": "Jenny ended a nap."
                  "footer": "Brightwheel"
                  "footer_icon": "https://github.com/brightwheel.png"
                  "title": "Jenny ended a nap."
                  "ts": "1626893483"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent food activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 1, action_type: 'ac_food'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-food.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel food')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel food']
          [
            'hubot',
            {
              "attachments": [
                {
                  "author_name": "Linda Reid"
                  "fallback": "Jenny ate gold fish, raisins and h20."
                  "footer": "Brightwheel"
                  "footer_icon": "https://github.com/brightwheel.png"
                  "text": "gold fish, raisins and h20"
                  "title": "Jenny ate."
                  "ts": "1626897952"
                }
              ]
            }
          ]
        ]
        done()
      catch err
        done err
      return
    , 1000)
