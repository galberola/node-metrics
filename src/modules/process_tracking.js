/**
 * This module is a cocktail of the most useful process and internal node
 * functions to track resources on the system that i found so far
 */

'use strict';

var config;

function Module(options) {
  config = initOptions(options);
}

function initOptions(options) {
  if (!options) {
    options = {};
  }

  // By default, all metrics are enabled to this module
  options.activeRequests = options.activeRequests === false ? false : true;
  options.activeHandles = options.activeHandles === false ? false : true;

  return options;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric() {
  var metric = '';
  var tmp;

  if (config.activeRequests) {
    tmp = process._getActiveRequests();
    if (tmp && (tmp = tmp.length) >= 0) {
      metric = 'ar:' + tmp;
    }
  }

  if (config.activeHandles) {
    metric.length > 0 ? metric = metric + '#' : null;
    tmp = process._getActiveHandles();
    if (tmp && tmp.length > 0 && (tmp = tmp[1]._handle)) {
      metric = metric + 'ahfd:' + tmp.fd +
                        'ahqs:' + tmp.writeQueueSize;
    }
  }

  return metric;
}

module.exports = function init(options) {
  return new Module(options);
}

///////////////////////////////////////////
// process._getActiveHandles() structure //
///////////////////////////////////////////

/*[{ _
  idleNext: '[Circular]',
  _idlePrev: '[Circular]',
  msecs: 1000,
  ontimeout: '[Function: listOnTimeout]'
},
{
  domain: null,
  _events: {
    request: '[Object]',
    connection: '[Function: connectionListener]',
    clientError: '[Function]'
  },
  _maxListeners: 10,
  _connections: 0,
  connections: '[Getter/Setter]',
  _handle: {
    fd: 11,
    writeQueueSize: 0,
    onconnection: '[Function: onconnection]',
    owner: '[Circular]'
  },
  _usingSlaves: false,
  _slaves: '[]',
  allowHalfOpen: true,
  httpAllowHalfOpen: false,
  timeout: 120000,
  _connectionKey: '4:0.0.0.0:3000'
}]*/

