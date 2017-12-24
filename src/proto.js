'use strict'

const proto = require('protons')
module.exports = proto(`
  message PartHandshake { // partial handshake for request
    repeated string crypt_supported = 1;
    // fileserver_port defaults to 0
    required string peer_id = 2;
    // protocol MUST default to 2 because otherwise everything breaks apart
    required int32 rev = 3;
    // target_ip is by default false
    required string version = 4;
    repeated string libp2p = 5; // libp2p upgrade magic
  }

  message Handshake {
    string crypt = 1;
    repeated string crypt_supported = 2;
    int32 fileserver_port = 3;
    required string peer_id = 4;
    required bool port_opened = 5;
    required string protocol = 6;
    required int32 rev = 7;
    string target_ip = 8;
    required string version = 9;
    repeated string libp2p = 10;
    bool own = 11;
  }

  message EstablishRequest {
    required bytes ma = 1;
    required PartHandshake handshake = 2;
  }

  message EstablishResponse {
    required bool success = 1;
    Handshake local = 2;
    Handshake remote = 3;
  }
`)
