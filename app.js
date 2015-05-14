




var test = [[2, 3, 7, 5, 3],
             [5, 6, 2, 4, 6],
             [0, 5, 2, 3, 4]];

var test2 = [[1,1,1,1,1,1],
              [1,1,1,1,5,1],
              [1,1,5,5,1,1],
              [1,1,5,5,1,1],
              [1,1,1,1,1,1]];

/*
create matrix of graph nodes
determine connections for each point and instantiate edges

 */

var Point = function (x, y, z, W){
  this.x = x;
  this.y = y;
  this.z = z;
  this.isInLake = (z < W);
  this.lakeConnections = 0;
  this.connections = [];
};

Point.prototype.toString = function (){
  return '(' + this.x + ',' + this.y + ')';
};

var Edge = function (point1, point2) {
  this.grade = Math.abs(point1.z - point2.z);
  this.point1 = point1;
  this.point2 = point2;
  this.isLake = (point1.isInLake && point2.isInLake);
  if (this.isLake){
    point1.lakeConnections++;
    point2.lakeConnections++;
  }
};

Point.prototype.addEdge = function (point, landscape) {
  var edge = new Edge(this, point);
  this.connections.push(edge);
  point.connections.push(edge);
  landscape.allEdges.push(edge);
  return edge;
};

Point.prototype.getConnected = function (visited) {
  var lake = [];

  var type = this.isInLake;

  findConnectedPoints(this);

  return lake;

  function findConnectedPoints (point) {
    
    lake.push(point);

    visited[point] = true; //using a JS object gives constant time lookup

    point.connections.forEach(function(edge){
      if (type === edge.isLake){
        if (lake.indexOf(edge.point1) === -1 && edge.point1.isInLake === type) findConnectedPoints(edge.point1);
        if (lake.indexOf(edge.point2) === -1 && edge.point2.isInLake === type) findConnectedPoints(edge.point2);
      }
    });
  }

};

var Landscape = function (matrix, W) {

  this.y = matrix.length;
  this.x = matrix[0].length;
  this.W = W;
  this.matrix = matrix;
  this.allPoints = []; //will simplify later iteration
  this.allEdges = [];

  this.matrix.forEach(function(row, y){
    row.forEach(function(z, x){
      row[x] = new Point(x, y, z, W);
      this.allPoints.push(row[x]);
    }, this);
  }, this);

  this.allPoints.forEach(function (point) {
    var x = point.x;
    var y = point.y;
    if (this.isInBounds(x+1, y)) point.addEdge(this.getPoint(x+1, y), this);
    if (this.isInBounds(x, y+1)) point.addEdge(this.getPoint(x, y+1), this);
  }, this);

};

Landscape.prototype.getPoint = function (x, y) {
  return this.matrix[y][x];
};

Landscape.prototype.isInBounds = function (x, y) {
  return (x < this.x && x > -1 && y < this.y && y > -1);
};

Landscape.prototype.isOnEdge = function(point) {
  return (point.x === 0 || point.y === 0 || point.x === this.x-1 || point.y === this.y-1);
};

Landscape.prototype.findLakes = function () {

  var visited = {};
  var lakes = [];

  this.allPoints.forEach(function(point){
    //the second half of this if statement handles a single-point lake,
    //which is missed because 
    if (point.isInLake && !visited.hasOwnProperty(point)) {
      lakes.push(point.getConnected(visited));
    }
  }, this);

  return lakes;

};

Landscape.prototype.findLargestLakes = function () {
  var lakes = this.findLakes();
  var largestSurface = [0,], largestVolume = [0,];

  lakes.forEach(function(lake){
    //we'll start with surface area
    //first, we need to detect if the lake has any islands in it
    
    var perimeter = getPerimeter(lake);
    var bounds = getBounds(perimeter); //defines the area to scan for islands
    var islands = detectIslands(this, bounds);
    var vertices;

    if (!islands.length) {
      vertices = getVertices(perimeter);
      lake.surfaceArea = calculateArea(vertices);
    } else{
      var islandArea = 0;
      
      islands.forEach(function(island){
        var islandPerimeter = getPerimeter(island);
        var islandVertices = getVertices(islandPerimeter);
        islandArea += calculateArea(islandVertices);
        perimeter = perimeter.filter(function(point){
          return islandVertices.indexOf(point) === -1; //returns true if the point isn't an island vertex
        });
      });

      vertices = getVertices(perimeter);
      lake.surfaceArea =  calculateArea(vertices) - islandArea;
    }
    
    if (lake.surfaceArea > largestSurface[0]) largestSurface = [lake.surfaceArea, lake];

    //on to volume! we'll use a rough approximation here, counting each point as 1/4 of the water column and not accounting for slope
    
    if (lake.surfaceArea === 0) lake.volume = 0; //can't have volume without surface area, although this does create some weird dead space that's not land or water in terms of volume calcs if there's a non-polygonal shape above water level
    else {
      var volume = 0;
      lake.forEach(function(point){
        volume += (this.W - point.z) * (0.25 * point.lakeConnections); // 1/4 water column for each bit that's in the lake
      }, this);
      lake.volume = volume;
      if (lake.volume > largestVolume[0]) largestVolume = [lake.volume, lake];
    }
  }, this);

  return {largestVolume: largestVolume[1], largestSurface: largestSurface[1]};

};

