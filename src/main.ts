import { Application, Graphics } from "pixi.js";

class Grid {
  graph:Graphics;
  gridstate:number; // 0表示阻挡 1 表示不在视野 2 在视野
  x:number;
  y:number;
  size:number;
  constructor(size:number, x:number, y:number, state:number, app:Application) {
    this.graph = new Graphics();    
    app.stage.addChild(this.graph); // add the sprite to the stage
    this.gridstate = state;
    this.x = x;
    this.y = y;
    this.size = size; // todo 这个size 是正方形的边长， 应该是widt
    this.render();  
  }

  render():void{
    this.graph.clear();
    this.graph.rect(this.x, this.y, this.size, this.size);
    if (this.gridstate == 0) {
      this.graph.fill('#FF0000');
    } else if (this.gridstate == 1) {
      this.graph.fill('#cccccc');
    }else {
      this.graph.fill('#FFFFFF');
    }
  }

  changeState(state:number):void {
    if (state == this.gridstate) {
      return;
    }

    if (state == 1 || state == 2 || state == 0) {
      this.gridstate = state;
      this.render();
    } else {
      throw new Error("state is error, state:" + state);
    }       
  }
}

class GridMap {
  grids:Grid[][];
  width:number;
  height:number;
  gridsize:number;
  mouseDownX:number;
  mouseDownY:number;
  constructor(width:number, height:number, gridsize:number, app:Application) {
    this.width = width;
    this.height = height;
    this.gridsize = gridsize;
    this.grids = [];
    this.mouseDownX = 0;
    this.mouseDownY = 0;
    let row = Math.floor(height / gridsize);
    let col = Math.floor(width / gridsize);
    for (let i = 0; i <= row; i++) {
      let grids:Grid[] = [];
      for (let j = 0; j <= col; j++) {
        let state = Math.random() > 1.1 ? 0 : 1;
        grids.push(new Grid(gridsize, j * gridsize, i * gridsize, state, app));
      }
      this.grids.push(grids);
    }
  }

  addObstacle(x0:number, y0:number, x1:number, y1:number, state?:number):void {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1; // x 方向步进方向
    let sy = y0 < y1 ? 1 : -1; // y 方向步进方向
    let err = dx - dy;
    while (true) {
      this.grids[y0][x0].changeState(state || 0);
  
      if (x0 === x1 && y0 === y1) break; // 到达终点
  
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx; // x 方向步进
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy; // y 方向步进
      }
    }
  }

  isCollision(x:number, y:number):boolean {
    let row = Math.floor(y / this.gridsize);
    let col = Math.floor(x / this.gridsize);
    if (row < 0 || row >= this.grids.length || col < 0 || col >= this.grids[0].length) {
      return true;
    }
    return this.grids[row][col].gridstate == 0;
  }

  isVisible(x:number, y:number, grid:Grid):boolean {
    let x0 = Math.floor(x / this.gridsize);
    let y0 = Math.floor(y / this.gridsize);
    let x1 = Math.floor(grid.x / this.gridsize);
    let y1 = Math.floor(grid.y / this.gridsize);
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1; // x 方向步进方向
    let sy = y0 < y1 ? 1 : -1; // y 方向步进方向
    let err = dx - dy;
  
    while (true) {  
      if (x0 === x1 && y0 === y1) break; // 到达终点
      if (this.grids[y0][x0].gridstate == 0) {
        return false;
      }
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx; // x 方向步进
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy; // y 方向步进
      }
    }
    return true;
  }
  changeGrids(x:number, y:number, range:number, state:number):void {
    let left = Math.floor(Math.max(0, x - range) / this.gridsize);
    let right = Math.floor(Math.min(this.width, x + range) / this.gridsize);
    let top = Math.floor(Math.max(0, y - range) / this.gridsize);
    let bottom = Math.floor(Math.min(this.height, y + range) / this.gridsize);
    let r_sq = range * range;
    for (var ly = top; ly <= bottom; ly++) {
      for (var lx = left; lx <= right; lx++) {
        let dx = lx * this.gridsize - x + this.gridsize *0.5;
        let dy = ly * this.gridsize - y + this.gridsize *0.5;
        if (dx * dx + dy * dy <= r_sq && this.grids[ly][lx].gridstate != 0) {
          if (state != 2 || this.isVisible(x, y, this.grids[ly][lx]))
            this.grids[ly][lx].changeState(state);
        }
      }
    }
  }

  onMouseDown(e:MouseEvent):void {
    this.mouseDownX = e.clientX;
    this.mouseDownY = e.clientY;
  }

  onMouseUp(e:MouseEvent):void {
    let x = e.clientX;
    let y = e.clientY;
    let dx = Math.abs(x - this.mouseDownX);
    let dy = Math.abs(y - this.mouseDownY);
    if (dx <= this.gridsize && dy <= this.gridsize) {
      return;
    }

    let isx = Math.floor(clamp(this.mouseDownX, 0, this.width) / this.gridsize);
    let isy = Math.floor(clamp(this.mouseDownY, 0, this.height) / this.gridsize);
    let iex = Math.floor(clamp(x, 0, this.width) / this.gridsize);
    let iey = Math.floor(clamp(y, 0, this.height) / this.gridsize);   
    this.addObstacle(isx, isy, iex, iey);
  }
}

