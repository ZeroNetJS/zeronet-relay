'use strict'

/* eslint-disable no-console */

const Server = require('./')
const Id = require('peer-id')

if (process.argv[2] === 'genconf') {
  Id.create((err, id) => {
    if (err) throw err
    console.log(JSON.stringify({id}, 0, 2))
  })
} else {
  let config
  try {
    config = require(process.argv[2])
  } catch (e) {
    require('colors')
    console.error('Failed to load config %s: %s'.red.bold, process.argv[2], e)
    if (process.argv[3] === '--allow-insecure-config') {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'.yellow)
      console.error('! WARNING: Insecure config file is being used!             '.yellow)
      console.error('! The private key of that config is public!                !'.yellow)
      console.error('! Run the server with "genconf" to create a secure config !'.yellow)
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'.yellow)
      config = require('../../config.example.json')
    } else {
      process.exit(2)
    }
  }
  Id.createFromJSON(config.id, (err, id) => {
    if (err) throw err
    config.id = id
    const s = new Server(config)
    console.log('Initializing...')
    s.start(err => {
      if (err) throw err
      config.listen.forEach(addr => console.log('Listening on %s', addr))
    })
  })
}