function calculateCenter (array) {
  
  var x = 0, y = 0;

  array.forEach(function(point){
    x += point.x;
    y += point.y;
  });

  x = x / array.length;
  y = y / array.length;

  return {x: x,y: y};

}

function clockwiseSortComparison (center, a, b){

  //simple quadrant comparison
  if (a.x - center.x >= 0 && b.x - center.x < 0) return -1; //a right of center, b left of center
  if (a.x - center.x < 0 && b.x - center.x >=0) return 1; //a left of center, b right of center
  if (a.x - center.x === 0 && b.x - center.x === 0){ //if they're on the center line
    if (a.y - center.y >=0 || b.y - center.y >= 0){
      return b.y - a.y;
    }
    return a.y - b.y;
  }

  //cross product of the vector between center and a/b
  vectorCP = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
  if (vectorCP < 0) return -1;
  if (vectorCP > 0) return 1;

  //if they're on the same line from the center, see which is closer
  var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
  var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
  if (d1 > d2) return -1;
  else return 1;

}

function getPerimeter (points){

  return points.filter(function(point){

    if (point.connections.length < 4) return true; //if it's on the edge of the matrix
    
    for (var i = 0; i < point.connections.length; i++){
      if (point.connections[i].point1.isInLake !== point.connections[i].point2.isInLake) return true;
    }

    return false;

  });

}

function getVertices (points) {

  if (points.length < 3) return points; //not a valid polygon

  var center = calculateCenter(points);
  points.sort(clockwiseSortComparison.bind(null, center));

  var vertices = [];

  var l = 2, m = 1, t = 0;

  var leadingPoint = points[l], middlePoint = points[m], trailingPoint = points[t];

  while (t < points.length){

    //simple test since all angles in the problem space are right angles
    if (leadingPoint.x !== trailingPoint.x || leadingPoint.y !== trailingPoint.y) vertices.push(middlePoint);

    l++, m++, t++;

    if (l > points.length-1) l = 0;
    if (m > points.length-1) m = 0;

    leadingPoint = points[l];
    middlePoint = points[m];
    trailingPoint = points[t];
  }

  return vertices;
};

function getBounds (points) {

  var north = Infinity, south = 0, east = 0, west = Infinity;

  points.forEach(function(point){
    if (point.x < west) west = point.x;
    if (point.x > east) east = point.x;
    if (point.y < north) north = point.y;
    if (point.y > south) south = point.y;
  });

  return {north: north, south: south, east: east, west: west};
}

function detectIslands (landscape, bounds){
  var islands = [], islandPoints = [], visitedIslandPoints = {};

  for (var y = bounds.north; y <= bounds.south; y++){
    var islandStart, potentialIslandPoints = [];
    potentialIslandPoints = [];
    for (var x = bounds.west; x <= bounds.east; x++){
      var point = landscape.getPoint(x,y);
      if (!point.isInLake && !islandStart) islandStart = point; //if we haven't hit land yet, and we hit it now, potential island
      if (islandStart && !point.isInLake) potentialIslandPoints.push(point); //keep track of potential 
      if (islandStart && point.isInLake){ //if we hit water again, we have an island
        islandPoints = islandPoints.concat(potentialIslandPoints);
        islandStart = undefined;
      }
    }
    islandStart = undefined;
  }

  islandPoints.forEach(function(point){
    if (!visitedIslandPoints.hasOwnProperty(point)){
      islands.push(point.getConnected(visitedIslandPoints));
    }
  });

  return islands.filter(function(island){
    var edge = false;
    island.forEach(function(point){
      if (landscape.isOnEdge(point)) edge = true;
    });
    return !edge;
  });

}

function calculateArea (vertices){

  if (vertices.length < 3) return 0; //can't find the area of nothin'!

  var n = vertices.length, area = 0;;

  vertices.push(vertices[0]); //close the polygon

  for (var i = 1, j = 2, k = 0; i < n; i++, j++, k++){
    area += vertices[i].x * (vertices[j].y - vertices[k].y);
  }

  area += vertices[n].x * (vertices[1].y - vertices[n-1].y); //once more

  return Math.abs(area/2);

}


//after I have perimeter points, find the bounding box around all.
//
//
//don't forget multiple island case
//you can use a second graph traversal that finds the full extent of the island


// var points = [{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:1}];
// var center = {x:0, y:0};

// console.log(points.sort(clockwiseSortComparison.bind(null, center)));
// 
// 
//
//a point is on an edge if any of its edges is not a lake
//a point is a vertex if it is on an edge and it is 
//

var landscape = new Landscape(test2, 5);
// console.log(landscape.findLakes());
var perimeter = getPerimeter(landscape.findLakes()[0]);
// console.log(perimeter.toString());
var bounds = getBounds(perimeter);
// console.log(bounds);
var islands = detectIslands(landscape, bounds);
// console.log(islands);

// var islandVertices = getVertices(islands[1]);

// var islandArea = calculateArea(islands[1]);
// console.log(islandArea);

console.log(landscape.findLargestLakes());