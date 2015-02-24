/**
 * Metrics module main entry point
 *
 * This is the heart. This is a passive tracking module, which means
 * that it will register on the app. but it will not affect any flow.
 *
 * Each defined interval will request all registered modules (if any) for
 * the metrics to be tracked. Those are writted into the write buffer
 *
 * Each metrics tracked represents a new line sepparated by characters
 */
'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');

var modules = [];
var config;
var writeStream;
var interval;
var tickTimeNs;
var x;
var xMax;


function NodeMetrics(options) {
  config = initDefaultOptions(options);

  log('Initializing');

  /////////////////////////////////
  // Metrics Module Registration //
  /////////////////////////////////
  if (config.eventQueueLag) {
    log('Registered metrics module Event Queue');
    modules.push(
      require('./modules/event_queue_lag')(config.eventQueueLag));
  }

  if (config.requestTracking) {
    log('Registered metrics module Request Tracking');
    modules.push(
      require('./modules/request_tracking')(config.requestTracking));
  }

  if (config.processTracking) {
    log('Registered metrics module Process Tracking');
    modules.push(
      require('./modules/process_tracking')(config.processTracking));
  }

  if (config.osTracking) {
    log('Registered metrics module OS Tracking');
    modules.push(
      require('./modules/os_tracking')(config.osTracking));
  }

  // Only launch interval if there is at least one module registered
  // And we are not in test mode. Test uses the _forceTick method
  // to have control over the ticks
  if (modules.length > 0 && config._test_mode !== true) {
    // Init the file stream to write metrics
    initStreamWriter();
    // Launch the interval to track metrics
    interval = setInterval(tick, config.tickTime * 1000);
    log('Tick interval set to ' + config.tickTime + ' second(s)');
  } else {
    log('No Modules were configured for metrics...');
  }
}

function log(str, master) {
  config.log ? console.log('Node-Metrics: ' + str) : null;
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
  options.metaMetricTickTime = options.metaMetricTickTime ? true : false;

  // Use the metrics path provided or use the defaul './metrics'
  options.metricsPath = options.metricsPath ?
                          options.metricsPath :
                          'metrics';

  return options;
}

/**
 * Initializes the stream that will be used to write the metrics
 */
function initStreamWriter() {
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
 * It will iterate over all the defined modules and gather the metrics
 * of each one of them. Those metrics are then persisted into the
 * writeStream
 */
function tick() {
  // Meta-Metrics: Begin tracking time of tick loop
  config.metaMetricTickTime ? tickTimeNs = process.hrtime() : null;

  // The first data saved is uptime
  writeStream.write('uptime:' + process.uptime());

  // Iterate over modules and gather metrics that are written in the stream
  for (x = 0, xMax = modules.length ; x < xMax ; x++ ) {
    writeStream.write('#' + modules[x].getMetric());
  }

  // Meta-Metrics: End tracking time of tick loop
  if (config.metaMetricTickTime) {
    x = process.hrtime(tickTimeNs);
    writeStream.write('#tk:' + (x[0] * 1e9 + x[1]));
  }

  // Add an EOL
  writeStream.write('\n');
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

module.exports = function init(options) {
  return new NodeMetrics(options);
}
