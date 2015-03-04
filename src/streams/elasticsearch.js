'use strict';

var through2 = require('through2');
var elasticsearch = require('elasticsearch');
var log = require('../utils/log');

//////////////////////////////////////////////////////////////////
// Replace all the short keys for their respective long version //
//////////////////////////////////////////////////////////////////
var stream = function(config) {
  if (!config) {
    config = {};
  }

  var index = config.index || 'metrics';
  var type  = config.type || (new Date()).getTime();

  var esCfg = {
    host: config.host || 'localhost:9200',
    log: config.log || 'trace',
    apiVersion: config.apiVersion || '1.4'
  };

  log('ES config:' + JSON.stringify(esCfg));
  log('Index:' + index + ' - Type:' + type);

  var client = new elasticsearch.Client(esCfg);

  /////////////////////////////////////////////////////////////
  // Perform a ping to the service to check if Elasticsearch //
  // is actually up and running or not                       //
  /////////////////////////////////////////////////////////////
  client.ping({
    requestTimeout: 1000,
    hello: 'elasticsearch!'
  }, function (error) {
    if (error) {
      throw(new Error('The Elasticsearch cluster is down!' +
        JSON.stringify(esCfg)));
    }
  });

  return through2(function transform(chunk, enc, callback) {
    var j;

    try {
      j = JSON.parse(chunk);
    } catch (e) {
      // Can not parse JSON
    }

    client.create({
      index: index,
      type: type,
      body: j
    }, function(err) {
      // Handle error
      callback(err);
    });
  });
}


module.exports = stream;
