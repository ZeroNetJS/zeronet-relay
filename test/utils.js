'use strict'

const Relay = require('../src')
const WS = require('libp2p-websockets')

const PeerPool = require('zeronet-common/src/peer/pool').MainPool
const Swarm = require('zeronet-swarm')

module.exports = {
  createNode: (id, relays, cb) => {
    const relay = new Relay()

    let conf = {
      zero: {
        transports: [
          relay
        ],
        listen: [],
        crypto: []
      },
      libp2p: {
        transports: [
          relay,
          new WS()
        ],
        listen: relays
      },
      id
    }

    const zeronet = {
      rev: '0',
      version: 'v0',
      peer_id: Math.random().toString()
    }

    const swarm = new Swarm(conf, zeronet)

    zeronet.peerPool = new PeerPool(swarm)

    relay.__setup({swarm: swarm.lp2p.lp2p, protocol: swarm.zero.protocol, zeronet})
    zeronet.swarm = swarm

    swarm.start(e => e ? cb(e) : cb(null, swarm, relay, zeronet))
  }
}
