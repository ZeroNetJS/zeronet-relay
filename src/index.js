'use strict'

const Relay = require('./transport')

const debug = require('debug')
const log = debug('zeronet:relay')

module.exports = function () {
  this.hooks = {
    pre: (opt, zeronet, protocol) => {
      if ((opt.libp2p || opt.libp2p == null) && (opt.zero || opt.zero == null) && opt.relay) {
        log('enable')
        this.relayOpt = {zeronet, protocol}
        const relay = this.relay = new Relay()
        opt.zero.transports = (opt.zero.transports || []).concat([relay])
        opt.zero.listen = (opt.zero.listen || []).concat(opt.relay)
        this.relays = opt.relay

        Object.assign(this.hooks, { // only execute these if both swarms are activated
          postLp2p: lp2p => {
            this.relayOpt.swarm = lp2p.lp2p
          },
          post: () => {
            this.relay.__setup(this.relayOpt)
          }
        })
      }
    }
  }
}
