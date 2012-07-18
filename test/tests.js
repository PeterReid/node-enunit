var assert = require('assert');
var enunit = require('../enunit');

/*
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
assert.throws(function() { enunit.parseUnitString(''); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });
*/
// Try a custom UnitSpace
(function() {
  var byteUnits = enunit.UnitSpace();
  byteUnits.register('second');
  byteUnits.register('byte');
  byteUnits.register('kibibyte', 1024, 'byte');
  byteUnits.register('mebibyte', 1024, 'kibibyte');
  byteUnits.register('MiB', 1, 'mebibyte');
  byteUnits.register('minute', 60, 'second');
  byteUnits.register('hour', 60, 'minute');
  byteUnits.register('day', 24, 'hour');
  
  assert.equal(byteUnits(4, 'kibibyte/second').as('byte/second'), 4096);
  assert.throws(function() { byteUnits(4, 'byte').as('second'); });
  assert.equal(byteUnits(14, 'kibibyte/second').times( byteUnits(1, 'day') ).as('MiB'), 14*60*60*24/1024);
})();

function assertClose(x, y) {
  assert.ok(Math.abs(x-y) < 0.00001, x + ' ~= ' + y);
}


assertClose(enunit(1, 'gallon/hour').as('cm^3/second'), 1.05150327);
assertClose(enunit(1, 'mile/hour').as('ft/hour'), 5280);
assertClose(enunit(5, 'mile/hour').as('ft/second'), 5*5280/3600);
assertClose(enunit(1, 'mile/hour').times(enunit(1, 'hour')).as('mile'), 1);
