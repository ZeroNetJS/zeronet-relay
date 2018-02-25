'use strict'

const Relay = require('./transport')

const debug = require('debug')
const log = debug('zeronet:relay')

module.exports = function () {
  this.hooks = {
    pre: (opt, zeronet, protocol) => {
      log('hook:pre')
      if ((opt.libp2p || opt.libp2p == null) && (opt.zero || opt.zero == null) && opt.relay) {
        log('enable')
        this.relayOpt = {zeronet, protocol}
        const relay = this.relay = new Relay()
        opt.zero.transports = (opt.zero.transports || []).concat([relay])
        opt.zero.listen = (opt.zero.listen || []).concat(opt.relay)
        this.relays = opt.relay
      }
    },
    postLp2p: lp2p => {
      log('hook:postLibp2p')
      if (this.relayOpt) this.relayOpt.swarm = lp2p.lp2p
    },
    post: () => {
      log('hook:post')
      if (this.relay) this.relay.__setup(this.relayOpt)
    }
  }
}
