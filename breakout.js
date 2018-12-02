
var canvas = document.getElementById('breakoutCanvas');
var ctx = canvas.getContext('2d');
var startButton = document.getElementById("startButton");

var heartImg = new Image();
heartImg.src = 'images/heart.png';



class Ball {
  constructor(R, speed) {
    this.R = R;
    this.speed = speed;
  }

  resetPosition() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }

  resetSpeed() {
    // Angle between -Pi/4 and - 3 Pi/4
    var angle = -Math.PI * (1/4 + 1/2 * Math.random());
    this.dx = this.speed * Math.cos(angle);
    this.dy = this.speed * Math.sin(angle);
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.R, 0, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    ctx.fillStyle = '#FF0000';
    ctx.fill();
  }
}


/**
 * This code was copied from https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *         to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == 'undefined') {
  stroke = true;
  }
  if (typeof radius === 'undefined') {
  radius = 5;
  }
  if (typeof radius === 'number') {
  radius = {tl: radius, tr: radius, br: radius, bl: radius};
  } else {
  var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
  for (var side in defaultRadius) {
    radius[side] = radius[side] || defaultRadius[side];
  }
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) {
  ctx.fill();
  }
  if (stroke) {
  ctx.stroke();
  }
}

function rotateVector(x, y, angle){
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
  };
};

class Board {
  // border = {left: xx, right: yy} --> positions between which board can move
  constructor(x, y, width, height, border) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.xMin = border.left + width / 2;
    this.xMax = border.right - width / 2;
    this.speed = 4;
  }

  draw(ctx) {
    ctx.fillStyle = 'black';
    roundRect(ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 3, true, false);
  }

  isInBoard(x, y) {
    // Is the point at (x, y) inside the brick?
    return (
      x > this.x - this.width / 2 && 
      x < this.x + this.width / 2 && 
      y > this.y - this.height / 2 && 
      y < this.y + this.height / 2)
  }

  checkCollision(ball) {
    // Is the bottom of the ball touching the board?
    if (this.isInBoard(ball.x + ball.dx, ball.y + ball.dy + ball.R)) {
      ball.dy = -ball.dy;
      // rotate ball direction depending on where it touched the board
      var maxDeviation = Math.PI / 4;
      var maxAngle = Math.PI / 3;
      var deviation = 2 * (ball.x - this.x) / this.width * maxDeviation;
      var currentAngle = Math.atan(-ball.dx/ball.dy);
      if (Math.abs(currentAngle+deviation) > maxAngle){
        var newAngle = Math.sign(currentAngle + deviation) * maxAngle;
        deviation = newAngle - currentAngle;
      }

      var speed = rotateVector(ball.dx, ball.dy, deviation);
      ball.dx = speed.x;
      ball.dy = speed.y;
    }
  }

  setX(x) {
    this.x = Math.max(this.xMin, Math.min(x, this.xMax)); 
  }

};

class Brick {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.isAlive = true;
  }

  draw(ctx) {
    var pad = 2
    if (this.isAlive) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.x + pad/2, this.y + pad/2, this.width - pad/2, this.height - pad/2);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x + pad/2, this.y + pad/2, this.width - pad/2, this.height - pad/2);
    }
  }

  isInBrick(x, y) {
    // Is the point at (x, y) inside the brick?
    return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height)
  }

  checkCollision(ball) {
    // Check if the ball will collide into the brick at next move. 
    // If that's the case, update brick state and change ball direction.
    if (this.isAlive) {
      if (this.isInBrick(ball.x + ball.dx + ball.R, ball.y + ball.dy) ||
        this.isInBrick(ball.x + ball.dx - ball.R, ball.y + ball.dy)
      ){
        ball.dx = - ball.dx;
        this.isAlive = false;
        return true;
      } else if (
        this.isInBrick(ball.x + ball.dx, ball.y + ball.dy + ball.R) ||
        this.isInBrick(ball.x + ball.dx, ball.y + ball.dy - ball.R)
      ) {
        ball.dy = - ball.dy;
        this.isAlive = false;
        return true;
      }
    }
    return false;
  }
}

var STATE = {
  "BEFORE_LAUNCH": 1,
  "AFTER_LAUNCH": 2,
  "FINISHED": 3
}

function updateStates(g) {

  if (g.state === STATE.BEFORE_LAUNCH){
    // Keep the ball centered on the board
    g.ball.x = g.board.x;
    g.ball.y = g.board.y - g.board.height / 2 - g.ball.R / 2 - 2;
  }

  if (g.state === STATE.AFTER_LAUNCH){

    // ball on walls
    if (g.ball.x + g.ball.dx + g.ball.R > g.area.right || g.ball.x + g.ball.dx - g.ball.R < g.area.left) {
      g.ball.dx = -g.ball.dx;
    }
    if (g.ball.y + g.ball.dy - g.ball.R < g.area.top) {
      g.ball.dy = -g.ball.dy;
    }
    // ball against board
    g.board.checkCollision(g.ball);

    // ball against bricks
    for(var i = 0; i < g.bricks.length; i++){
      for(var j = 0; j < g.bricks[i].length; j++){
        if (g.bricks[i][j].checkCollision(g.ball)) {
          g.nActiveBricks--;
          g.score += 15;
          g.rerender = true;
        }
      }
    }

    // check if all bricks are destroyed
    if (g.nActiveBricks === 0) {
      updateLevel(g);
      initGameLevel(g);
    }

    // update g.ball position
    g.ball.x += g.ball.dx;
    g.ball.y += g.ball.dy;

    // g.ball lost
    if (g.ball.y - g.ball.R > canvas.height + 5) {
      g.lives -= 1;
      g.rerender = true;
      if (g.lives === 0){
        g.state = STATE.FINISHED;
      } else {
        g.state = STATE.BEFORE_LAUNCH;
      }
    }
  }
}

function updateLevel(g){
  g.level += 1;
  if (g.level > Breakout.Levels.length) {
    g.level = 1;
  }
}

function launchBall(){
  if (g.state === STATE.BEFORE_LAUNCH) {
    g.ball.resetSpeed();
    g.state = STATE.AFTER_LAUNCH;
  }
}

function bound(box) {
  box.left   = box.x;
  box.right  = box.x + box.w;
  box.top    = box.y;
  box.bottom = box.y + box.h;
  return box;
}

function getPlayArea(canvas, widthRatio, heightRatio) {
  var wPad = canvas.width * (1-widthRatio) / 2;
  var hPad = canvas.height * (1-heightRatio) / 2;
  return {
    top: hPad,
    bottom: canvas.height - hPad,
    left: wPad,
    right: canvas.width - wPad,
    width: canvas.width * widthRatio,
    height: canvas.height * heightRatio
  }
}

function initGame() {
  var AREA_RATIO = {x: 0.9, y: 0.8}; // Space occupied by the gameplay area in canvas

  var area = getPlayArea(canvas, AREA_RATIO.x, AREA_RATIO.y);
  var boardHeight = area.height / 40;
  var ball = new Ball(boardHeight/2, area.width / 250);
  
  var board = new Board(
    area.left + area.width / 2,
    area.bottom - boardHeight / 2,
    area.width / 6,
    boardHeight,
    {left: area.left, right: area.right}
  );

  var g = {
    ball: ball,
    board: board,
    lives: 3, 
    score: 0,
    level: 1,
    state: STATE.BEFORE_LAUNCH,
    area: area
  };
  resetGame(g);
  return g;
}

function resetGame(g){
  g.lives  = 3;
  g.score  =  0;
  initGameLevel(g);
}

function initGameLevel(g){
  var unit = g.area.width / Breakout.unitPerRow;

  // // Choose a random level
  // g.level = Math.floor(Math.random()*Breakout.Levels.length + 1);

  var layout = Breakout.Levels[g.level-1];
  var nrow = layout.bricks.length;
  var bricks = [];
  var nbricks = 0;

  for (var i=0; i < nrow; i++){
    var brickRow = [];
    var row = layout.bricks[i]
    var colStart = 0;
    while (colStart < row.length){
      if (row[colStart] === " "){
        colStart += 1;
      } else {
        var width = 1;
        while (colStart + width < row.length && row[colStart + width] == row[colStart]){
          width += 1;
        }
        var brick = new Brick(
          g.area.left + colStart * unit,
          g.area.top + i * unit,
          width * unit,
          unit,
          layout.colors[row[colStart].toLowerCase()]
        );
        brickRow.push(brick);
        nbricks++;
        colStart += width;
      }
    }
    bricks.push(brickRow);
  }

  g.bricks = bricks;
  g.nActiveBricks = nbricks;
  g.state  = STATE.BEFORE_LAUNCH;

  g.rerender = true;

  // Setting up game animation
  clearInterval(g.intervalId);
  g.intervalId = setInterval(animate, 10);
}

function renderToCanvas(width, height) {
  var cachedCanvas = document.createElement('canvas');
  cachedCanvas.width  = width;
  cachedCanvas.height = height;
  renderSlow(g, cachedCanvas.getContext('2d'));
  return cachedCanvas;
}

function pad(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}

/**
 * Rendering elements that do not change often.
 * (Bricks, score, lives)
 */
