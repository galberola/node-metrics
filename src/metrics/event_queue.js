/**
 * This module uses toobusy (https://www.npmjs.com/package/toobusy)
 *
 * How it works
 *
 * toobusy polls the node.js event loop and keeps track of "lag", which is
 * long requests wait in node's event queue to be processed. When lag crosses
 * a threshold, toobusy tells you that you're too busy. At this point you can
 * stop request processing early (before you spend too much time on them and
 * compound the problem), and return a "Server Too Busy" response.
 *
 * This allows your server to stay responsive under extreme load, and continue
 * serving as many requests as possible.
 */
'use strict';

var toobusy = require('toobusy');

function Module(options) {
  if (!options) {
    options = {};
  }
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric() {
  return '"eql":' + toobusy.lag();
}

module.exports = function init() {
  return new Module();
}
