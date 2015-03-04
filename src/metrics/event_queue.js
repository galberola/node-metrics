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
var isMetaMetricEnabled;
var metric;
var tmp;
var tickTimeNs;

function Module(options, metametrics) {
  if (!options) {
    options = {};
  }

  isMetaMetricEnabled = metametrics;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric(writeStream) {
  // Meta-Metrics: Begin tracking time of tick loop
  isMetaMetricEnabled ? tickTimeNs = process.hrtime() : null;

  writeStream.write('"eql":' + toobusy.lag());

  // Meta-Metrics: End tracking time of tick loop
  if (isMetaMetricEnabled) {
    tmp = process.hrtime(tickTimeNs);
    writeStream.write(',"eqmm":' + (tmp[0] * 1e9 + tmp[1]));
  }

  return metric;
}

module.exports.init = function init(options, metametrics) {
  return new Module(options, metametrics);
}

module.exports.keys = {
  'eqmm': ''
};
