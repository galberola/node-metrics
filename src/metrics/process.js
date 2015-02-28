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
Module.prototype.getMetric = function getMetric(writeStream) {
  // Meta-Metrics: Begin tracking time of tick loop
  isMetaMetricEnabled ? tickTimeNs = process.hrtime() : null;

  metric = '';

  ///////////////////////////
  // Track Active Requests //
  ///////////////////////////
  writeStream.write('"ptar":' + process._getActiveRequests().length);


  /////////////////////////////////////////////
  // Track Active Handles (File Descriptors) //
  /////////////////////////////////////////////
  tmp = process._getActiveHandles();
  if (tmp && tmp.length > 0 && (tmp = tmp[1]._handle)) {
    writeStream.write(',"ptfd":' + tmp.fd);
    writeStream.write(',"ptqs":' + tmp.writeQueueSize);
  }

  ////////////////////////
  // Track Memory Usage //
  ////////////////////////
  tmp = process.memoryUsage();
  writeStream.write(',"ptmrs":' + tmp.rss);
  writeStream.write(',"ptmht":' + tmp.heapTotal);
  writeStream.write(',"ptmhu":' + tmp.heapUsed);


  //////////////////
  // Track Uptime //
  //////////////////
  writeStream.write(',"ptup":' + process.uptime());

  // Meta-Metrics: End tracking time of tick loop
  if (isMetaMetricEnabled) {
    tmp = process.hrtime(tickTimeNs);
    writeStream.write(',"pttk":' + (tmp[0] * 1e9 + tmp[1]));
  }

  return metric;
}

module.exports = function init(options, metametrics) {
  return new Module(options, metametrics);
}
