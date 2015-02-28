/**
 * This module is a cocktail of the most useful process and internal node
 * functions to track resources on the system that i found so far
 */
'use strict';

var config;
var metric;
var tmp;
var isMetaMetricEnabled;
var tickTimeNs;

function Module(options, metametrics) {
  if (!options) {
    options = {};
  }

  // By default, all metrics are enabled to this module
  options.activeRequests = options.activeRequests === false ? false : true;
  options.activeHandles = options.activeHandles === false ? false : true;
  options.memory = options.memory === false ? false : true;
  options.uptime = options.uptime === false ? false : true;

  config = options;

  isMetaMetricEnabled = metametrics;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric() {
  // Meta-Metrics: Begin tracking time of tick loop
  isMetaMetricEnabled ? tickTimeNs = process.hrtime() : null;

  metric = '';

  ///////////////////////////
  // Track Active Requests //
  ///////////////////////////
  if (config.activeRequests) {
    tmp = process._getActiveRequests();
    if (tmp && (tmp = tmp.length) >= 0) {
      metric = '"ptar":' + tmp;
    }
  }

  /////////////////////////////////////////////
  // Track Active Handles (File Descriptors) //
  /////////////////////////////////////////////
  if (config.activeHandles) {
    metric.length > 0 ? metric = metric + ',' : null;
    tmp = process._getActiveHandles();
    if (tmp && tmp.length > 0 && (tmp = tmp[1]._handle)) {
      metric = metric +  '"ptfd":' + tmp.fd +
                        ',"ptqs":' + tmp.writeQueueSize;
    }
  }

  ////////////////////////
  // Track Memory Usage //
  ////////////////////////
  if (config.memory) {
    metric.length > 0 ? metric = metric + ',' : null;
    tmp = process.memoryUsage();
    if (tmp) {
      metric = metric +  '"ptmrs":' + tmp.rss +
                        ',"ptmht":' + tmp.heapTotal +
                        ',"ptmhu":' + tmp.heapUsed;
    }
  }

  //////////////////
  // Track Uptime //
  //////////////////
  if (config.uptime) {
    metric.length > 0 ? metric = metric + ',' : null;
    metric = metric + '"ptup":' + process.uptime();
  }

  // Meta-Metrics: End tracking time of tick loop
  if (isMetaMetricEnabled) {
    tmp = process.hrtime(tickTimeNs);
    metric = metric + ',"pttk":' + (tmp[0] * 1e9 + tmp[1]);
  }

  return metric;
}

module.exports = function init(options, metametrics) {
  return new Module(options, metametrics);
}
