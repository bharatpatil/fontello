// Process errors, if happens.
// AND make default answer (for http)
//

'use strict';


var http = require('http');
var _    = require('lodash');


////////////////////////////////////////////////////////////////////////////////


module.exports = function (N) {

  N.wire.after([ 'responder:http', 'responder:rpc' ], { priority: 50 }, function error_process(env) {
    var err = env.err;

    if (!err) return;

    // Extend sugared errors
    // Example: next(404);
    if (err === +err) {
      err = env.err = { code: env.err };
    }


    if (_.isPlainObject(err) && err.code) {
      env.status = err.code;

      env.headers = _.defaults(err.head || {}, {
        'Content-Type': 'text/plain; charset=utf-8'
      });

      if (err.data && typeof err.data === 'object') {
        env.body = JSON.stringify(err.data);
      } else {
        env.body = err.message || '[' + err.code + '] ' + http.STATUS_CODES[err.code];
      }

      if (!err.message) {
        // For convenience. This details will be send later via RPC
        err.message = http.STATUS_CODES[err.code];
      }

      return;
    }

    // Still no code -> we got Error object or string
    // Example: next(new Error('Fatal fuckup'))

    var e = {
      code: N.io.APP_ERROR
    };

    // Add message if required
    if (N.environment === 'development') {
      e.message = '[500] ' + (err.stack || err.message || err.toString());
    } else {
      e.message = _.isString(err) ? ('[500]' + err) : '[500] Internal Server Error';
    }

    env.err = e;

    env.status = e.code;
    env.headers = { 'Content-Type': 'text/plain; charset=utf-8' };
    env.body = e.message;
  });
};
