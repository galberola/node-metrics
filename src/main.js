/**
 * Metrics module main entry point
 *
 * This is the heart. This is a passive tracking module, which means
 * that it will register on the app. but it will not affect any flow.
 *
 * Each defined interval will request all registered metrics (if any) for
 * the metrics to be tracked. Those are writted into the write buffer
 *
 * Each metrics tracked represents a new line sepparated by characters
 */
'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');
var log = require('./utils/log');

var metrics = [];
var config;
var writeStream;
var interval;
var tickTimeNs;
var x;
var xMax;


function NodeMetrics(options) {
  config = initDefaultOptions(options);

  log('Initializing');
  log(JSON.stringify(options));

  /////////////////////////////////
  // Metrics Module Registration //
  /////////////////////////////////
  if (config.metrics.eventQueue !== false) {
    log('Registered metrics module Event Queue');
    metrics.push(
      require('./metrics/event_queue')
      .init(config.metrics.eventQueue, config.metaMetric));
  }

  if (config.metrics.request !== false) {
    log('Registered metrics module Request');
    metrics.push(
      require('./metrics/request')
      .init(config.metrics.request, config.metaMetric));
  }

  if (config.metrics.process !== false) {
    log('Registered metrics module Process');
    metrics.push(
      require('./metrics/process')
      .init(config.metrics.process, config.metaMetric));
  }

  if (config.metrics.os !== false) {
    log('Registered metrics module OS');
    metrics.push(
      require('./metrics/os')
      .init(config.metrics.os, config.metaMetric));
  }

  // Only launch interval if there is at least one module registered
  // And we are not in test mode. Test uses the _forceTick method
  // to have control over the ticks
  if (metrics.length > 0 && config._test_mode !== true) {
    // Init the file stream to write metrics
    initStreamWriter(config.stream);
    // Launch the interval to track metrics
    interval = setInterval(tick, config.tickTime * 1000);
    log('Tick interval set to ' + config.tickTime + ' second(s)');
  } else {
    log('No metrics matched criteria to be added to the interval...');
  }
}

/**
 * Initialize the default values for the configuration
 * @param  {object} options The configuration passed to the module
 * @return {object}         The configuration curated
 */
function initDefaultOptions(options) {
  if (!options) {
    options = {};
  }

  if (!options.metrics) {
    options.metrics = {};
  }

  // Init default values
  options.tickTime = options.tickTime;
  if (isNaN(options.tickTime) || options.tickTime < 1) {
    // Minimun tick is of 1 second
    options.tickTime = 1;
  }

  // Logs are disabled by default
  options.log = options.log ? true : false;

  // Meta-Metric: Add a metric of how much time in nano seconds
  // it takes to execute the metrics loop each tick
  options.metaMetric = options.metaMetric ? true : false;

  // Use the metrics path provided or use the defaul './metrics'
  options.metricsPath = options.metricsPath ?
                          options.metricsPath :
                          'metrics';

  return options;
}

/**
 * Initializes the stream that will be used to write the metrics
 */
function initStreamWriter(ws) {
  // Allow to pass a Stream Writer in the configuration and use that
  // instead of the File Default one
  if (ws) {
    // TODO: Check that ws is an actual Stream Writtable
    writeStream = ws;
    log('Metrics will be streamed to the Stream provided in the configuration');
    return;
  }

  // Generate a new file to stream the metrics
  var streamName = 'metrics-' + (new Date()).getTime();
  var filePath = path.join(config.metricsPath, streamName);

  log('Metrics will be streamed to: ' + filePath);

  // It will create the required folder structure /a/b/c/metrics-xxx if required
  // and it will create the file (touch)
  fse.ensureFileSync(filePath);

  writeStream = fs.createWriteStream(filePath);
}

/**
 * Function that will gather metrics each tick
 *
 * It will iterate over all the defined metrics and gather the metrics
 * of each one of them. Those metrics are then persisted into the
 * writeStream
 */
function tick() {
  // Meta-Metrics: Begin tracking time of tick loop
  config.metaMetric ? tickTimeNs = process.hrtime() : null;

  // Open JSON tag
  writeStream.write('{');

  // Iterate over metrics and gather metrics that are written in the stream
  for (x = 0, xMax = metrics.length ; x < xMax ; x++ ) {
    if (x > 0) {
      // Append # to the beginning of a new metric response
      writeStream.write(',')
    }
    metrics[x].getMetric(writeStream);
  }

  // Meta-Metrics: End tracking time of tick loop
  if (config.metaMetric) {
    x = process.hrtime(tickTimeNs);
    writeStream.write(',"mm":' + (x[0] * 1e9 + x[1]));
  }

  // Close JSON tag and add an EOL
  writeStream.write('}\n');
}

/**
 * Stops this module, stopping the interval for metrics and closing the
 * writeStream
 */
NodeMetrics.prototype.end = function end() {
  // Stop the interval ()
  if (interval) {
    clearInterval(interval);
    interval = null;
  }

  if (writeStream) {
    writeStream.end();
    writeStream = null;
  }
}

/**
 * Method for test purposes. We can force when to tick to track the exact
 * state of the metrics
 */
NodeMetrics.prototype._emmitTick = function _emmitTick() {
  // To prevent forcing ticks from outside the normal interval
  // if not in testing mode
  if (config._test_mode === true) {
    tick();
  }
}

module.exports.metrics = function init(options) {
  return new NodeMetrics(options);
}
