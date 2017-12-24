'use strict'

const Connection = require('interface-connection').Connection
const once = require('once')
const debug = require('debug')
const log = debug('zeronet:relay')
const EE = require('events').EventEmitter
const multiaddr = require('multiaddr')

const Handshake = require('zeronet-protocol/src/zero/handshake/')
const cat = require('pull-cat')
const msgpack = require('zeronet-msgpack')()

const Id = require('peer-id')
const Peer = require('peer-info')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const redir = require('pull-redirectable').duplex
const lp = require('pull-length-prefixed')
const proto = require('./proto')

class RelayPeer {
  constructor (peer, swarm) {
    this.peer = peer
    this.id = peer.id
    this.idb58 = peer.id.toB58String()
    this.swarm = swarm
  }
  connected () {
    return Boolean(this.swarm.muxedConns[this.idb58])
  }
  get multiaddrs () {
    return this.peer.multiaddrs
  }
  dial (cb) {
    this.swarm.dial(this.peer, '/zeronet/relay/1.0.0', cb)
  }
}

function RelayDialer () {
  let source = Pushable()
  let dials = 0
  return {
    sink: read => read(null, function next (end, peer) {
      if (end) return source.end()
      log('dialing relay %s', peer.idb58)
      dials++
      peer.dial((e, c) => {
        if (c) source.push([c, peer])
        dials--
        if (!dials) source.end()
      })
    }),
    source
  }
}

class RelayPool extends EE {
  constructor (main) {
    super()
    this.addresses = []
    this.peers = []
    this.online = []
    this.main = main
  }

  addToPool (ma) {
    const id = Id.createFromB58String(ma.toString().split('ipfs/').pop())
    const pi = new RelayPeer(new Peer(id), this.main.swarm)
    pi.multiaddrs.add(ma.decapsulate('p2p-znjs-relay'))
    this.addresses.push(ma)
    this.peers.push(pi)
    return pi
  }

  getActiveRelay (cb) {
    pull(
      pull.values(this.peers.slice(0)),
      RelayDialer(), // dial all peers at once
      pull.take(1), // take the first successfull
      pull.collect((e, r) => {
        if (e) return cb(e)
        if (!r.length) return cb(new Error('Failed to dial a relay!'))
        return cb(null, ...r.shift()) // return that as result
      })
    )
  }
}

class Relay extends EE {
  constructor (options) {
    super()
    this.swarm = options.swarm
    this.zeronet = options.zeronet
    this.protocol = options.protocol
    this.relayPool = new RelayPool(this)
  }

  addRelay (ma) {
    this.relayPool.addToPool(ma)
  }

  dial (ma, cb) {
    const resolvable = new Connection()
    cb = once(cb)
    log('dialing %s', ma)
    if (!this.relayPool.peers.length) return cb(new Error('No relays found!'))
    this.relayPool.getActiveRelay((err, conn, peer) => {
      if (err) return cb(err)
      log('using relay %s to dial %s', peer.idb58, ma)
      ma = multiaddr(ma)
      const handshake = Handshake.create(this.protocol, {}, this.zeronet)
      const redird = redir()
      pull(
        conn,
        redird,
        conn
      )
      const establish = redird.a
      const data = new Connection(redird.b, {getObservedAddrs: cb => cb(null, [ma])})
      let f = true
      pull(
        cat([
          (end, cb) => {
            if (f) {
              redird.changeDest('b', 'sk') // early sink change
              cb(null, proto.EstablishRequest.encode({ma: ma.buffer, handshake}))
              f = false
            }
          }
        ]),
        lp.encode(),
        establish.sink
      )
      pull(
        establish.source,
        lp.decode(),
        pull.map(v => {
          redird.changeDest('b', 'src') // early source change
          return proto.EstablishResponse.decode(v)
        }),
        pull.map(r => {
          log('dial %s success', ma)
          const result = new Connection({
            sink: read => {
              read(null, e => { // skip the first
                if (e) return
                data.sink(read)
              })
            },
            source: cat([
              pull.values([msgpack.encode(Object.assign({
                cmd: 'response',
                to: 1
              }, r.remote))]),
              data.source
            ])
          }, data)
          resolvable.setInnerConn(result)
          cb(null, result)
        }),
        pull.drain()
      )
    })
    return resolvable
  }
}

module.exports = Relay
