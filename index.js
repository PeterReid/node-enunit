﻿/* Units may use any characters except ^, /, *, and whitespace
 * (which are part of the syntax).
 */
var unitRegex = /^[^\d\^\*\s\/]+$/;

/* Parse a string into a map from unit strings to powers.
 * A rough grammar:
 *   UnitString = 1 | Terms | Terms/Terms
 *   Terms = Term [*] Term [*] Term ...
 *   Term = String | String^N
 *   String = (Anything except ^, /, *, or whitespace)+
 *
 * Whitespace is tolerated.
 *
 * Example: parseUnitString('kg*m/s^2') == {kg: 1, m: 1, s: -2}
 */
var parseUnitString = (function() {
  var termPattern = /^\s*(\*?)\s*([^\d\s\*\^\/]+)\s*(?:\^\s*(-?\d+))?\s*/;
  var onePattern = /^\s*1\s*$/;
  var slashPattern = /^([^\/]+)(?:\/([^\/]+))?$/; // Two anythings separated by a single slash
  
  var parseUnitProduct = function(s, sign, dest) {
    if (!s || onePattern.test(s)) return dest;
    
    var first = true;
    while (s) {
      var match = termPattern.exec(s);
      if (!match) throw 'Invalid term starting at \"' + s + '\"';
      if (first) {
        if (match[1]) throw 'Unexpected "*" before other terms';
        first = false;
      } 
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

/* Inverts parseUnitString (approximately), converting a units->power map to a string.
 *
 * Example: formatUnitString({mile: 1, hour: -1}) == 'mile / hour'
 */
var formatUnitString = (function() {
  var expString = function(name, exponent) {
    if (exponent === 1) {
      return name;
    }
    return name + '^' + exponent;
  };

  return function(basis){
    var u;
    var top = [];
    var bottom = [];
    for (var u in basis) {
      if (basis[u] < 0) bottom.push( expString(u, -basis[u]) );
      else top.push(expString(u, basis[u]))
    }
    
    top = top.length ? top.join('*') : '1';
    
    if (bottom.length) return top + ' / ' + bottom.join('*');
    return top;
  }
})();

/* Check if two unit -> power maps are equivalent.
 * (Not necessarily identical; {x: 0} is equivalent to {}.)
 */
function basesEqual(basis1, basis2) {
  var u;
  for (var u in basis1) {
    if (basis1[u] != basis2[u]) return false;
  }
  for (var u in basis2) {
    if (!(u in basis1) && basis2[u]) return false;
  }
  return true;
}

/* Combine two bases (string->int maps), adding (for direction=1) or 
 * subtracting (for direction=-1) their powers. 
 */
function combineBases(basis1, basis2, direction) {
  var u;
  var result = {};
  for (var u in basis1) {
    var sum = basis1[u] + (basis2[u]||0)*direction;
    if (sum) {
      result[u] = sum;
    }
  }
  for (var u in basis2) {
    if (!(u in basis1)) {
      result[u] = basis2[u]*direction;
    }
  }
  return result;
}

/* Throw a friendly error if the units represented by UnitedValues
 * v1 and v2 are different.  */
function ensureBasisMatch(v1, v2, op, preposition) {
  if (!basesEqual(v1.basis, v2.basis)) {
    throw new Error('Unit mismatch when ' + op + ' ' + formatUnitString(v1.basis) + ' ' + preposition + ' ' + formatUnitString(v2.basis) + '.');
  }
}

// Like a namespace, but for units
function UnitSpace() {
  var registered = {};
  var parsed = {}; // Cache of unit strings -> UnitedValues. 

  var unitSpace = function(amount, unitString) {
    var oneOfUnit = parsed[unitString] || (parsed[unitString] = resolveUnits(parseUnitString(unitString)));
    return new UnitedValue(amount*oneOfUnit.factor, oneOfUnit.basis)
  };
  
  var resolveUnits = function(derivedBasis) {
    var factor = 1;
    var basis = {};
    for (var derivedUnit in derivedBasis) {
      var inBase = registered[derivedUnit];
      if (!inBase) throw new Error('Unknown unit: ' + derivedUnit);
      
      var power = derivedBasis[derivedUnit];
      factor *= Math.pow(inBase.factor, power);
      for (var baseUnit in inBase.basis) {
        var basisPower = (basis[baseUnit]||0) + power*inBase.basis[baseUnit];
        if (basisPower === 0) {
          delete basis[baseUnit];
        } else {
          basis[baseUnit] = basisPower;
        }
      }
    }
    
    return new UnitedValue(factor, basis);
  };
  
  var UnitedValue = function(factor, basis) {
    this.factor = factor;
    this.basis = basis;
  };
  
  // Can be called in two ways
  // - arithmeticOp(UnitedValue)
  // - arithmeticOp(Number, unit string)
  function arithmeticOp(f) {
    return function(amount, unit) {
      var v = unit ? unitSpace(amount, unit) : amount;
      if (this.as !== v.as) throw new Error('UnitSpace mismatch between ' + this.toString() + ' and ' + v.toString());
      return f.call(this, v);
    }
  }
  
  UnitedValue.prototype = {
    plus: arithmeticOp(function(v) {
      ensureBasisMatch(this, v, 'adding', 'to');
      return new UnitedValue(this.factor + v.factor, this.basis);
    }),
    minus: arithmeticOp(function(v) {
      ensureBasisMatch(this, v, 'subtracting', 'from');
      return new UnitedValue(this.factor - v.factor, this.basis);
    }),
    times: arithmeticOp(function(v) {
      return new UnitedValue(this.factor * v.factor, combineBases(this.basis, v.basis, 1));
    }),
    dividedBy: arithmeticOp(function(v) {
      return new UnitedValue(this.factor / v.factor, combineBases(this.basis, v.basis, -1));
    }),
    as: function(unitString) {
      var destType = unitSpace(1, unitString);
      ensureBasisMatch(this, destType, 'interpreting', 'as');
      return this.factor / destType.factor;
    },
    toString: function() {
      return this.factor + ' ' + formatUnitString(this.basis);
    }
  };

  unitSpace.register = function(names, factor, equivalent) {
    if (typeof(names) === 'string') names = [names];
    
    for (var i = 0; i < names.length; i++) {
      if (!unitRegex.exec(names[i])) throw 'Invalid unit name: "' + names[i] + '"';
      if (registered[names[i]]) throw 'There is already a unit called "' + names[i] + '"';   
    }
    
    var definition;
    if (equivalent) { // Derived unit
      definition = unitSpace(factor, equivalent);
    } else { // Base unit 
      definition = { factor: 1, basis: {} };
      definition.basis[names[0]] = 1;
    }
    
    for (var i = 0; i < names.length; i++) {
      registered[names[i]] = definition;
    }
    
    return this;
  };
  
  unitSpace.conversionFactor = function(from, to) {
    return unitSpace(1, from).as(to);
  }
  
  unitSpace.converter = function(from, to) {
    var factor = this.conversionFactor(from, to);
    return function(amountOfFrom) {
      return factor * amountOfFrom;
    };
  };

  return unitSpace;
};


var standard = new UnitSpace()
  // Time
  .register(['second', 's'])
  .register(['minute', 'min'], 60, 's')
  .register(['hour', 'hr'], 60, 'minute')
  .register('day', 24, 'hour')

  // Mass
  .register(['gram', 'g'])
  .register(['kilogram', 'kg'], 1000, 'g')
  .register(['pound', 'lbs'], 0.45359237, 'kg')
  .register(['ounce', 'oz'], 1/16, 'pound')
  
  // Distance
  .register(['meter','m'])
  .register(['kilometer', 'km'], 1000, 'm')
  .register(['centimeter', 'cm'], 1/100, 'm')
  .register(['inch', 'in'], 2.54, 'cm')
  .register(['foot', 'ft'], 12, 'inch')
  .register('yard', 3, 'foot')
  .register(['mile', 'mi'], 5280, 'ft')
  .register(['nauticalMile', 'nmi', 'NM', 'M'], 1852, 'meter')
  
  // Area
  .register('acre', 1/640, 'mi^2')
  
  // Volume
  .register(['milliliter', 'ml'], 1, 'cm^3')
  .register('liter', 1000, 'milliliter')
  .register(['centiliter', 'cl'], 1/100, 'liter')
  .register('gallon', 231, 'in^3') // US liquid gallon
  .register('quart', 1/4, 'gallon') 
  .register('pint', 1/8, 'gallon') 
  .register('cup', 1/2, 'pint')
  
  // Force
  .register(['Newton', 'newton', 'N'], 1, 'kg m/s^2')

  // Angle
  .register(['radian', 'rad'])
  .register(['degree', 'deg', '°'], Math.PI/180, 'radian')
;

module.exports = standard;
module.exports.UnitSpace = UnitSpace;
module.exports.parseUnitString = parseUnitString;
module.exports.formatUnitString = formatUnitString;
