
var canvas = document.getElementById('breakoutCanvas');
var ctx = canvas.getContext('2d');
// var startButton = document.getElementById("startButton");
var speedSelect = document.getElementById("speed");
var levelSelect = document.getElementById("level");

function disableControls(){
  levelSelect.disabled = true;
  speedSelect.disabled = true;
  // startButton.disabled = true;
}
function enableControls(){
  levelSelect.disabled = false;
  speedSelect.disabled = false;
  // startButton.disabled = false;
}

function hideInstruction(){
  document.getElementById("instructions").classList.add("hidden");
}
function showInstruction(){
  document.getElementById("instructions").classList.remove("hidden");
}

var Settings = {
  fillStyle: {
    ball: '#aa0308',
    wall: '#283747',
    score: '#d69a02',
    lives: '#d69a02',
    level: '#d69a02',
    board: 'black'
  },
  font: {
    level: '18px Arial',
    score: 'bold 18px Arial'
  },

  ball: {
    speed: {
      slow: 1.5,
      normal: 2,
      fast: 3.2
    }
  }

};


class Ball {
  constructor(R, speed) {
    this.R = R;
    this.speed = speed;
  }

  resetPosition() {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
  }

  /**
   * 
   * @param {String} speed any of 'easy', 'normal', 'hard'
   */
  updateSpeed(speed) {
    this.speed = Settings.ball.speed[speed];
    if (this.speed === undefined) {
      this.speed = Settings.ball.speed.normal;
    }
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
    ctx.fillStyle = Settings.fillStyle.ball;
    ctx.fill();
  }
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
    ctx.fillStyle = Settings.fillStyle.board;
    Utils.roundRect(ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 3, true, false);
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

      var speed = Utils.rotateVector(ball.dx, ball.dy, deviation);
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
};

var STATE = {
  "LEVEL_CHOICE": 1,
  "BEFORE_LAUNCH": 2,
  "AFTER_LAUNCH": 3,
  "FINISHED": 4
};

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
          g.score += 135;
          g.rerender = true;
        }
      }
    }

    // If all bricks are destroyed, go to next level
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
        showInstruction();
        enableControls();
        resetGame(g);
      } else {
        g.state = STATE.BEFORE_LAUNCH;
      }
    }
  }

  // Score with animation (increases progressively)
  if (g.vscore < g.score) {
    g.vscore = Math.min(g.score, g.vscore + 5); 
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
    disableControls();
    g.ball.resetSpeed();
    g.state = STATE.AFTER_LAUNCH;
  }
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

  var speed = Settings.ball.speed.normal;

  var ball = new Ball(boardHeight/2, speed * area.width / 250);
  
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

  // Getting speed and level from controls
  var level = document.getElementById("level").value
  var speed = document.getElementById("speed").value.toLowerCase()

  g.level = parseInt(level);
  g.ball.updateSpeed(speed);
  g.lives  = 3;
  g.score  = 0;
  g.vscore = 0;
  initGameLevel(g);
}

function initGameLevel(g){
  var unit = g.area.width / Breakout.unitPerRow;

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
  ctx.fillStyle = Settings.fillStyle.wall;
  ctx.fillRect(0, 0, g.area.left, g.area.bottom);
  ctx.fillRect(0, 0, canvas.width, g.area.top);
  ctx.fillRect(g.area.right, 0, g.area.left, g.area.bottom);

  // Lives
  ctx.fillStyle = Settings.fillStyle.lives;
  var lifeItem = {width: g.area.width * 0.07, height: g.area.top * 0.2, xPad: g.area.width * 0.01};
  for (var i=0; i<g.lives; i++){
    Utils.roundRect(
      ctx,
      g.area.left + g.area.width * 0.25 + i * (lifeItem.width + lifeItem.xPad),
      g.area.top/2 - lifeItem.height/2,
      lifeItem.width,
      lifeItem.height, 
      2, 
      true);
  }

  // Current level
  ctx.fillStyle = Settings.fillStyle.level;
  ctx.font = Settings.font.level;
  ctx.textAlign="end";
  ctx.textBaseline = 'middle';
  ctx.fillText("Level "+ Utils.pad(g.level,2), g.area.right, g.area.top/2);
}

/**
 * Rendering elements that change often
 * (Ball, board)
 */
function renderFast(g, ctx) {
  g.ball.draw(ctx);
  g.board.draw(ctx);
  // Score
  ctx.fillStyle = Settings.fillStyle.score;
  ctx.font = "bold 18px Arial";
  ctx.textBaseline = 'middle';
  ctx.fillText(Utils.pad(g.vscore, 7), g.area.left, g.area.top/2);
}

function drawGame(g){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Use cached canvas if possible
  if (g.rerender) {
    g.cachedCanvas = Utils.renderToCanvas(
      canvas.width, 
      canvas.height,
      function(ctx){renderSlow(g, ctx);}
    );
    g.rerender = false;
  }
  ctx.drawImage(g.cachedCanvas, 0, 0, canvas.width, canvas.height);
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
    hideInstruction();
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

canvas.addEventListener("mousemove", function(e){
  // Update board position according to mouse position
  var pos = Utils.getMousePos(canvas, e);
  g.board.setX(pos.x);
});

canvas.addEventListener("touchmove", function(e){
  // Update board position according to touch position
  e.preventDefault();
  var touch = e.changedTouches[0];
  var pos = Utils.getMousePos(canvas, touch);
  g.board.setX(pos.x);
});

// startButton.addEventListener("click", function(e){
//   resetGame(g);
// });
levelSelect.addEventListener("change", function(e){
  resetGame(g);
});
speedSelect.addEventListener("change", function(e){
  resetGame(g);
});


/**
 * TODO: 
 *    - cleaning: put functions, variables, ... in a single struct
 * 
 * 
 */
