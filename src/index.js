'use strict'

const mafmt = require('mafmt')
const includes = require('lodash.includes')
const once = require('once')
const EventEmitter = require('events').EventEmitter

const RELAY = require('./relay')

function noop () {}

class Relay {
  __setup (opt) {
    this.relay = new RELAY(opt)
  }

  dial (ma, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    callback = callback || noop

    callback = once(callback)

    return this.relay.dial(ma, callback)
  }

  createListener (options, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    handler = handler || (() => {})

    const listener = new EventEmitter()

    listener.close = (options, callback) => {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      callback = callback || noop
      options = options || {}

      listener.emit('close')
      setImmediate(() => callback())
    }

    listener.listen = (ma, callback) => {
      listener.ma = ma
      this.relay.addRelay(ma)
      setImmediate(() => callback())
      listener.emit('listening')
    }

    listener.getAddrs = (callback) => {
      callback(null, listener.ma ? [listener.ma] : [])
    }

    return listener
  }

  filter (multiaddrs) {
    if (!Array.isArray(multiaddrs)) {
      multiaddrs = [multiaddrs]
    }

    return multiaddrs.filter((ma) => {
      if (includes(ma.protoNames(), 'p2p-circuit')) {
        return false
      }
      if (includes(ma.protoNames(), 'p2p-znjs-relay')) {
        return true
      }

      if (includes(ma.protoNames(), 'ipfs')) {
        ma = ma.decapsulate('ipfs')
      }

      return mafmt.TCP.matches(ma)
    })
  }
}

module.exports = Relay
