var BinaryHeap = require('./BinaryHeap');

/*
The basic unit of our landscape, a 0-dimensional point.
 */
var Point = function (x, y, z, W){
  this.x = x;
  this.y = y;
  this.z = z;
  this.isInLake = (z < W);
  this.lakeConnections = 0;
  this.connections = [];
};

//For convenience.
Point.prototype.toString = function (){
  return '(' + this.x + ',' + this.y + ')';
};

//Adds an edge.
Point.prototype.addEdge = function (point, landscape) {
  var edge = new Edge(this, point);
  this.connections.push(edge);
  point.connections.push(edge);
  landscape.allEdges.push(edge);
  return edge;
};

//Runs a DFS graph traversal; if the point is in a lake, finds the lake. If the point is on land, finds connected land.
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


/*
The edge with which we'll connect our points. Includes whether the connection is within a lake, as well as the grade.
 */
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


/*
Our landscape. We instantiate a point at each coordinate,
and then add edges to define the point's relationships to adjacent points.
 */
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

//Utility function to return point.
Landscape.prototype.getPoint = function (x, y) {
  return this.matrix[y][x];
};

//Utility function to determine if a point is in bounds.
Landscape.prototype.isInBounds = function (x, y) {
  return (x < this.x && x > -1 && y < this.y && y > -1);
};

//Utility function to determine if a point is on the perimeter of the landscape.
Landscape.prototype.isOnEdge = function(point) {
  return (point.x === 0 || point.y === 0 || point.x === this.x-1 || point.y === this.y-1);
};

/*
Uses the Point getConnected method to find all the lakes; if a point has already been included in a lake, it is skipped.
 */
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


/*
The real meat of the problem is in here. Since these are 0-dimensional points bounding the lake,
we must do the following for each lake:
1) Determine which points are on its perimeter.
2) Determine is there are any islands contained within.
  a) If there are no islands, find the vertices and calculate the area.
  b) If there are islands, we have to disentangle the island perimeter points from the lake perimeter points.
     Then we calculate the area of each island, the area of the lake and the islands, and subtract.
     This would be a lot easier if there were no islands.
3) Then we compare the calculated surface area to the largest found. Yes, this returns only the first lake found with that surface area.
4) Then we calculate volume. I've simplified this greatly by going to 1/4 resolution, that is, for each "in the water"
    connection, we add 1/4 of a column of water volume to the lake volume.
5) Compare volumes as before; return the results.
 */
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
      debugger;
      var volume = 0;
      lake.forEach(function(point){
        volume += (this.W - point.z) * (0.25 * (point.lakeConnections)/2); // 1/4 water column for each bit that's in the lake
      }, this);
      lake.volume = volume;
      if (lake.volume > largestVolume[0]) largestVolume = [lake.volume, lake];
    }
  }, this);

  return {largestVolume: largestVolume[1], largestSurface: largestSurface[1]};

};

//Utilty to calculate the center of a set of points.
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

//Utility function to sort points clockwise using the native JS sort.
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

//Utility function to determine if the point is on the perimeter.
function getPerimeter (points){

  return points.filter(function(point){

    if (point.connections.length < 4) return true; //if it's on the edge of the matrix
    
    for (var i = 0; i < point.connections.length; i++){
      //if it's an edge between water and land
      if (point.connections[i].point1.isInLake !== point.connections[i].point2.isInLake) return true;
    }

    return false;

  });

}

//Utility to return the vertices from a perimeter.
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

//Utility to discover the rectangular bound of a polygon.
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

/*
This function scans a bounding box row by row to find islands. If our pointer enters land and then leaves it, there's an island.
We return any islands found, using the Point getConnected method.
 */
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

//Calculate the area via triangulation.
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

/*
An implementation of A* to find the shortest motorable path, using a heuristic of shortest path disregarding grade.
 */
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

//This gets our landscape ready for our A* search.
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

module.exports = {point: Point, landscape: Landscape};