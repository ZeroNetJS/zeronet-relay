'use strict'

const debug = require('debug')
const log = debug('zeronet:relay:server')

const Libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const WS = require('libp2p-websockets')
const Peer = require('peer-info')

const SPDY = require('libp2p-spdy')
const MULTIPLEX = require('libp2p-multiplex')
const SECIO = require('libp2p-secio')

module.exports = function ZNRelayServer (config) {
  const self = this

  if (!config) throw new Error('Config is required')
  if (!config.listen) config.listen = ['/ip4/0.0.0.0/tcp/36777', '/ip6/::/tcp/36777', '/ip4/0.0.0.0/tcp/36778/ws']

  log('creating server', config)

  const peer = new Peer(config.id)
  config.listen.forEach(addr => peer.multiaddrs.add(addr))

  const swarm = self.swarm = new Libp2p({
    transport: [
      new TCP(),
      new WS()
    ],
    connection: {
      muxer: [
        MULTIPLEX,
        SPDY
      ],
      crypto: [SECIO]
    }
  }, peer)

  require('./relay')(swarm, config)

  self.start = cb => swarm.start(cb)
  self.stop = cb => swarm.stop(cb)
}
