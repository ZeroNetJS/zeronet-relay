'use strict'

const Relay = require('../src')
const WS = require('libp2p-websockets')

const PeerPool = require('zeronet-common/src/peer/pool').MainPool
const Swarm = require('zeronet-swarm')

module.exports = {
  createNode: (id, relays, cb) => {
    let conf = {
      zero: {
        listen: [],
        crypto: []
      },
      libp2p: {
        transports: [
          new WS()
        ],
        listen: []
      },
      relay: relays,
      id
    }

    const zeronet = {
      rev: '0',
      version: 'v0',
      peer_id: Math.random().toString()
    }

    const relayMod = new Relay()

    const swarm = new Swarm(conf, zeronet, [relayMod].concat(Swarm.modules.all()))

    zeronet.peerPool = new PeerPool(swarm)

    zeronet.swarm = swarm

    swarm.start(e => e ? cb(e) : cb(null, swarm, relayMod.relay, zeronet))
  }
}
