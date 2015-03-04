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
var cpuMatrix;

function Module(options, metametrics) {
  if (!options) {
    options = {};
  }

  config = options;
  isMetaMetricEnabled = metametrics;

  initCpuMatrix();
}

// The osCpuMatrix is a Matrix that contains the metrics for
// osuser, osnice, ossys, osidle, osirq as first level
// and the metric for the cpu number as second level
//
// Since the number of cores will not vary during the life of the app.
// we create the matrix once and reuse the same object altering the
// values on each iteration
function initCpuMatrix() {
  var amountOfMetricsPerCpu = 5;
  // Init amout of metrics
  cpuMatrix = new Array(amountOfMetricsPerCpu);
  // Init amout of cores
  tmp = os.cpus();
  if (tmp && tmp.length > 0) {
    for (x = 0, xMax = amountOfMetricsPerCpu; x < xMax ; x++) {
      cpuMatrix[x] = new Array(tmp.length);
    }
  }
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

  // Note: ES doesn't get along very well with objects inside arrays,
  // so we move the cpu metrics outside and make each of them a
  // separated array
  tmp = os.cpus();
  if (tmp && tmp.length > 0) {
    // Populate matrix with each cpu metric
    for (x = 0, xMax = tmp.length; x < xMax ; x++) {
      cpu = tmp[x];
      if (cpu && (cpu = cpu.times)) {
        cpuMatrix[0][x] = cpu.user;
        cpuMatrix[1][x] = cpu.nice;
        cpuMatrix[2][x] = cpu.sys;
        cpuMatrix[3][x] = cpu.idle;
        cpuMatrix[4][x] = cpu.irq;
      } else {
        // This should never happend, but if
        // set all values for that index to 0
        cpuMatrix[0][x] = cpuMatrix[1][x] = cpuMatrix[2][x] =
        cpuMatrix[3][x] = cpuMatrix[4][x] = 0;
      }
    }

    writeStream.write(',"osuser":[' + cpuMatrix[0] + ']');
    writeStream.write(',"osnice":[' + cpuMatrix[1] + ']');
    writeStream.write(',"ossys":['  + cpuMatrix[2] + ']');
    writeStream.write(',"osidle":[' + cpuMatrix[3] + ']');
    writeStream.write(',"osirq":['  + cpuMatrix[4] + ']');
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
  'osuser': '',
  'osnice': '',
  'ossys': '',
  'osidle': '',
  'osirq': '',
  'osmm': ''
};
