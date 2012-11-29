var assert = require('assert');
var enunit = require('../index');

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
assert.throws(function() { enunit.parseUnitString('/m'); });
assert.throws(function() { enunit.parseUnitString('m*'); });
assert.throws(function() { enunit.parseUnitString(''); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });
assert.throws(function() { enunit.parseUnitString('m/s/s'); });

// Try to add meters from two different UnitSpaces.
assert.throws(function() {
  var otherSpace = enunit.UnitSpace()
    .register('meter');
  
  otherSpace(1, 'meter').plus( enunit(1, 'meter') );
});

function parseUndoesFormat(units) {
  assert.deepEqual(enunit.parseUnitString( enunit.formatUnitString(units) ), units);
}

parseUndoesFormat({});
parseUndoesFormat({m: 4});
parseUndoesFormat({m: 1});
parseUndoesFormat({m: -1});
parseUndoesFormat({year: 1, person: 1});
parseUndoesFormat({meter: 1, second: -1});
parseUndoesFormat({meter: 1, second: -2});
parseUndoesFormat({meter: 2, kg: 1, second: -2, foot: -1});

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
assertClose(enunit(2, 'mile/hour').as('cm/minute'), 5364.48);
assertClose(enunit(4, 'meter/second').as('cm/minute'), 24000);
assertClose(enunit(360, 'degree').as('radian'), 2*Math.PI);
assertClose(enunit(1000, 'cup').as('meter^3'), 0.236588237);

assertClose(enunit(1, 'mile/hour').times(enunit(1, 'hour')).as('mile'), 1);
assertClose(enunit(1, 'mile/hour').times(1, 'hour').as('mile'), 1);
assertClose(enunit(1, 'mile/hour').times(1, 'hour').as('mile'), 1);

assertClose(enunit(20, 'mile').dividedBy(60, 'mile/hour').as('minute'), 20);

assertClose(enunit(2, 'foot').plus(12, 'inch').as('yard'), 1);
assertClose(enunit(23, 'hour').plus(59, 'minute').plus(60, 'second').as('day'), 1);
assertClose(enunit(2, 'mile/hour').plus(4, 'meter/second').as('cm/minute'), 29364.48);

assertClose(enunit.conversionFactor('mile', 'yard'), 1760);
assert.throws(function() { enunit.conversionFactor('inch', 'second'); });