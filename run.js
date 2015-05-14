var Promise = require('bluebird');
var parseCSV = Promise.promisify(require('csv-parse'));
var prompt = require('prompt');
var fs = require('fs');
var Landscape = require('./app').landscape;

prompt.start();
console.log('This program will read a landscape from a file called data.csv in this directory.');
console.log('The CSV should be a matrix with equal length rows representing Z values.');
console.log('If you do not wish to supply a CSV, please edit the code and supply an array of values.');
console.log('The coordinates will be numbered in (x,y) format beginning with (0,0) in the upper left (quadrant IV).');
console.log('Or, run "npm test" to run automated tests.');

var file = fs.readFileSync(__dirname + '/data.csv');


parseCSV(file).then(function(data){
  data = data.map(function(row, rowIndex){
    try {
      return row.map(function(value, columnIndex){
        return parseInt(value,10);
      });
    } catch(e){throw new Error('Error - invalid value in row ' + rowIndex + ' at column ' + columnIndex);}
  });

  prompt.get([{
        name: 'W',
        required: true,
        description: 'Enter a water level value',
      }], function (err, result) {

        var landscape = new Landscape(data, parseInt(result.W,10));
        var lakes = landscape.findLakes();

        console.log('\nThere are ' + lakes.length + ' lakes.\n');

        lakes.forEach(function(lake, i){
          console.log('Lake ' + (i+1) + ': ', lake.toString(), '\n');
        });

        var largest = landscape.findLargestLakes();

        console.log('The largest lake by surface area is:');
        console.log(largest.largestSurface.toString());

        console.log('\nThe largest lake by volume is:');
        console.log(largest.largestVolume.toString());

        prompt.get([{
          name: 'G',
          required: true,
          type: 'number',
          description: 'Enter a gradient threshold'
        }, {
          name: 'startx',
          required: true,
          type: 'number',
          description: 'Enter a starting x coordinate'
        },{
          name: 'starty',
          required: true,
          type: 'number',
          description: 'Enter a starting y coordinate'
        },{
          name: 'endx',
          required: true,
          type: 'number',
          description: 'Enter an ending x coordinate'
        },{
          name: 'endy',
          required: true,
          type: 'number',
          description: 'Enter an ending y coordinate'
        }], function (err, result) {
          
          for (var key in result){
            result[key] = parseInt(result[key]);
          }

          path = landscape.findMotorablePath([result.startx, result.starty], [result.endx, result.endy], result.G);

          console.log('The shortest motorable path is: ', path.toString());

        });
    });

});