var assert = require('assert');
var enunit = require('../enunit');

assert.deepEqual(enunit.parseUnitString('oz'), {oz: 1});
assert.deepEqual(enunit.parseUnitString('kg*m/s^2'), {kg: 1, m: 1, s: -2});
assert.deepEqual(enunit.parseUnitString('kg*m/s*s'), {kg: 1, m: 1, s: -2});
assert.deepEqual(enunit.parseUnitString(' m*m '), {m: 2});
assert.deepEqual(enunit.parseUnitString('m m'), {m: 2});
assert.deepEqual(enunit.parseUnitString('m^2'), {m: 2});
assert.deepEqual(enunit.parseUnitString('m^2'), {m: 2});
assert.deepEqual(enunit.parseUnitString('m/m'), {m: 0});
assert.deepEqual(enunit.parseUnitString('person hour/year'), {person: 1, hour:1, year:-1});
assert.deepEqual(enunit.parseUnitString('N*m'), {N: 1, m:1});
assert.deepEqual(enunit.parseUnitString('1 / m'), {m:-1});
assert.deepEqual(enunit.parseUnitString('m^2 s^2'), {m:2, s:2});
assert.deepEqual(enunit.parseUnitString('m ^ 2 s ^ 2'), {m:2, s:2});
assert.deepEqual(enunit.parseUnitString('m^2s^2'), {m:2, s:2});

assert.throws(function() { enunit.parseUnitString('*m'); });
assert.throws(function() { enunit.parseUnitString('m*'); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });

assert.deepEqual(
  enunit.resolveUnits({knot: {factor: 0.51444, basis: {meter: 1, second: -1}},
                       hour: {factor: 3600, basis: {second: 1}}},
                      {knot: 1, hour: 1}),
  {factor: .051444*3600,
   basis: { meter: 1 }});
  
  

var byteUnits = enunit.UnitSpace();
byteUnits.register('second');
byteUnits.register('byte');
byteUnits.register('kilobyte', 1024, 'byte');