class Vector2 {
  x:number;
  y:number;
  constructor(x:number, y:number) {
    this.x = x;
    this.y = y;
  }

  normalize():void {
    let len = Math.sqrt(this.x * this.x + this.y * this.y);
    if (len > 0) {
      this.x = this.x / len;
      this.y = this.y / len;
    }
  }

  length():number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  add(v:Vector2):Vector2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  multiplyScalar(s:number):Vector2 {
    this.x *= s;
    this.y *= s;
    return this;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
class Player {
  position:Vector2;
  direction:Vector2;
  speed:number;
  radius:number;
  fovradius:number;
  graph:Graphics;
  constructor(x:number, y:number, speed:number, radius:number, fovradius:number, app:Application) {
    this.position = new Vector2(x, y);
    this.direction = new Vector2(0, 0);
    this.speed = speed;
    this.radius = radius;
    this.fovradius = fovradius;
    this.graph = new Graphics();
    this.graph.circle(x, y, radius);
    this.graph.fill('#00FF00');

    app.stage.addChild(this.graph);
  }

  onKeyDown(e:KeyboardEvent):void {
    if (e.code == "KeyA") {
      this.direction.x = -1;
    } else if (e.code == "KeyD") {
      this.direction.x = 1;
    }else if (e.code == "KeyW") {
      this.direction.y = -1;
    } else if (e.code == "KeyS") {
      this.direction.y = 1;
    }

    e.preventDefault();
  }

  onKeyUp(e:KeyboardEvent):void {
    if (e.code == "KeyA") {
      this.direction.x = 0;
    } else if (e.code == "KeyD") {
      this.direction.x = 0;
    }else if (e.code == "KeyW") {
      this.direction.y = 0;
    } else if (e.code == "KeyS") {
      this.direction.y = 0;
    }
    e.preventDefault();
  }
 
  update(delta:number, map:GridMap):void {
    this.direction.normalize();
    var pos = new Vector2(this.position.x, this.position.y);
    pos.add(this.direction.multiplyScalar(this.speed * delta));
    pos.x = clamp(pos.x, this.radius, map.width - this.radius);
    pos.y = clamp(pos.y, this.radius, map.height - this.radius);
    if (map.isCollision(pos.x + this.radius, pos.y)) {
      return;
    }
    if (map.isCollision(pos.x - this.radius, pos.y)) {
      return;
    }
    if (map.isCollision(pos.x, pos.y + this.radius)) {
      return;
    }
    if (map.isCollision(pos.x, pos.y - this.radius)) {
      return;
    }

    map.changeGrids(this.position.x, this.position.y, this.fovradius, 1);
    this.position = pos;
    map.changeGrids(this.position.x, this.position.y, this.fovradius, 2);
    this.graph.position.set(this.position.x, this.position.y);
    //console.log("pos:" + pos.x + "," + pos.y + "graph pos:" + this.graph.position.x + "," + this.graph.position.y);
  }
}


(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ width:800, height:800, background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  //const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  //const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  //bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  //bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  //app.stage.addChild(bunny);
  var map = new GridMap(app.screen.width, app.screen.height, 4, app);
  console.log("map:" + map.grids.length + "," + map.grids[0].length);
  var player = new Player(0, 0, 1, 8, 100, app);
  //map.addObstacle(10, 10, 50, 10);
  //map.addObstacle(40, 20, 40, 50);
  //map.addObstacle(30, 30, 60, 60);
  //map.addObstacle(120, 50, 90, 50);
  //map.addObstacle(40, 91, 40, 70);
  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    //bunny.rotation += 0.1 * time.deltaTime;
    player.update(time.deltaTime, map);
  });

  window.addEventListener("keydown", (e) => {
    player.onKeyDown(e);
  });

  window.addEventListener("keyup", (e) => {
    player.onKeyUp(e);
  });

  window.addEventListener("mousedown", (e) => {
    map.onMouseDown(e);
  });
  window.addEventListener("mouseup", (e) => {
    map.onMouseUp(e);
  });
})();
