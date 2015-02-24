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
  options.memory = options.memory === false ? false : true;

  return options;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric() {
  var metric = '';
  var tmp;

  ///////////////////////////
  // Track Active Requests //
  ///////////////////////////
  if (config.activeRequests) {
    tmp = process._getActiveRequests();
    if (tmp && (tmp = tmp.length) >= 0) {
      metric = 'ar:' + tmp;
    }
  }

  /////////////////////////////////////////////
  // Track Active Handles (File Descriptors) //
  /////////////////////////////////////////////
  if (config.activeHandles) {
    metric.length > 0 ? metric = metric + '#' : null;
    tmp = process._getActiveHandles();
    if (tmp && tmp.length > 0 && (tmp = tmp[1]._handle)) {
      metric = metric + 'ahfd:' + tmp.fd +
                        'ahqs:' + tmp.writeQueueSize;
    }
  }

  ////////////////////////
  // Track Memory Usage //
  ////////////////////////
  if (config.memory) {
    metric.length > 0 ? metric = metric + '#' : null;
    tmp = process.memoryUsage();
    if (tmp) {
      metric = metric +  'memrs:' + tmp.rss +
                        '#memht:' + tmp.heapTotal +
                        '#memhu:' + tmp.heapUsed;
    }
  }

  return metric;
}

module.exports = function init(options) {
  return new Module(options);
}
