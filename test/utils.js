'use strict'

const Relay = require('../src')
const WS = require('libp2p-websockets')

const PeerPool = require('zeronet-common/src/peer/pool').MainPool
const Swarm = require('zeronet-swarm')

const zeronet = {
  rev: '0',
  version: 'v0',
  peer_id: Math.random().toString(),
  peerPool: new PeerPool()
}

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

    const swarm = new Swarm(conf, zeronet)
    relay.__setup({swarm: swarm.lp2p.lp2p, protocol: swarm.zero.protocol, zeronet})
    zeronet.swarm = swarm

    swarm.start(e => e ? cb(e) : cb(null, swarm, relay, zeronet))
  }
}
