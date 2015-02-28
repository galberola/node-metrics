'use strict';

var os = require('os');

var config;
var metric;
var tmp;
var x;
var xMax;
var cpu;

function Module(options) {
  if (!options) {
    options = {};
  }

  options.memory = options.memory === false ? false : true;
  options.cpu = options.cpu === false ? false : true;
  options.loadavg = options.loadavg === false ? false : true;

  config = options;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric() {
  metric = '';

  /////////////////////////////
  // Track OS Memory reports //
  /////////////////////////////
  if (config.memory) {
    metric =   '"ostm":' + os.totalmem() +
              ',"osfm":' + os.freemem();
  }

  ////////////////////////
  // Track Load Average //
  ////////////////////////
  if (config.loadavg) {
    metric.length > 0 ? metric = metric + ',' : null;
    metric = metric + '"osavg":[' + os.loadavg() + ']';
  }

  ////////////////////
  // Track CPU Load //
  ////////////////////
  if (config.cpu) {
    tmp = os.cpus();
    if (tmp && tmp.length > 0) {
      metric.length > 0 ? metric = metric + ',' : null;
      metric = metric + '"oscpu":[';

      var first = true;
      for (x = 0, xMax = tmp.length; x < xMax ; x++) {
        cpu = tmp[x];
        if (cpu && (cpu = cpu.times)) {
          // If not the first element, separate jsons with ,
          if (!first) {
            metric = metric + ',';
          }
          metric = metric + '{' +
                      '"core":' + x         + ',' +
                      '"user":' + cpu.user  + ',' +
                      '"nice":' + cpu.nice  + ',' +
                      '"sys":'  + cpu.sys   + ',' +
                      '"idle":' + cpu.idle  + ',' +
                      '"irq":'  + cpu.irq   + ''  +
                    '}';
          // Notify that the next element is not the first one
          first = false;
        }
      }
      metric = metric + ']';
    }
  }

  return metric;
}

module.exports = function init(options) {
  return new Module(options);
}
