'use strict'

const Relay = require('./src/server')
const Id = require('peer-id')

let s

const conf = require('./config.example.json')

function boot (done) {
  const next = () => {
    s = new Relay(conf)
    s.start(done)
  }
  if (conf._) next()
  else {
    Id.createFromJSON(conf.id, (e, id) => {
      if (e) return done(e)
      conf.id = id
      conf._ = true
      next()
    })
  }
}

function stop (done) {
  s.stop(done)
}

module.exports = {
  hooks: {
    pre: boot,
    post: stop
  }
}
