'use strict';

var os = require('os');

var config;
var metric;
var tmp;
var x;
var xMax;
var cpu;
var isMetaMetricEnabled;
var tickTimeNs;
var firstArrElement;
var addSeparator;

function Module(options, metametrics) {
  if (!options) {
    options = {};
  }

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

  /////////////////////////////
  // Track OS Memory reports //
  /////////////////////////////
  writeStream.write( '"ostm":' + os.totalmem());
  writeStream.write(',"osfm":' + os.freemem());

  ////////////////////////
  // Track Load Average //
  ////////////////////////
  writeStream.write(',"osavg":[' + os.loadavg() + ']');


  ////////////////////
  // Track CPU Load //
  ////////////////////
  tmp = os.cpus();
  if (tmp && tmp.length > 0) {
    writeStream.write(',"oscpu":[');

    firstArrElement = true;
    for (x = 0, xMax = tmp.length; x < xMax ; x++) {
      cpu = tmp[x];
      if (cpu && (cpu = cpu.times)) {
        // If not the first element, separate jsons with ,
        if (!firstArrElement) {
          writeStream.write(',');
        }
        writeStream.write('{' +
                    '"oscore":' + x         + ',' +
                    '"osuser":' + cpu.user  + ',' +
                    '"osnice":' + cpu.nice  + ',' +
                    '"ossys":'  + cpu.sys   + ',' +
                    '"osidle":' + cpu.idle  + ',' +
                    '"osirq":'  + cpu.irq   + ''  +
                  '}');
        // Notify that the next element is not the first one
        firstArrElement = false;
      }
    }
    writeStream.write(']');
  }


  // Meta-Metrics: End tracking time of tick loop
  if (isMetaMetricEnabled) {
    tmp = process.hrtime(tickTimeNs);
    writeStream.write(',"osmm":' + (tmp[0] * 1e9 + tmp[1]));
  }

  return metric;
}

module.exports.init = function init(options, metametrics) {
  return new Module(options, metametrics);
}

module.exports.keys = {
  'ostm': '',
  'osfm': '',
  'osavg': '',
  'oscpu': '',
  'oscore': '',
  'osuser': '',
  'osnice': '',
  'ossys': '',
  'osidle': '',
  'osirq': '',
  'osmm': ''
};
