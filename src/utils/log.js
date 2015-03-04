'use strict';

var enabled = process.env.METRICS_LOG || false;

function log(str) {
  if (enabled) {
    console.log('Node-Metrics: ' + str);
  }
}

module.exports = log;
