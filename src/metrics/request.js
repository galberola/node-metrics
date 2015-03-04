/**
 * Important!!!:
 *       Requires connect to register as middleware at the beginning
 *
 * It will register a middleware to track the connections.
 * It will track:
 *   - Created connections per tick
 *   - Ended connections per tick
 *   - Current concurrent connections at the momment of the tick
 *   - Max pick of concurrent connections per tick
 */
'use strict';

// tracks ammount of connections created during tick
var tickCreated = 0;
// tracks ammount of connections ended during tick
var tickEnded = 0;
// tracks ammount of connections
var currentConnections = 0;
// tracks peak of connections
var maxConcurrentConnections = 0;
var metric;
var isMetaMetricEnabled;
var tickTimeNs;
var tmp;

function Module(options, metametrics) {
  if (!options || !options.connect) {
    throw new Error('Using the requests_tracking requires connect');
  }

  // Register middleware
  options.connect.use(registerNewConnectionMiddleware);

  isMetaMetricEnabled = metametrics;
}

/**
 * Function invoked each time a new connection is recieved
 * @param  {SeverRequest}     req  The Http Request object
 * @param  {ServerResponse}   res  The Http Response object
 * @param  {middleware}       next The
 */
function registerNewConnectionMiddleware(req, res, next) {
  // Increase the ammount of connections
  currentConnections ++;
  // Increase the ammount of connections created on this tick
  tickCreated ++;

  // Check if in the actual peack the max connections has been exceded and
  // track it
  if (currentConnections > maxConcurrentConnections) {
    maxConcurrentConnections = currentConnections;
  }

  // Listen to the terminated connections to track ends and decrement
  // current connections
  res.on('finish', registerConnectionTerminated);
  //res.on('close', registerConnectionTerminated);

  /*
    'finish' is the gracefuly ended the socket, while 'close' it's the
    force close before .end was called.
    If a 'close' event occurs, it will trigger also a 'finish' producing
    negative results on current connections
   */

  // Call the next element in the chain
  next();
}

/**
 * Function invoked each time a connection has ended (gracefully or
 * with errors)
 */
function registerConnectionTerminated() {
  // Decrement the ammount of concurrent connections
  currentConnections --;
  // Increment the ammount of connections ended on this tick
  tickEnded ++;
}

/**
 * Retrieve the metrics that this module provides
 * @return {string} Data gathered
 */
Module.prototype.getMetric = function getMetric(writeStream) {
  // Meta-Metrics: Begin tracking time of tick loop
  isMetaMetricEnabled ? tickTimeNs = process.hrtime() : null;

  writeStream.write( '"rtn":' + tickCreated);
  writeStream.write(',"rte":' + tickEnded);
  writeStream.write(',"rtc":' + currentConnections);
  writeStream.write(',"rtm":' + maxConcurrentConnections);

  // max current connections track the peak on the tick only
  // so if the tick time is high, the peak is not lost on the metrics
  // reset max to current connections
  maxConcurrentConnections = currentConnections;

  // Also reset the per tick metrics
  tickCreated = tickEnded = 0;

  // Meta-Metrics: End tracking time of tick loop
  if (isMetaMetricEnabled) {
    tmp = process.hrtime(tickTimeNs);
    writeStream.write(',"rtmm":' + (tmp[0] * 1e9 + tmp[1]));
  }

  return metric;
}

module.exports.init = function init(options, metametrics) {
  return new Module(options, metametrics);
}

module.exports.keys = {
  'rtn': '',
  'rte': '',
  'rtc': '',
  'rtm': '',
  'rtmm': ''
};

