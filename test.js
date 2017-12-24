'use strict'

const WS = require('libp2p-websockets')
const Id = require('peer-id')
const multiaddr = require('multiaddr')

const Relay = require('./src')

const PeerPool = require('zeronet-common/src/peer/pool').MainPool
const Swarm = require('zeronet-swarm')

const zeronet = {
  rev: '0',
  version: 'v0',
  peer_id: Math.random().toString(),
  peerPool: new PeerPool()
}
const {tls, secio} = require('zeronet-crypto')

Id.createFromJSON(require('./test/id'), (err, id) => {
  if (err) throw err
  const listen = [process.env.USE_PROD ? '/dns/znjs-relay.servep2p.com/tcp/443/wss/p2p-znjs-relay' : '/ip4/127.0.0.1/tcp/36778/ws/p2p-znjs-relay']

  const relay = new Relay()

  let conf = {
    zero: {
      transports: [
        relay
      ],
      listen: [],
      crypto: [tls, secio]
    },
    libp2p: {
      transports: [
        relay,
        new WS()
      ],
      listen
    }
  }
  conf.id = id
  const swarm = new Swarm(conf, zeronet)
  relay.__setup({swarm: swarm.lp2p.lp2p, protocol: swarm.zero.protocol, zeronet})
  zeronet.swarm = swarm

  swarm.start(err => {
    if (err) throw err
    swarm.dial(multiaddr('/ip4/216.189.144.82/tcp/15441'), (e, c) => { // ip is from public tracker
      if (e) throw e
      c.cmd.ping({}, console.log)
    })
  })
})
