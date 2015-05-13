var BinaryHeap = require('./BinaryHeap');



var test = [[2, 3, 7, 5, 3],
             [5, 6, 2, 4, 6],
             [0, 5, 2, 3, 4]];

var test2 = [[1,1,1,1,1,1],
              [1,1,1,1,1,1],
              [1,1,4,4,1,1],
              [1,1,4,4,1,1],
              [1,1,1,1,1,1]];

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

/*
create matrix of graph nodes
determine connections for each point and instantiate edges

 */

var Point = function (x, y, z, W){
  this.x = x;
  this.y = y;
  this.z = z;
  this.isInLake = (z < W);
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
};

Point.prototype.addEdge = function (point, landscape) {
  var edge = new Edge(this, point);
  this.connections.push(edge);
  point.connections.push(edge);
  landscape.allEdges.push(edge);
  return edge;
};

Point.prototype.getLake = function (visited, W) {
  var lake = {
    points: [],
    volume: 0
  };

  findLakePoints(this);

  lake.surfaceArea = lake.points.length;

  return lake;

  function findLakePoints (point) {
    
    lake.points.push(point);
    lake.volume += (W - point.z);
    visited.push(point);

    point.connections.forEach(function(edge){
      if (edge.isLake){
        if (lake.points.indexOf(edge.point1) === -1) findLakePoints(edge.point1);
        if (lake.points.indexOf(edge.point2) === -1) findLakePoints(edge.point2);
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
  this.lakes = undefined;

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

Landscape.prototype.findLakes = function () {

  if (this.lakes) return this.lakes; //rudimentary memoization

  var visited = [];
  var lakes = [];

  this.allPoints.forEach(function(point){
    if (point.isInLake && visited.indexOf(point) === -1) {
      lakes.push(point.getLake(visited, this.W));
    }
  }, this);

  this.lakes = lakes;

  return lakes;

};

//returns the largest lakes by surface area and volume.
//Known limitation: only returns the first lake discovered with that largest SA or volume.
Landscape.prototype.findLargestLakes = function () {
  var lakes = this.findLakes();
  var largestSurface = [0,], largestVolume = [0,];

  lakes.forEach(function(lake){
    if (lake.volume > largestVolume[0]) largestVolume = [lake.volume,lake];
    if (lake.surfaceArea > largestSurface[0]) largestSurface = [lake.surfaceArea,lake];
  });

  return {'Largest Surface Area': largestSurface[1], 'Largest Volume': largestVolume[1]};

};

Landscape.prototype.findMotorablePath = function (start, end, G){

  initAstar(this);

  start = this.getPoint(start[0],start[1]);
  end = this.getPoint(end[0],end[1]);

  var open = new BinaryHeap(function(point){
    return point.f;
  });

  open.push(start);

  while(open.size()){
    var current = open.pop();

    //if we've reached the end, return the path
    if (current === end){
      var path = [];
      while (current.parent){
        path.push(current);
        current = current.parent;
      }
      path.push(start); //for clarity's sake
      return path.reverse();
    }

    //if not, let's begin our search
    current.closed = true;

    var adjacent = [];

    current.connections.forEach(function(edge){
      if (edge.grade < G){
        adjacent.push(edge.point1 === current ? edge.point2 : edge.point1); //push the node on the other side of the edge
      }
    });

    adjacent.forEach(function(point){

      if (point.closed) return; //invalid point to process, equivalent to 'continue' in a for loop

      var gScore = current.g + point.cost,
      previouslyVisited = point.visited;

      //if we haven't visited, or the gscore is better, rescore the point
      if (!previouslyVisited || gScore < point.g){
        point.visited = true;
        point.parent = current;
        point.h = point.h || basicDistance(point, end);
        point.g = gScore;
        point.f = point.g + point.h;
      }

      //if we've visited it before, it's on the heap - but we need to rescore it
      //if we haven't, push it onto the heap
      previouslyVisited ? open.rescoreElement(point) : open.push(point);

    });
  }

  return []; // no path found

};

function initAstar (landscape){
  landscape.allPoints.forEach(function(point){
    point.f = 0;
    point.g = 0;
    point.h = 0;
    point.cost = 1;
    point.visited = false;
    point.closed = false;
    point.parent = null;
  });
}

//used as the A* heuristic, this gives the distance between two points traveling on grid lines
function basicDistance (a, b) {
  var d1 = Math.abs(a.x - b.x);
  var d2 = Math.abs(a.y - b.y);
  return d1 + d2;
}

// function calculateCenter (array) {
  
//   var x = 0, y = 0;

//   array.forEach(function(point){
//     x += point.x;
//     y += point.y;
//   });

//   x = x / array.length;
//   y = y / array.length;

//   return {x: x,y: y};

// }

// function clockwiseSortComparison (center, a, b){

//   //simple quadrant comparison
//   if (a.x - center.x >= 0 && b.x - center.x < 0) return -1; //a right of center, b left of center
//   if (a.x - center.x < 0 && b.x - center.x >=0) return 1; //a left of center, b right of center
//   if (a.x - center.x === 0 && b.x - center.x === 0){ //if they're on the center line
//     if (a.y - center.y >=0 || b.y - center.y >= 0){
//       return b.y - a.y;
//     }
//     return a.y - b.y;
//   }

//   //cross product of the vector between center and a/b
//   vectorCP = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
//   if (vectorCP < 0) return -1;
//   if (vectorCP > 0) return 1;

//   //if they're on the same line from the center, see which is closer
//   var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
//   var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
//   if (d1 > d2) return -1;
//   else return 1;

// }

// function calculateArea (points) {

// }

// function getPerimeter (points){

//   return points.filter(function(point){
//     var permieter = false;
//     point.connections.forEach(function(edge){
//       if (!edge.isLake) perimeter = true;
//     });
//     return perimeter;
//   });

// }



// var points = [{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1},{x:1,y:1}];
// var center = {x:0, y:0};

// console.log(points.sort(clockwiseSortComparison.bind(null, center)));
// 
// 
//
//a point is on an edge if any of its edges is not a lake
//a point is a vertex if it is on an edge and it is 
//

// var landscape = new Landscape(test, 5);
// console.log(landscape.findLakes());
// console.log(landscape.findLargestLakes());

var landscape = new Landscape(pathTest,5);
console.log(landscape.findMotorablePath([0,0], [4,2], 1).toString());
var landscape = new Landscape(pathTest2,5);
console.log(landscape.findMotorablePath([0,0], [4,2], 1).toString());