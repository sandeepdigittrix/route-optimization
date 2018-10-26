/**
 * Modules from the community: package.json
 */
var defaultRequest = require('request');
var waitress       = require('waitress');
var check          = require('check-types');

/**
 * Internal modules
 */
var _makeRequest      = require('./utils/makeRequest');
var _assignParams     = require('./utils/assignParams');
var _jsonParser       = require('./utils/jsonParser');
var _encodePolyline   = require('./utils/encodePolylines');
var _getDefaultConfig = require('./config/getDefault');
var _constants        = require('./config/constants');


var ACCEPTED_CONFIG_KEYS = _constants.ACCEPTED_CONFIG_KEYS;
var GOOGLEMAPS_ENDPOINTS = _constants.GOOGLEMAPS_ENDPOINTS;
var MAX_REQUEST_LENGTHS  = _constants.MAX_REQUEST_LENGTHS;

var api = {
  directions:             require('./directions')
}



/**
 * Constructor
 */
var GoogleMapsAPI = function(config, request) {

  var pk = null;

  if (!check.object(config)) {
    config = {};
  }

  var clonedConfig = JSON.parse(JSON.stringify(config));

  if (clonedConfig['google_private_key'] != null) {
    pk = clonedConfig['google_private_key'];
    delete clonedConfig['google_private_key'];
  }

  /**
   * Calling _getDefaultConfig() inside the constructor ensure the config is not a singleton
   */
  this.config = _assignParams(_getDefaultConfig(), clonedConfig, ACCEPTED_CONFIG_KEYS);

  if (pk != null) {
    this.config['google_private_key'] = pk;
  }

  if (typeof request !== 'function') {
    request = defaultRequest;
  }

  this.request = request;

};

GoogleMapsAPI.prototype.directions = api.directions


/**
 * TODO this doesn't belong here
 * Helper function to check and convert an array of points, be it strings/numbers/etc
 * into the format used by Google Maps for representing lists of latitude/longitude pairs.
 *
 * This is call recursively
 */
GoogleMapsAPI.prototype.checkAndConvertArrayOfPoints = checkAndConvertPoint = function(input) {
  if ('string' === typeof input) {
    return input;
  }

  if (Array.isArray(input)) {
    var output = [];
    for (var i = 0; i < input.length; i++) {
      output.push(checkAndConvertPoint(input[i]));
    }
    return output.join('|');
  }

  throw new Error('Unrecognized input: checkAndConvertArrayOfPoints accepts Arrays and Strings');
};


/**
 * TODO this doesn't belong here
 * Helper function to check and convert an points, be it strings/arrays of numbers/etc
 * into the format used by Google Maps for representing latitude/longitude pairs
 */
GoogleMapsAPI.prototype.checkAndConvertPoint = function(input) {
  if ('string' === typeof input) {
    return input;
  }

  if (Array.isArray(input)) {
    return input[0].toString() + ',' + input[1].toString();
  }

  throw new Error('Unrecognized input: checkAndConvertPoint accepts Arrays of Numbers and Strings');
};


module.exports = GoogleMapsAPI;

// TODO improve this and move to a separate file
var _elevationFromPath = function(request, config, path, samples, callback, sensor) {

  var MAX_PATH_LENGTH = 1500;

  if (config.encode_polylines === true) {
    path = 'enc:' + _encodePolyline(path);
  }

  var args = {
    'path':    path,
    'samples': samples,
    'sensor': sensor || 'false'
  };

  var count = (path.length < MAX_PATH_LENGTH ? 1 : Math.ceil(path.length/MAX_PATH_LENGTH));


  if (count === 1) {

    _makeRequest(request, config, GOOGLEMAPS_ENDPOINTS['elevation'], args, _jsonParser(callback), MAX_REQUEST_LENGTHS['elevation']);

  } else {

    var done = waitress(count, function(err, results) {

      if (err) {
        if (typeof callback === 'function') {
          return callback(err);
        } else {
          throw err;
        }
      }

      results = results
        .sort(function(a, b) { return a.n - b.n; })
        .map(function(v) { return v.results; });

      var status = 'OK';
      var aggregated = [];
      results.forEach(function(result) {
        aggregated = aggregated.concat(result.results);
        if (result.status !== 'OK') {
          status = result.status;
        }
      });
      results = {
        results: aggregated,
        status: status
      };
      return callback(null, results);
    });

    path = path.split('|');
    var pieceSize = Math.ceil(path.length / count);
    var n = 0;

    while (path.length) {
      var smallerPath = path.splice(0, pieceSize);

      // google will throttle us if we launch all the requests together, so we have to stagger them.
      (function(n, path) {

        var samples = path.length;

        path = path.join('|');
        var cb = function(err, results) {
          if (err) {
            return done(err);
          }

          return done(null, { n: n, results: results });
        };

        setTimeout(function() {
          _elevationFromPath(request, config, path, samples, cb, sensor);
        }, Math.floor(Math.random() * config.stagger_time));

      })(++n, smallerPath);
    }
  }

};
