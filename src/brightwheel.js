// Description
//   Show activity and photos from Brightwheel, a daycare management app.
//
// Configuration:
//   HUBOT_BRIGHTWHEEL_EMAIL - Email address Brightwheel for login
//   HUBOT_BRIGHTWHEEL_PASSWORD - Password for Brightwheel login.
//   HUBOT_BRIGHTWHEEL_MAX_COUNT - Maximum records to return (default: 5)
//
// Commands:
//   hubot brightwheel - Show the latest activities.
//   hubot brightwheel <checkin|photo|video|potty|nap|food> - Show activities of a specific type.
//
// Author:
//   stephenyeargin
const moment = require('moment-timezone');

module.exports = (robot) => {
  const baseEndpoint = 'https://schools.mybrightwheel.com/api/v1';
  const baseHeaders = {
    Accept: 'application/json',
    'Content-type': 'application/json',
    'X-Client-Name': 'web',
    'X-Client-Version': 'b15cec31e66fa803de35b53260872aa7e5e84e29',
  };
  const maxRecordCount = parseInt(process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT, 10) || 5;
  const username = process.env.HUBOT_BRIGHTWHEEL_EMAIL;
  const password = process.env.HUBOT_BRIGHTWHEEL_PASSWORD;
  let auth = false;

  // Helper Methods
  const tap = (o, fn) => { fn(o); return o; };

  const merge = (...xs) => {
    if ((xs != null ? xs.length : undefined) > 0) {
      return tap({}, (m) => Array.from(xs).map((x) => (() => {
        const result = [];
        for (const k in x) {
          const v = x[k];
          result.push(m[k] = v);
        }
        return result;
      })()));
    }
  };

  const formatActivity = (activity) => {
    let item;
    let output;
    let textOutput = '';
    let slackOutput = {};
    const slackAttachmentTemplate = {
      title: 'Activity',
      text: null,
      footer: 'Brightwheel',
      footer_icon: 'https://github.com/brightwheel.png',
      author_name: `${activity.actor.first_name} ${activity.actor.last_name}`,
      ts: moment(activity.event_date).format('X'),
    };
    textOutput += `${activity.target.first_name}`;
    const foods = [];
    let details;
    switch (activity.action_type) {
      case 'ac_checkin':
        textOutput += ` was checked ${activity.state === '1' ? 'in' : 'out'}.`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} was checked ${activity.state === '1' ? 'in' : 'out'}.`,
        });
        break;
      case 'ac_photo':
        textOutput += ` was in a photo. - ${activity.media.image_url}`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} was in a photo.`,
        });
        break;
      case 'ac_video':
        textOutput += ` was in a video. - ${activity.video_info.downloadable_url}`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} was in a video.`,
        });
        break;
      case 'ac_potty':
        textOutput += ` went potty. (${activity.details_blob.potty_type} - ${activity.details_blob.potty_extras.join(', ')})`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} went potty.`,
          text: `${activity.details_blob.potty_type} - ${activity.details_blob.potty_extras.join(', ')}`,
        });
        break;
      case 'ac_nap':
        textOutput += ` ${activity.state === '1' ? 'started' : 'ended'} a nap.`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} ${activity.state === '1' ? 'started' : 'ended'} a nap.`,
        });
        break;
      case 'ac_food':
        for (item of Array.from(activity.menu_item_tags)) {
          foods.push(item.name);
        }
        details = foods.join(', ');
        if (item.notes) {
          details += ` (${item.notes})`;
        }
        textOutput += ` ate ${details}.`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} ate.`,
          text: `${details}`,
        });
        break;
      case 'ac_kudo':
        textOutput += ' received kudos.';
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} received kudos.`,
        });
        break;
      default:
        // Catch-all for things we don't know how to handle
        textOutput += ` - ${activity.action_type.replace('ac_', '')}`;
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: `${activity.target.first_name} - ${activity.action_type.replace('ac_', '')}`,
        });
    }
    const eventTime = moment(activity.event_date);
    if (activity.note) {
      textOutput += ` - ${activity.note}`;
      slackOutput.text = [activity.note, slackOutput.text].join('\n').trim();
    }
    if ((activity.media != null) && (activity.media.image_url != null)) {
      slackOutput.title_link = activity.media.image_url;
      slackOutput.image_url = activity.media.image_url;
      slackOutput.thumb_url = activity.media.thumbnail_url;
    }
    if ((activity.video_info != null) && (activity.video_info.downloadable_url != null)) {
      slackOutput.title_link = activity.video_info.downloadable_url;
      slackOutput.image_url = activity.video_info.thumbnail_url;
      slackOutput.thumb_url = activity.video_info.thumbnail_url;
    }

    textOutput += ` | ${eventTime.format('lll')}`;

    switch (robot.adapterName) {
      case 'slack':
        output = { attachments: [slackOutput] };
        break;
      default:
        output = textOutput;
    }

    return output;
  };

  const authenticate = () => new Promise((resolve, reject) => {
    if (auth) {
      resolve(auth);
      return;
    }
    const credentials = JSON.stringify({ user: { email: username, password } });
    robot.http(`${baseEndpoint}/sessions`)
      .headers(baseHeaders)
      .post(credentials)((err, res, body) => {
        if (err) {
          robot.logger.error(err);
          reject(err);
          return;
        }
        if (res.statusCode !== 201) {
          robot.logger.error(body);
          reject(body);
          return;
        }
        robot.logger.debug(res);
        robot.logger.debug(body);
        // eslint-disable-next-line prefer-destructuring
        auth = res.headers['set-cookie'][0].split('; ')[0];
        baseHeaders.Cookie = auth;
        resolve(auth);
      });
  });

  const makeRequest = (endpoint, params = {}) => new Promise((resolve, reject) => {
    authenticate()
      .then(() => robot.http(`${baseEndpoint}/${endpoint}`)
        .headers(baseHeaders)
        .query(params)
        .get()((err, res, body) => {
          robot.logger.debug(body);
          if (err) {
            robot.logger.error(err);
            reject(err);
          }
          resolve(JSON.parse(body));
        })).catch((err) => reject(err));
  });
  const getStudents = () => makeRequest('users/me')
    .then((data) => {
      robot.logger.debug(data);
      return makeRequest(`guardians/${data.object_id}/students`)
        .then((students) => {
          robot.logger.debug(students);
          return students;
        });
    });

  const getActivities = (student, params = {}) => {
    robot.logger.debug(student);
    return makeRequest(`students/${student.student.object_id}/activities`, params)
      .then((activities) => {
        robot.logger.debug(activities);
        // Ensure max result is enforced
        if (activities.activities.length > maxRecordCount) {
          activities.activities = activities.activities.slice(0, maxRecordCount);
        }
        return activities;
      });
  };

  const formatError = (err) => {
    const json = JSON.parse(err);
    if (!json) {
      return err;
    }
    const output = [];
    // eslint-disable-next-line no-underscore-dangle
    json._errors.forEach((error) => {
      output.push(`${error.title}: ${error.message} [${error.code}]`);
    });
    return output.join('; ');
  };

  robot.respond(/(?:brightwheel|bw)$/i, (msg) => {
    const params = { page_size: maxRecordCount };
    return getStudents()
      .then((data) => {
        const studentActivities = [];
        data.students.forEach((student) => {
          studentActivities.push(getActivities(student, params));
        });
        return Promise.all(studentActivities)
          .then((activitySets) => {
            activitySets.forEach((activitySet) => {
              if (activitySet.count === 0) {
                msg.send('No activities available.');
                return;
              }
              activitySet.activities.forEach((activity) => {
                msg.send(formatActivity(activity));
              });
            });
          });
      }).catch((err) => msg.send(formatError(err)));
  });

  robot.respond(/(?:brightwheel|bw) (checkin|photo|video|potty|nap|food|kudo)s?$/i, (msg) => {
    const params = {
      page_size: maxRecordCount,
      action_type: `ac_${msg.match[1].toLowerCase()}`,
    };
    return getStudents()
      .then((data) => {
        const studentActivities = [];
        data.students.forEach((student) => {
          studentActivities.push(getActivities(student, params));
        });
        return Promise.all(studentActivities)
          .then((activitySets) => {
            activitySets.forEach((activitySet) => {
              if (activitySet.count === 0) {
                msg.send('No activities available.');
                return;
              }
              activitySet.activities.forEach((activity) => {
                msg.send(formatActivity(activity));
              });
            });
          });
      }).catch((err) => msg.send(formatError(err)));
  });
};
