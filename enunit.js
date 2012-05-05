var units = {};

function addBaseUnit(unit, type) {
  if (units[unit]) {
    throw new Error('Unit ' + unit + ' is already registered');
  }
  
  units[unit] = type;
}

// units may use any characters except ^, /, *, and whitespace, which are part of the syntax
var unitRegex = /^[^\d\^\*\s\/]+$/;

var parseUnitString = (function() {
  var termPattern = /^\s*(\*?)\s*([^\d\s\*\^\/]+)\s*(?:\^\s*(-?\d+))?\s*/;
  var onePattern = /^\s*1\s*$/;
  var slashPattern = /^([^\/]+)(?:\/([^\/]+))?$/; // Two anythings divided by a single slash
  
  var parseUnitProduct = function(s, sign, dest) {
    if (!s || onePattern.test(s)) return dest;
    
    var first = true;
    while (s) {
      var match = termPattern.exec(s);
      if (first) {
        if (match[1]) throw 'Unexpected "*" before other terms';
        first = false;
      } 
      if (!match) throw 'Invalid term starting at \"' + s + '\"';
      var unit = match[2];
      var exponent = parseInt(match[3],10) || 1;
      dest[unit] = (dest[unit]||0) + exponent*sign;
      s = s.substring(match[0].length);
    }
    
    return dest;
  };
  
  return function(s) {
    try {
      var match = slashPattern.exec(s);
      if (!match) throw 'Expected __/__ or __ format';
      
      return parseUnitProduct(match[1], 1, parseUnitProduct(match[2], -1, {}));
    } catch (msg) {
      throw new Error(msg + ' in unit string "' + s + '"');
    }
  };
}());

function resolveUnits(unitLookup, derivedPowers) {
  var factor = 1;
  var basis = {};
  for (var derivedUnit in derivedPowers) {
    var inBase = unitLookup[derivedUnit];
    if (!inBase) throw new Error('Unknown unit: ' + derivedUnit);
    
    var power = derivedPower[derivedUnit];
    factor *= Math.pow(inBase.factor, power);
    for (var baseUnit in inBase.basis) {
      basis[baseUnit] = (basis[baseUnit]||0) + power*inBase.basis[baseUnit];
    }
  }
  return {factor: factor, basis: basis};
}

// Like a namespace, but for units
function UnitSpace() {
  
  var units = {};
  var unitSpace = function(amount, unit) {
    
  };
  
  unitSpace.register = function(name, factor, equivalent) {
    if (equivalent) {
      // Derived unit
      
    } else {
      // Base unit
      if (units[name] && units[name]!=true) throw 'There is already a unit called "' + name + '"';    
      units[name] = true;
    }
  };
  return unitSpace;
};


addBaseUnit('m', 'length');
addBaseUnit('g', 'mass');
addBaseUnit('s', 'time');
addDerivedUnit('kg', 1000, 'g');
addDerivedUnit('N', 1, 'kg m/s^2');
addDerivedUnit('cm', 1/1000, 'm');
addDerivedUnit('in', 2.4, 'cm');
addDerivedUnit('ft', 12, 'inch');
addDerivedUnit('mi', 5280, 'ft');

var inUnit = function() {
}

//exports = inUnit;
//exports.parseUnitString = parseUnitString;
exports.parseUnitString = parseUnitString;
exports.UnitSpace = UnitSpace;
//var x = inUnit(5, 'm/s').times( inUnit(8, 's') ).as('miles')
//inUnit(4, 'ft').times( inUnit(6, 'm/s^2') ).as('m^2/s^2')