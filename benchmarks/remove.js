var async = require('async')
  , execTime = require('exec-time')
  , profiler = new execTime('REMOVE BENCH')
  , commonUtilities = require('./commonUtilities')
  , config = commonUtilities.getConfiguration()
  , d = config.d
  , n = config.n
  ;

async.waterfall([
  function (cb) {
    if (config.program.withIndex) {
      d.ensureNumberIndex('bench', 'docNumber', function (err) {
        if (err) { return console.log("An error was encountered: ", err) };
        return cb();
      });
    } else
      return cb();
  }
, function (cb) { profiler.beginProfiling(); return cb(); }
, async.apply(commonUtilities.insertDocs, d, n, profiler)

// Test with remove only one document
, function (cb) { profiler.step('MULTI: FALSE'); return cb(); }
, async.apply(commonUtilities.removeDocs, d, n, profiler)
], function (err) {
  profiler.step("Benchmark finished");

  if (err) { return console.log("An error was encountered: ", err); }
});
