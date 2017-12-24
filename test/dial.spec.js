/* eslint-env mocha */

'use strict'

const Id = require('peer-id')
const {createNode} = require('./utils')
const multiaddr = require('multiaddr')

describe('relay', () => {
  describe('dial', () => {
    let id
    let swarm
    before(cb => Id.createFromJSON(require('./id'), (e, _id) => {
      if (e) return cb(e)
      id = _id
      createNode(id, ['/ip4/127.0.0.1/tcp/36778/ws/p2p-znjs-relay'], (e, _swarm) => {
        if (e) return cb(e)
        swarm = _swarm
        cb()
      })
    }))

    it('can dial zeronet tracker', cb => {
      swarm.dial(multiaddr('/ip4/216.189.144.82/tcp/15441'), (e, c) => { // ip is from public tracker
        if (e) throw e
        c.cmd.ping({}, cb)
      })
    })
  })
})