function renderSlow(g, ctx) {
  // bricks
  for(var i = 0; i < g.bricks.length; i++){
    for(var j = 0; j < g.bricks[i].length; j++){
      g.bricks[i][j].draw(ctx);
    }
  }
  // walls
  ctx.fillStyle = '#283747';
  ctx.fillRect(0, 0, g.area.left, g.area.bottom);
  ctx.fillRect(0, 0, canvas.width, g.area.top);
  ctx.fillRect(g.area.right, 0, g.area.left, g.area.bottom);

  // Lives
  ctx.fillStyle = 'black';
  ctx.font = "10px Arial";
  ctx.fillText("x" + g.lives, canvas.width - 15, canvas.height - 2);
  var heartSize = 8;
  ctx.drawImage(heartImg, canvas.width - 25, canvas.height - 2 - heartSize, heartSize, heartSize);
  // Score
  displayScore(g.score);

}

window.odometerOptions = {
  format: '(,ddd).ddd'
};

function displayScore(score){
  var size = 7;
  document.getElementById("score").innerHTML = score + Math.pow(10, size);
}

/**
 * Rendering elements that change often
 * (Ball, board)
 */
function renderFast(g, ctx) {
  g.ball.draw(ctx);
  g.board.draw(ctx);
}

function drawGame(g){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Use cached canvas if possible
  if (g.rerender) {
    g.canvas = renderToCanvas(canvas.width, canvas.height);
    g.rerender = false;
  }
  ctx.drawImage(g.canvas, 0, 0, canvas.width, canvas.height);
  // Render fast moving elements
  renderFast(g, ctx);
}

