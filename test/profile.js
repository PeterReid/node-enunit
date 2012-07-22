var enunit = require('../enunit');

function profile(name, fn) {
  var start = process.hrtime();
  fn(function() {
    var diff = process.hrtime(start);
    console.log(name + ': ' + (diff[0]+diff[1]*1e-9));
  });
}

var repeats = 1000000;

profile('converstionFactor m/s to mph', function(cb) {
  var factor = enunit.conversionFactor('m/s', 'mile/hour');
  
  for (var i = 0; i < repeats; i++) {
    var x = factor * Math.random();
    if (x === Infinity) console.log('side effect')
  }
  cb();
});
profile('enunit-as m/s to mph', function(cb) {
  for (var i = 0; i < repeats; i++) {
    var x = enunit(Math.random(), 'm/s').as('mile/hour');
    if (x === Infinity) console.log('side effect')
  }
  cb();
});