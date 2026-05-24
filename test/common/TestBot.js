const path = require('path');
const { Robot, TextMessage } = require('hubot');
const nock = require('nock');
const script = require('../../src/brightwheel');

class TestBotContext {
  constructor(robot, user) {
    this.robot = robot; this.user = user;
    this.sends = []; this.replies = [];
    this.robot.adapter.on('send', (_, strings) => {
      const value = strings.length === 1 && typeof strings[0] !== 'string' ? strings[0] : strings.join('\n');
      this.sends.push(value);
    });
    this.robot.adapter.on('reply', (_, strings) => {
      const value = strings.length === 1 && typeof strings[0] !== 'string' ? strings[0] : strings.join('\n');
      this.replies.push(value);
    });
    this.nock = nock;
  }

  async send(message) {
    const id = (Math.random() + 1).toString(36).substring(7);
    this.robot.adapter.receive(new TextMessage(this.user, message, id));
    await new Promise((done) => { setTimeout(done, 50); });
  }

  async sendAndWaitForResponse(message, responseType = 'send') {
    return new Promise((done) => {
      this.robot.adapter.once(responseType, (_, strings) => done(strings[0]));
      this.send(message);
    });
  }

  shutdown() {
    delete process.env.HUBOT_BRIGHTWHEEL_EMAIL;
    delete process.env.HUBOT_BRIGHTWHEEL_PASSWORD;
    delete process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT;
    nock.cleanAll();
    this.robot.shutdown();
  }
}

async function createTestBot(settings = {}) {
  process.env.HUBOT_LOG_LEVEL = 'silent';
  process.env.HUBOT_BRIGHTWHEEL_EMAIL = 'parent@example.org';
  process.env.HUBOT_BRIGHTWHEEL_PASSWORD = 'testing123';
  nock.cleanAll();
  nock.disableNetConnect();
  const robot = new Robot(path.resolve(__dirname, 'adapter'), false, 'hubot');
  await robot.loadAdapter(path.resolve(__dirname, 'adapter.js'));
  script(robot);
  return new Promise((done) => {
    robot.adapter.on('connected', () => {
      if (settings.adapterName) robot.adapterName = settings.adapterName;
      const user = robot.brain.userForId('1', { name: 'testuser', room: '#testroom' });
      done(new TestBotContext(robot, user));
    });
    robot.run();
  });
}

module.exports = { createTestBot, TestBotContext };
