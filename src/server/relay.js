'use strict'

const pull = require('pull-stream')
const redir = require('pull-redirectable').duplex
const lp = require('pull-length-prefixed')
const proto = require('../proto')
const TCP = require('libp2p-tcp')
const tcp = new TCP()
const multiaddr = require('multiaddr')

const debug = require('debug')
const log = debug('zeronet:relay:server:relay')

const HandshakeClient = require('zeronet-protocol/src/zero/handshake/client')
const once = require('once')

module.exports = swarm => {
  swarm.handle('/zeronet/relay/1.0.0', (protocol, conn) => {
    const redird = redir(conn)
    const establish = redird.a
    const data = redird.b
    pull(
      conn,
      redird,
      conn
    )
    pull( // we get data for establish
      establish,
      lp.decode(),
      pull.map(v => proto.EstablishRequest.decode(v)),
      pull.asyncMap((v, cb) => { // process via asyncMap. do NOT return errors. just {success: false}
        log('got request', v)
        redird.changeDest('b', 'src') // change src read early
        const ma = multiaddr(v.ma)
        const conn = tcp.dial(ma) // dial address
        // if (err) return cb(null, {success: false}) // if offline, exit
        const client = new HandshakeClient(conn, {isServer: false}, {swarm: {}}, {})
        client.upgrade = function upgrade () { // hack the upgrade fnc
          cb = once(cb)
          Object.assign(this.handshake.local, v.handshake) // overwrite handshake
          const shake = this.isServer ? this.waitForHandshake.bind(this) : this.requestHandshake.bind(this)
          shake(err => {
            if (err) return cb(null, {success: false})
            this.getRaw((err, conn) => {
              if (err) return cb(null, {success: false})
              pull( // if success pass through data
                conn,
                data,
                conn
              )
              this.handshake.success = true
              cb(null, this.handshake) // first send response
              redird.changeDest('b', 'sk') // then change sink dest
            })
          })
        }.bind(client)
        client.upgrade()
      }),
      pull.map(v => proto.EstablishResponse.encode(v)),
      lp.encode(),
      establish
    )
  })
}