function animate() {
  // Drawing the elements
  drawGame(g);
  updateStates(g);
}

var g = initGame();

canvas.addEventListener('click', function(e){
  e.preventDefault();
  e.stopPropagation();
  
  if (g.state === STATE.BEFORE_LAUNCH){
    launchBall();
  }
});

canvas.addEventListener('touchstart', function(e){
  e.preventDefault();
  e.stopPropagation();
  
  if (g.state === STATE.BEFORE_LAUNCH){
    launchBall();
  }
});

function  getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,  // relationship bitmap vs. element for X
    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y  
  return {
    x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
    y: (evt.clientY - rect.top) * scaleY   // been adjusted to be relative to element
  }
}

canvas.addEventListener("mousemove", function(e){
  // Update board position according to mouse position
  var pos = getMousePos(canvas, e);
  g.board.setX(pos.x);
});

canvas.addEventListener("touchmove", function(e){
  // Update board position according to touch position
  e.preventDefault();
  var touch = e.changedTouches[0];
  var pos = getMousePos(canvas, touch);
  g.board.setX(pos.x);
});

startButton.addEventListener("click", function(e){
  resetGame(g);
});



/**
 * TODO: 
 *    - cleaning: put functions, variables, ... in a single struct
 *    - Add indications on how to play
 *    - Add ability to choose level at beginning 
 * 
 * 
 */
