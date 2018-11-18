
var canvas = document.getElementById('breakoutCanvas');
var ctx = canvas.getContext('2d');
var startButton = document.getElementById("startButton");

var ControlKeyCodes = {37: "LEFT", 39: "RIGHT", 32: "SPACE"}

var heartImg = new Image();
heartImg.src = 'images/heart.png';


class Ball {
    constructor(x , y, dx, dy) {
        if (x===undefined){
            this.resetPosition();
        } else {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;   
        }
        this.R = 5;
    }

    resetPosition() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }

    resetSpeed() {
        var speed = 2;
        // Angle between -Pi/4 and - 3 Pi/4
        var angle = -Math.PI * (1/4 + 1/2 * Math.random());
        this.dx = speed * Math.cos(angle);
        this.dy = speed * Math.sin(angle);
        console.log("dy", this.dy);
    }

    draw() {
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
 *                 to specify different radii for corners
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
    constructor(x, width) {
        this.x = x;
        this.width = width;
        this.height = 5;
        this.y = canvas.height - this.height / 2 - 10;
        this.speed = 4;
    }

    draw() {
        ctx.fillStyle = 'black';
        roundRect(ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 3, true, false);
        // ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
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
            var angle = 2 * (ball.x - this.x) / this.width * maxDeviation;
            var speed = rotateVector(ball.dx, ball.dy, angle);
            console.log((ball.x - this.x) / this.width);
            ball.dx = speed.x;
            ball.dy = speed.y;
        }
    }

    setX(x) {
        var xMax = canvas.width - this.width / 2;
        var xMin = this.width / 2;
        this.x = Math.max(xMin, Math.min(x, xMax)); 
    }

};

class Brick {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isAlive = true;
    }

    draw() {
        var pad = 2
        if (this.isAlive) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x + pad/2, this.y + pad/2, this.width - pad/2, this.height - pad/2);
            ctx.fillStyle = 'blue';
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
        g.ball.y = g.board.y - g.board.height / 2 - g.ball.R / 2 - 3;
    }

    if (g.state === STATE.AFTER_LAUNCH){

        // ball on walls
        if (g.ball.x + g.ball.dx + g.ball.R > canvas.width || g.ball.x + g.ball.dx - g.ball.R < 0) {
            g.ball.dx = -g.ball.dx;
        }
        if (g.ball.y + g.ball.dy - g.ball.R < 0) {
            g.ball.dy = -g.ball.dy;
        }
        g.board.checkCollision(g.ball);

        var nrow = g.bricks.length;
        var ncol = g.bricks[0].length;
        for(var i = 0; i < nrow; i++){
            for(var j = 0; j < ncol; j++){
                g.bricks[i][j].checkCollision(g.ball);
            }
        }

        // update g.ball position
        g.ball.x += g.ball.dx;
        g.ball.y += g.ball.dy;

        // g.ball lost
        if (g.ball.y - g.ball.R > canvas.height + 5) {
            g.lives -= 1;
            if (g.lives === 0){
                g.state = STATE.FINISHED;
            } else {
                g.state = STATE.BEFORE_LAUNCH;
            }
        }
    }

}

function launchBall(){
    if (g.state === STATE.BEFORE_LAUNCH) {
        g.ball.resetSpeed();
        g.state = STATE.AFTER_LAUNCH;
    }
}

function initGame() {
    var ball = new Ball();
    var board = new Board(canvas.width / 2, 60);
    var g = {
        ball: ball,
        board: board,
        lives: 3, 
        score: 0,
        state: STATE.BEFORE_LAUNCH
    };
    resetGame(g);
    return g;
}

function resetGame(g){
    var ncol = 15;
    var nrow = 5;
    var brickWidth = canvas.width / ncol;
    var brickHeight = 10;
    var bricks = new Array(nrow);
    for (var row=0; row < nrow; row++){
        var brickRow = new Array(ncol);
        for (var col=0; col < ncol; col++){
            brickRow[col] = new Brick(col * brickWidth, row * brickHeight, brickWidth, brickHeight);
        }
        bricks[row] = brickRow;
    }

    g.nrow = nrow;
    g.ncol = ncol;
    g.bricks = bricks;
    g.lives  = 3;
    g.score  =  0;
    g.state  = STATE.BEFORE_LAUNCH;

    // Setting up game animation
    clearInterval(g.intervalId);
    g.intervalId = setInterval(animate, 10);
}

function drawGame(g){
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw ball, bricks, board
    g.ball.draw();
    g.board.draw();
    for(var i = 0; i < g.nrow; i++){
        for(var j = 0; j < g.ncol; j++){
            g.bricks[i][j].draw();
        }
    }
    ctx.fillStyle = 'black';
    ctx.font = "10px Arial";
    ctx.fillText("x" + g.lives, canvas.width - 15, canvas.height - 2);
    var heartSize = 8;
    ctx.drawImage(heartImg, canvas.width - 25, canvas.height - 2 - heartSize, heartSize, heartSize);
}

function animate() {
    // Drawing the elements
    drawGame(g);
    updateStates(g);
}

var g = initGame();

canvas.addEventListener('click', function(e){
    if (g.state === STATE.BEFORE_LAUNCH){
        launchBall();
    }
});

function  getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y  
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}

canvas.addEventListener("mousemove", function(e){
    // Update board position according to mouse position
    var pos = getMousePos(canvas, e);
    g.board.setX(pos.x);
});

startButton.addEventListener("click", function(e){
    resetGame(g);
});


