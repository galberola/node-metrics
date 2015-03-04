'use strict';

var xtend = require('xtend');
var through2 = require('through2');

/////////////////////////////////////////////
// This object will hold the translations  //
// for all the keys in the metrics modules //
/////////////////////////////////////////////
var keyMapping = xtend(
  require('../metrics/event_queue').keys,
  require('../metrics/request').keys,
  require('../metrics/process').keys,
  require('../metrics/os').keys
);

//////////////////////////////////////////////////////////////////
// Replace all the short keys for their respective long version //
//////////////////////////////////////////////////////////////////
var stream = through2(function transform(chunk, enc, callback) {
  var key;

  for (key in keyMapping) {
    if (keyMapping.hasOwnProperty(key)) {
      chunk = chunk.replace(key, keyMapping[key]);
    }
  }

  this.push(chunk)

  callback();
});

module.exports = function() {
  return stream
};
