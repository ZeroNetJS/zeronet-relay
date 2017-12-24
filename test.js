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
  peer_id: 'gg',
  peerPool: new PeerPool()
}
const {tls, secio} = require('zeronet-crypto')

Id.createFromJSON({
  'id': 'QmddZ9SHJYvZXi9oRSymKpqF8K7UoHEW9m1CWrT6cuRD8K',
  'privKey': 'CAASpwkwggSjAgEAAoIBAQCjfdU3ytE/QGdY4zApD1O2Z5ybTob/7SHYq9+IFFoT+PYyNwbEq4RW/loTEceSKfi4TjJxjS2UKvQTreowOlnc6IUNXdH5KM/FmG1uAno81qFjiiCvaUIM/9hdxG0L8VpiNvFfxxdPcVExWXM+qFaZO2cTxfFN5w52CVkCLz5XMwoUa/YZniujoWDA3yPnfr5YK93G9AloNR2uy0NvEP6ZmQYCHdnYa0S11kFKWj2L3AoGWrXEUjGMfrsSSUIl0pYZM8C4ZrGEqZMgczwtc6RqKR98JqlE52/fO3ABEdh4bEzdNhJMZe72Px6ffNIU4zlx0H05XY5I8qNeIbpqQ9eZAgMBAAECggEBAJcCIg+/aNiIbyy943z5aDQBrbgRp0X6TJnp3rS9P5pVCWnGQ50iY0FK+/3DHVfXJqFtsNALO38w0XLf34CeVORjbIm1D72YwZhcOy8yYJ+TC0x6h8gda+G/6qRpSuOOERLIdtgld1VscDcpzPWh3SL5qDKuUTzIXyYNakZHRsiYpRPnggzZKkU4SsJGZsWiXynAHRlapdwomDW0WmOrCYHJPQM1Lhia/jUymuRMs+3xwZ22I4TxkKP+m4J3lkSGqv9OEbWepc4i8v6wR10ZCZDNx+G4vrMQABKMaxGSSjVY+r6EIzOaQTn1PZ1SxAMwmAcbYuxdCogMZcv7qRdKgsUCgYEAznt5WQg3YS3UCOBbt+GAfYS+cI25KQXhca1t02ZVx8SsOFs92Ejt+ViUK08nu7pl25s17VN/n4NCdGB64/qO97dodXvEgTjfpPp42PULYiU2WlNgujeq8cxvo6cLjitwSmBvZ6Qw1CnZ4kyMmSmzIzHxXBf2+s76fU1wMund7/8CgYEAyrMI14VkYCOWCQO9tzVKcg1UwktLJRqAjK3b682ElPsNKTfpP+cNcr6uMaTokrKyP8KU0btQQtGHWmszb5rndc7jPS4+oTFXTvd082sWSrprI9v9wqWg/xV/FG2f+xdb0Li1A/w0MAx6HL4vyu/c1yX83klRvWDCjdH+wsKHuGcCgYBvbmNGkRCR+VF8mNfmnGPjWUgNJe7PHMVVu+qRM6EHdjQbFeKCXplO/2a3GLiwrx9ZLKIlufId+5BZjdfEQOv285wECw85TaAkQKgHLfc+uCZlCKoi1PgEFfgJsZSi3P50pSZ6IDnZxdw4LGeUINT0IXfH44b+Q8Ua6jeqwltrsQKBgB6mj/G3FASNnQRj8m4futAgP+7ZX9WOel3LdHPlseStScIv2C93issNFl4fZ6O3LckCbWqBfpN8B5GeoDqCG/nufOIlegb55Q/lz2N3j/lg0w6rF2Y1kXDBGWRHZ2eakqGvLIAbxPB3EogCIkv3lVdbQS+Dur5+QS0c0f81VzyFAoGAcNRVAQXpwsoJvrIRoARv48DMimqCcccD0s0eaD0A10N5GX16syA7Ds5NsgzQV/IPuVy0M5Vw6yUzOd9U/XVKsj6Ezp7iFOC19RLHSUwSQIdULQXN2CNyt6ieLCCXXniwkORnsyDTgPFbfYyGGVPHORXcKmqey0zVBny/jfkO/zQ=',
  'pubKey': 'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCjfdU3ytE/QGdY4zApD1O2Z5ybTob/7SHYq9+IFFoT+PYyNwbEq4RW/loTEceSKfi4TjJxjS2UKvQTreowOlnc6IUNXdH5KM/FmG1uAno81qFjiiCvaUIM/9hdxG0L8VpiNvFfxxdPcVExWXM+qFaZO2cTxfFN5w52CVkCLz5XMwoUa/YZniujoWDA3yPnfr5YK93G9AloNR2uy0NvEP6ZmQYCHdnYa0S11kFKWj2L3AoGWrXEUjGMfrsSSUIl0pYZM8C4ZrGEqZMgczwtc6RqKR98JqlE52/fO3ABEdh4bEzdNhJMZe72Px6ffNIU4zlx0H05XY5I8qNeIbpqQ9eZAgMBAAE='
}, (err, id) => {
  const listen = ['/ip4/127.0.0.1/tcp/36778/ws/p2p-znjs-relay']

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
    swarm.dial(multiaddr('/ip4/127.0.0.1/tcp/15441'), (e, c) => {
      if (e) throw e
      c.cmd.ping({}, console.log)
    })
  })
})
