# EJDB benchmark

This benchmark is used to compare <a href="https://github.com/louischatriot/nedb" target="_blank">NeDB</a> to <a href="http://ejdb.org/" target="_blank">EJDB</a> (latest version). I use the same code I use to benchmark NeDB, with the necessary adaptations.

You need to `npm install` the dependencies to run the benchmarks. Use the `-n` option to specify dataset size (default: 10,000), for example `node benchmarks/find.js -n 5000` will run the benchmark with a collection of 5000 documents. Use the option `-i`to use indexes.


## Results

EJDB is much faster than NeDB on all operations except find and findOne:

With Index:
* Insert: EJDB 19200 ops/s VS NeDB 4200 ops/s,
* Find: EJDB 14100 ops/s VS NeDB 23600 ops/s
* FindOne: EJDB 13300 ops/s VS NeDB 24200 ops/s
* FindWithIn: EJDB 8400 ops/s VS NeDB 7200 ops/s
* Update: EJDB 11750 ops/s VS NeDB 3300 ops/s
* Remove: EJDB 7500 ops/s VS NeDB 2200 ops/s

Results are the average of 5 consequetive runs of the benchmark. These tests were run on a 2011 13' Macbook Air.

## Interpretation

Every operation has requires altering the database is much faster with EJDB. NeDB manages to be quite faster with simple queries but EJDB levels it out for more complicated queries. EJDB features a more capable query system which must not have optimizations for the simple cases.

These benchmarks were run with indexes. Without indexes, EJDB is faster for all operations.

This differnece in performance is easily explainable by the programming languange of each DB, EJDB is based on C while NeDB is pure Javascript.



