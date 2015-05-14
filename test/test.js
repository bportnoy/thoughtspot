var expect = require('chai').expect;
var app = require('../app');
var Point = app.point;
var Landscape = app.landscape;

describe('The graph objects', function(){
  var point1, point2, point3, landscape;

  beforeEach(function(){
    point1 = new Point(0, 2, 1, 2);
    point2 = new Point(0, 3, 7, 2);
    point3 = new Point(0, 1, 1, 2);
    landscape = new Landscape([[1, 1, 7]], 2);
  });

  it('Instantiates a point', function(){
    expect(point1.x).to.equal(0);
    expect(point1.y).to.equal(2);
    expect(point1.z).to.equal(1);
    expect(point1.isInLake).to.be.true;
    expect(point2.isInLake).to.be.false;
  });

  it('Connects two points', function(){
    expect(point1.connections).to.have.length(0);
    point1.addEdge(point2,landscape);
    expect(point1.connections).to.have.length(1);
    expect(point1.connections[0].grade).to.equal(6);
    expect(point1.connections[0].isLake).to.be.false;
    expect(point2.connections).to.have.length(1);
    point1.addEdge(point3,landscape);
    expect(point1.connections).to.have.length(2);
    expect(point1.connections[1].isLake).to.be.true;
    expect(point1.lakeConnections).to.equal(1);
  });  

});

describe('The Landscape', function(){
  var landscape;

  beforeEach(function(){
    landscape = new Landscape([[1,1,7]], 2);
  });

  it('Instantiates a landcape',function(){
    expect(landscape.x).to.equal(3);
    expect(landscape.y).to.equal(1);
    expect(landscape.W).to.equal(2);
    expect(landscape).to.have.property('allPoints').with.length(3);
    expect(landscape).to.have.property('allEdges').with.length(2);
  });

  it('Returns a point', function(){
    var point = landscape.getPoint(2,0);
    expect(point).to.exist;
    expect(point.x).to.equal(2);
    expect(point.y).to.equal(0);
  });

  it('Knows its own limits', function(){
    expect(landscape.isInBounds(2,2)).to.be.false;
    expect(landscape.isInBounds(1,0)).to.be.true;
    landscape = new Landscape([[0,0,0],
                                  [0,1,0],
                                  [0,0,0]]);
    expect(landscape.isOnEdge(1,1)).to.be.false;
  });

});

describe('The Lakes', function(){
  var landscape, lakes, land1, land2;

  var test = [[2, 3, 7, 5, 3],
               [5, 6, 2, 4, 6],
               [0, 5, 2, 3, 4]];

  var test2 = [[1,1,1,1,1,1],
                [1,1,1,1,5,1],
                [1,1,5,5,1,1],
                [1,1,5,5,1,1],
                [1,1,1,1,1,1]];

  var test3 = [[5,5,5,5,5,5,5,5,5,5],
                [5,5,1,1,5,5,5,-19,-19,5],
                [5,5,1,1,5,5,5,-19,-19,5],
                [5,5,5,5,5,5,5,5,5,5],
                [5,5,5,1,1,5,5,5,5,5],
                [5,5,5,1,1,5,5,5,5,5],
                [5,5,5,1,1,5,5,5,5,5],
                [5,5,5,1,1,1,1,5,5,5],
                [5,5,5,1,1,1,1,5,5,5],
                [5,5,5,5,5,5,5,5,5,5]];

  before(function(){
    land1 = new Landscape(test, 5);
    land2 = new Landscape(test2, 4);
    land3 = new Landscape(test3, 3);
  });

  it('Finds the correct number of lakes', function(){
    lakes = land1.findLakes();
    expect(lakes).to.have.length(4);
    lakes = land2.findLakes();
    expect(lakes).to.have.length(1);
  });

  it('Finds lakes accurately', function(){
    lakes = land1.findLakes();
    expect(lakes[0]).to.contain(land1.getPoint(0,0));
    expect(lakes[2]).to.contain(land1.getPoint(4,2));
    expect(lakes[2]).to.not.contain(land1.getPoint(0,0));
    lakes = land2.findLakes();
    expect(lakes[0]).to.contain(land2.getPoint(1,2));
    expect(lakes[0]).to.not.contain(land2.getPoint(2,2));
  });

  it('Finds the largest lates', function(){
    lakes = land3.findLargestLakes();
    expect(lakes.largestSurface).to.have.property('surfaceArea').that.equals(7.5);
    expect(lakes.largestVolume).to.have.property('volume').that.equals(22);
  });

  it('Handles islands within a lake', function(){
    lakes = land2.findLargestLakes();
    expect(lakes.largestSurface).to.have.property('surfaceArea').that.equals(16);
    expect(lakes.largestVolume).to.have.property('volume').that.equals(24.75);
  });

});

describe('Pathfinding', function(){
  var landscape, land1, land2, land3, path;
  var pathTest = [[1,1,1,1,5],
                    [3,1,5,1,5],
                    [3,1,5,1,1],
                    [3,1,5,5,1],
                    [1,1,5,1,1],
                    [1,1,1,1,5]];

  var pathTest2 = [[1,1,5,1,5],
                    [3,1,5,1,5],
                    [3,1,5,1,1],
                    [3,1,5,5,1],
                    [1,1,5,1,1],
                    [1,1,1,1,5]];

  var pathTest3 = [[1,1,5,1,5],
                    [3,5,5,1,5],
                    [3,1,5,1,1],
                    [3,1,5,5,1],
                    [1,1,5,1,1],
                    [1,1,1,1,5]];

  before(function(){
    land1 = new Landscape(pathTest, 5);
    land2 = new Landscape(pathTest2, 5);
    land3 = new Landscape(pathTest3, 5);
  });

  it('Finds the shortest path', function(){
    path = land1.findMotorablePath([0,0], [4,2], 1);
    expect(path).to.have.length(7);
    expect(path.toString()).to.equal('(0,0),(1,0),(2,0),(3,0),(3,1),(3,2),(4,2)');
  });

  it('Finds the shortest path, accounting for gradient', function(){
    path = land2.findMotorablePath([0,0], [4,2], 1);
    expect(path).to.have.length(13);
    expect(path.toString()).to.equal('(0,0),(1,0),(1,1),(1,2),(1,3),(1,4),(1,5),(2,5),(3,5),(3,4),(4,4),(4,3),(4,2)');
  });

  it('Returns an empty array if there is no path', function(){
    path = land3.findMotorablePath([0,0],[4,2], 1);
    expect(path).to.be.empty;
  });


});