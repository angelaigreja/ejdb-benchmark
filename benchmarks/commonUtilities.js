/**
 * Functions that are used in several benchmark tests
 */

var EJDB = require('ejdb')
  , fs = require('fs')
  , executeAsap   // process.nextTick or setImmediate depending on your Node version
  ;

try {
  executeAsap = setImmediate;
} catch (e) {
  executeAsap = process.nextTick;
}


/**
 * Configure the benchmark
 */
module.exports.getConfiguration = function () {
  var d, n
    , program = require('commander')
    ;

  program
    .option('-n --number [number]', 'Size of the collection to test on', parseInt)
    .option('-i --with-index', 'Use an index')
    .parse(process.argv);

  n = program.number || 10000;

  console.log("----------------------------");
  console.log("Test with " + n + " documents");
  console.log(program.withIndex ? "Use an index" : "Don't use an index");
  console.log("----------------------------");
  
  try{
    fs.mkdirSync('db');
  }
  catch(e){
    //catch and just suppress error
    console.log(e);
  }
  d = EJDB.open("db/bench_test", EJDB.JBOWRITER | EJDB.JBOCREAT | EJDB.JBOTRUNC);

  return { n: n, d: d, program: program };
};



/**
 * Return an array with the numbers from 0 to n-1, in a random order
 * Uses Fisher Yates algorithm
 * Useful to get fair tests
 */
function getRandomArray (n) {
  var res = []
    , i, j, temp
    ;

  for (i = 0; i < n; i += 1) { res[i] = i; }

  for (i = n - 1; i >= 1; i -= 1) {
    j = Math.floor((i + 1) * Math.random());
    temp = res[i];
    res[i] = res[j];
    res[j] = temp;
  }

  return res;
};
module.exports.getRandomArray = getRandomArray;


/**
 * Insert a certain number of documents for testing
 */
module.exports.insertDocs = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    ;

  profiler.step('Begin inserting ' + n + ' docs');

  function runFrom(i) {
    if (i === n) {   // Finished
      d.sync();//TO be sure it syncs
      console.log("===== RESULT (insert) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      profiler.step('Finished inserting ' + n + ' docs');
      return cb();
    }

    d.save('bench',{ docNumber: order[i] }, function (err, oids) {
      if (err) {
        console.error(err);
        return;
      }
      executeAsap(function () {
        runFrom(i + 1);
      });
    });
  }
  runFrom(0);
};


/**
 * Find documents with find
 */
module.exports.findDocs = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    ;

  profiler.step("Finding " + n + " documents");

  function runFrom(i) {
    if (i === n) {   // Finished
      console.log("===== RESULT (find) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      profiler.step('Finished finding ' + n + ' docs');
      return cb();
    }

    d.find('bench', { docNumber: order[i] }, function (err, cursor, count) {
      cursor.next();
      if ( count !== 1 || cursor.field('docNumber') !== order[i]) { return cb('One find didnt work'); }
      cursor.close();
      executeAsap(function () {
        runFrom(i + 1);
      });
    });
  }
  runFrom(0);
};


/**
 * Find documents with find and the $in operator
 */
module.exports.findDocsWithIn = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    , ins = [], i, j
    , arraySize = Math.min(10, n)   // The array for $in needs to be smaller than n (inclusive)
    ;

  // Preparing all the $in arrays, will take some time
  for (i = 0; i < n; i += 1) {
    ins[i] = [];
    
    for (j = 0; j < arraySize; j += 1) {
      ins[i].push((i + j) % n);
    }
  }
      
  profiler.step("Finding " + n + " documents WITH $IN OPERATOR");

  function runFrom(i) {
    if (i === n) {   // Finished
      console.log("===== RESULT (find with in selector) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      profiler.step('Finished finding ' + n + ' docs');
      return cb();
    }

    d.find('bench', { docNumber: { $in: ins[i] } }, function (err, cursor, count) {
      if (count !== arraySize) { return cb('One find didnt work'); }
      cursor.close();
      executeAsap(function () {
        runFrom(i + 1);
      });
    });
  }
  runFrom(0);
};


/**
 * Find documents with findOne
 */
module.exports.findOneDocs = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    ;

  profiler.step("FindingOne " + n + " documents");

  function runFrom(i) {
    if (i === n) {   // Finished
      console.log("===== RESULT (findOne) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      profiler.step('Finished finding ' + n + ' docs');
      return cb();
    }

    d.findOne('bench', { docNumber: order[i] }, function (err, doc) {
      if (!doc || doc.docNumber !== order[i]) { return cb('One find didnt work'); }
      executeAsap(function () {
        runFrom(i + 1);
      });
    });
  }
  runFrom(0);
};


/**
 * Update documents
 * options is the same as the options object for update
 */
module.exports.updateDocs = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    ;

  profiler.step("Updating " + n + " documents");

  function runFrom(i) {
    if (i === n) {   // Finished
      d.sync();//TO be sure it syncs
      console.log("===== RESULT (update) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      profiler.step('Finished updating ' + n + ' docs');
      return cb();
    }

    // Will not actually modify the document but will take the same time
    d.update('bench', { docNumber: order[i] , $upsert: { docNumber: order[i] } }, function (err, count) {
      if (err) { return cb(err); }
      if (count !== 1) { return cb('One update didnt work'); }
      executeAsap(function () {
        runFrom(i + 1);
      });
    });
  }
  runFrom(0);
};


/**
 * Remove documents
 * options is the same as the options object for update
 */
module.exports.removeDocs = function (d, n, profiler, cb) {
  var beg = new Date()
    , order = getRandomArray(n)
    ;

  profiler.step("Removing " + n + " documents");

  function runFrom(i) {
    if (i === n) {   // Finished
      d.sync();//TO be sure it syncs
      console.log("===== RESULT (1 remove + 1 insert) ===== " + Math.floor(1000* n / profiler.elapsedSinceLastStep()) + " ops/s");
      console.log("====== IMPORTANT: Please note that this is the time that was needed to perform " + n + " removes and " + n + " inserts");
      console.log("====== The extra inserts are needed to keep collection size at " + n + " items for the benchmark to make sense");
      console.log("====== Use the insert speed logged above to calculate the actual remove speed, which is higher (should be significantly so if you use indexing)");
      profiler.step('Finished removing ' + n + ' docs');
      return cb();
    }

    d.find('bench', { docNumber: order[i], $dropall : true }, {$onlycount: true}, function (err, cursor, count) {
      if (err) { return cb(err); }
      if (count !== 1) { return cb('One remove didnt work'); }
      d.save('bench', { docNumber: order[i] }, function (err, oids) {   // We need to reinsert the doc so that we keep the collection's size at n
                                                           // So actually we're calculating the average time taken by one insert + one remove
        executeAsap(function () {
          runFrom(i + 1);
        });
      });
    });
  }
  runFrom(0);
};




