# Description
#   Show activity and photos from Brightwheel, a daycare management app.
#
# Configuration:
#   HUBOT_BRIGHTWHEEL_EMAIL - Email address Brightwheel for login
#   HUBOT_BRIGHTWHEEL_PASSWORD - Password for Brightwheel login.
#   HUBOT_BRIGHTWHEEL_MAX_COUNT - Maximum records to return (default: 5)
#
# Commands:
#   hubot brightwheel - Show the latest activities.
#   hubot brightwheel <checkin|photo|video|potty|nap|food> - Show the latest activities of a specific type.
#
# Author:
#   stephenyeargin

module.exports = (robot) ->

  moment = require('moment-timezone')

  base_endpoint = 'https://schools.mybrightwheel.com/api/v1'
  base_headers = {
    'Accept': 'application/json',
    'Content-type': 'application/json',
    'X-Client-Name': 'web',
    'X-Client-Version': 'b15cec31e66fa803de35b53260872aa7e5e84e29'
  }
  max_record_count = parseInt(process.env.HUBOT_BRIGHTWHEEL_MAX_COUNT, 10) or 5
  username = process.env.HUBOT_BRIGHTWHEEL_EMAIL
  password = process.env.HUBOT_BRIGHTWHEEL_PASSWORD
  auth = false

  robot.respond /(?:brightwheel|bw)$/i, (msg) ->
    params = {page_size: max_record_count}
    getStudents()
      .then (data) ->
        activities = []
        for student in data.students
          activities.push getActivities(student, params)
        return Promise.all(activities)
          .then (activitySets) ->
            for activities in activitySets
              if activities['count'] == 0
                msg.send "No activities available."
                return
              for activity in activities['activities']
                msg.send formatActivity(activity)
      .catch (err) ->
        msg.send err

  robot.respond /(?:brightwheel|bw) (checkin|photo|video|potty|nap|food|kudo)s?$/i, (msg) ->
    params = {
      page_size: max_record_count
      action_type: 'ac_' + msg.match[1].toLowerCase()
    }
    getStudents()
      .then (data) ->
        activities = []
        for student in data.students
          activities.push getActivities(student, params)
        return Promise.all(activities)
          .then (activitySets) ->
            for activities in activitySets
              if activities['count'] == 0
                msg.send "No activities available."
                return
              for activity in activities['activities']
                msg.send formatActivity(activity)
      .catch (err) ->
        msg.send err

  formatActivity = (activity) ->
    textOutput = ""
    slackOutput = {}
    slackAttachmentTemplate = {
      title: 'Activity'
      text: null,
      footer: 'Brightwheel',
      footer_icon: 'https://github.com/brightwheel.png',
      author_name: "#{activity['actor']['first_name']} #{activity['actor']['last_name']}"
      ts: moment(activity['event_date']).format('X')
    }
    textOutput = textOutput + "#{activity['target']['first_name']}"
    switch activity['action_type']
      when 'ac_checkin'
        state = if activity['state'] == '1' then 'in' else 'out'
        textOutput = textOutput + " was checked #{state}."
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} was checked #{state}.",
        })
      when 'ac_photo'
        textOutput = textOutput + " was in a photo. - #{activity['media']['image_url']}"
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} was in a photo.",
        })
      when 'ac_video'
        textOutput = textOutput + " was in a video. - #{activity['video_info']['downloadable_url']}"
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} was in a video.",
        })
      when 'ac_potty'
        textOutput = textOutput + " went potty. (#{activity['details_blob']['potty_type']} - #{activity['details_blob']['potty_extras'].join(', ')})"
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} went potty.",
          text: "#{activity['details_blob']['potty_type']} - #{activity['details_blob']['potty_extras'].join(', ')}"
        })
      when 'ac_nap'
        state = if activity['state'] == "1" then 'started' else 'ended'
        textOutput = textOutput + " #{state} a nap."
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} #{state} a nap."
        })
      when 'ac_food'
        foods = []
        for item in activity['menu_item_tags']
          foods.push item['name']
        details = foods.join(', ')
        if item['notes']
          details = details + " (#{item['notes']})"
        textOutput = textOutput + " ate #{details}."
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} ate.",
          text: "#{details}"
        })
      when 'ac_kudo'
        textOutput = textOutput + " received kudos."
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} received kudos.",
        })
      else
        # Catch-all for things we don't know how to handle
        textOutput = textOutput + " - #{activity['action_type'].replace('ac_','')}"
        slackOutput = merge(slackAttachmentTemplate, {
          fallback: textOutput,
          title: "#{activity['target']['first_name']} - #{activity['action_type'].replace('ac_','')}"
        })
    event_time = moment(activity['event_date'])
    if activity['note']
      textOutput = textOutput + " - #{activity['note']}"
      slackOutput['text'] = [activity['note'], slackOutput['text']].join("\n").trim()
    if activity['media']? and activity['media']['image_url']?
      slackOutput['title_link'] = activity['media']['image_url']
      slackOutput['image_url'] = activity['media']['image_url']
      slackOutput['thumb_url'] = activity['media']['thumbnail_url']
    if activity['video_info']? and activity['video_info']['downloadable_url']?
      slackOutput['title_link'] = activity['video_info']['downloadable_url']
      slackOutput['image_url'] = activity['video_info']['thumbnail_url']
      slackOutput['thumb_url'] = activity['video_info']['thumbnail_url']

    textOutput = textOutput + " | #{event_time.format('lll')}"

    switch robot.adapterName
      when 'slack'
        output = {attachments: [slackOutput]}
      else
        output = textOutput

    return output

  authenticate = () ->
    return new Promise (resolve, reject) ->
      if auth
        resolve(auth)
        return
      credentials = JSON.stringify({user: {email: username, password: password} })
      robot.http("#{base_endpoint}/sessions")
        .headers(base_headers)
        .post(credentials) (err, res, body) ->
          if err
            robot.logger.error err
            reject(err)
            return
          if res.statusCode != 201
            robot.logger.error body
            reject(res.statusMessage)
            return
          robot.logger.debug res
          robot.logger.debug body
          auth = res.headers['set-cookie'][0].split('; ')[0]
          base_headers['Cookie'] = auth
          resolve(auth)

  getStudents = () ->
    return makeRequest('users/me')
      .then (data) ->
        robot.logger.debug data
        makeRequest("guardians/#{data['object_id']}/students")
          .then (students) ->
            robot.logger.debug students
            return students

  getActivities = (student, params = {}) ->
    robot.logger.debug student
    return makeRequest("students/#{student['student']['object_id']}/activities", params)
      .then (activities) ->
        robot.logger.debug activities
        # Ensure max result is enforced
        if activities['activities'].length > max_record_count
          activities['activities'] = activities['activities'].slice(0, max_record_count)
        return activities

  makeRequest = (endpoint, params = {}) ->
    return new Promise (resolve, reject) ->
      authenticate()
        .then () ->
          robot.http("#{base_endpoint}/#{endpoint}")
            .headers(base_headers)
            .query(params)
            .get() (err, res, body) ->
              robot.logger.debug body
              if (err)
                robot.logger.error err
                reject(err)
              resolve(JSON.parse(body))

  # Helper Methods
  merge = (xs...) ->
    if xs?.length > 0
      tap {}, (m) -> m[k] = v for k, v of x for x in xs

  tap = (o, fn) -> fn(o); o
