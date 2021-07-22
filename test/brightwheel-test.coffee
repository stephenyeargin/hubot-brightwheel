Helper = require('hubot-test-helper')
chai = require 'chai'
nock = require 'nock'

expect = chai.expect

helper = new Helper [
  '../src/brightwheel.coffee'
]

describe 'hubot-brightwheel', ->
  beforeEach ->
    process.env.HUBOT_LOG_LEVEL='error'
    process.env.TZ = 'America/Chicago'
    process.env.HUBOT_BRIGHTWHEEL_EMAIL='parent@example.org'
    process.env.HUBOT_BRIGHTWHEEL_PASSWORD='testing123'
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
    nock.cleanAll()
    @room.destroy()

  it 'gets most recent activities of any type', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: "5"})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel']
          ['hubot', 'Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM']
          ['hubot', 'Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM']
          ['hubot', 'Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM']
          ['hubot', 'Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM']
          ['hubot', 'Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets an empty activity list', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: "5"})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-empty.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel']
          ['hubot', 'No activities available.']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent photo activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 5, action_type: 'ac_photo'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-photo.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel photo')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel photo']
          ['hubot', 'Jenny was in a photo. - https://github.com/github.png - Riding the tricycle today🤩 | Jul 20, 2021 9:55 AM']
          ['hubot', 'Jenny was in a photo. - https://github.com/github.png | Jul 16, 2021 9:35 AM']
          ['hubot', 'Jenny was in a photo. - https://github.com/github.png | Jun 29, 2021 9:23 AM']
          ['hubot', 'Jenny was in a photo. - https://github.com/github.png | Jun 28, 2021 11:43 AM']
          ['hubot', 'Jenny was in a photo. - https://github.com/github.png | Jun 23, 2021 10:41 AM']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent video activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 5, action_type: 'ac_video'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-video.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel video')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel video']
          ['hubot', 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/1-download.mp4 - Water play🤩 | Jul 16, 2021 9:27 AM']
          ['hubot', 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/2-download.mp4 - 🤩 | Jul 9, 2021 9:54 AM']
          ['hubot', 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/3-download.mp4 - Water play🤩 | Jul 9, 2021 9:43 AM']
          ['hubot', 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/4-download.mp4 - Jenny uses her gross motor skills and coordination to take a few steps!! Good job Jenny🤩 | Jul 6, 2021 8:51 AM']
          ['hubot', 'Jenny was in a video. - https://cdn.mybrightwheel.com/videos/5-download.mp4 | May 19, 2021 5:23 PM']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent potty activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 5, action_type: 'ac_potty'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-potty.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel potty')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel potty']
          ['hubot', 'Jenny went potty. (diaper - wet) | Jul 21, 2021 3:03 PM']
          ['hubot', 'Jenny went potty. (diaper - bm) | Jul 21, 2021 11:29 AM']
          ['hubot', 'Jenny went potty. (diaper - wet) | Jul 21, 2021 10:49 AM']
          ['hubot', 'Jenny went potty. (diaper - nothing) | Jul 21, 2021 9:23 AM']
          ['hubot', 'Jenny went potty. (diaper - wet) | Jul 20, 2021 4:18 PM']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent nap activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 5, action_type: 'ac_nap'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-nap.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel nap')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel nap']
          ['hubot', 'Jenny ended a nap. | Jul 21, 2021 1:51 PM']
          ['hubot', 'Jenny started a nap. | Jul 21, 2021 12:17 PM']
          ['hubot', 'Jenny ended a nap. | Jul 20, 2021 2:37 PM']
          ['hubot', 'Jenny started a nap. | Jul 20, 2021 12:29 PM']
          ['hubot', 'Jenny ended a nap. | Jul 19, 2021 2:31 PM']
        ]
        done()
      catch err
        done err
      return
    , 1000)

  it 'gets most recent food activities', (done) ->
    nock('https://schools.mybrightwheel.com')
      .get('/api/v1/students/778d7815-7293-4aa5-85e3-f0fe08159ae2/activities')
      .query({page_size: 5, action_type: 'ac_food'})
      .matchHeader('cookie', '_brightwheel_v2=thelongauthstring')
      .replyWithFile(200, __dirname + '/fixtures/activities-food.json', {'Content-type': 'application/json'})

    selfRoom = @room
    selfRoom.user.say('alice', '@hubot brightwheel food')
    setTimeout(() ->
      try
        expect(selfRoom.messages).to.eql [
          ['alice', '@hubot brightwheel food']
          ['hubot', 'Jenny ate gold fish, raisins and h20. | Jul 21, 2021 3:05 PM']
          ['hubot', 'Jenny ate chicken noodle soup, cucumber slices, grilled cheese, milk. | Jul 21, 2021 11:30 AM']
          ['hubot', 'Jenny ate cheerios, milk. | Jul 21, 2021 9:07 AM']
          ['hubot', 'Jenny ate cheese cubes, raspberries, water. | Jul 20, 2021 3:12 PM']
          ['hubot', 'Jenny ate diced pears, mac and cheese, milk, salad. | Jul 20, 2021 11:32 AM']
        ]
        done()
      catch err
        done err
      return
    , 1000)
