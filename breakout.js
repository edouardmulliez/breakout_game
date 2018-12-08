if (!Object.construct) {
  Object.construct = function(base) {
    var instance = Object.create(base);
    if (instance.initialize)
      instance.initialize.apply(instance, [].slice.call(arguments, 1));
    return instance;
  }
}

var Breakout = {
  STATE: {
    "BEFORE_LAUNCH": 1,
    "AFTER_LAUNCH": 2,
    "FINISHED": 3
  },

  Settings: {
    fillStyle: {
      ball: '#aa0308',
      wall: '#283747',
      score: '#d69a02',
      lives: '#d69a02',
      level: '#d69a02',
      board: 'black'
    },
    font: {
      level:      '18px Arial',
      score:      'bold 18px Arial',
      finalScore: 'bold 30px Arial'
    },
  
    ball: {
      speed: {
        slow:   2.5,
        normal: 3,
        fast:   4
      }
    },

    ids: {
      canvas:       "breakoutCanvas",
      speedSelect:  "speed",
      levelSelect:  "level",
      instructions: "instructions"
    },    

    display: {
      // Space occupied by the gameplay area in canvas
      game_area_ratio: {x: 0.9, y: 0.8},
      fps: 60
    },

    initial: {
      lives: 3,
      level: 1
    }
  },


  initialize(cfg) {
    this.cfg = cfg;
    this.canvas = document.getElementById(cfg.ids.canvas);
    var AREA_RATIO = cfg.display.game_area_ratio; // Space occupied by the gameplay area in canvas
    this.area = this.getPlayArea(this.canvas, AREA_RATIO.x, AREA_RATIO.y);
    
    var boardHeight = this.area.height / 40;  
    var speed = cfg.ball.speed.normal;
  
    this.ball = Object.construct(Breakout.Ball, boardHeight/2, speed * this.area.width / 250);    
    this.board = Object.construct(Breakout.Board,
      this.area.left + this.area.width / 2,
      this.area.bottom - boardHeight / 2,
      this.area.width / 6,
      boardHeight,
      {left: this.area.left, right: this.area.right}
    );
    this.display = Object.construct(Breakout.Display, this);

    this.controls = Object.construct(Breakout.Controls, cfg.ids, Breakout.Levels.length);
    this.resetGame();
    this.addListener();
  },

  resetGame: function() {
    this.ball.updateSpeed(this.controls.getSpeed());
    this.lives = this.cfg.initial.lives;
    this.score = 0;
    this.level = this.controls.getLevel();
    this.controls.showInstruction();
    this.controls.enable();
    this.initGameLevel();
  },

  initGameLevel: function(){
    var unit = this.area.width / Breakout.unitPerRow;  
    var layout = Breakout.Levels[this.level-1];
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
          var brick = Object.construct(Breakout.Brick,
            this.area.left + colStart * unit,
            this.area.top + i * unit,
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
  
    this.bricks = bricks;
    this.nActiveBricks = nbricks;
    this.state  = Breakout.STATE.BEFORE_LAUNCH;
  
    this.display.rerender = true;
  
    // Setting up game animation
    clearInterval(this.intervalId);
    this.intervalId = setInterval(this.animate.bind(this), 1000/this.cfg.display.fps);
  },


  update: function() {

    if (this.state === Breakout.STATE.BEFORE_LAUNCH){
      // Keep the ball centered on the board
      this.ball.x = this.board.x;
      this.ball.y = this.board.y - this.board.height / 2 - this.ball.R / 2 - 2;
    }
  
    if (this.state === Breakout.STATE.AFTER_LAUNCH){
  
      // ball on walls
      if (this.ball.x + this.ball.dx + this.ball.R > this.area.right || this.ball.x + this.ball.dx - this.ball.R < this.area.left) {
        this.ball.dx = -this.ball.dx;
      }
      if (this.ball.y + this.ball.dy - this.ball.R < this.area.top) {
        this.ball.dy = -this.ball.dy;
      }
      // ball against board
      this.board.checkCollision(this.ball);
  
      // ball against bricks
      for(var i = 0; i < this.bricks.length; i++){
        for(var j = 0; j < this.bricks[i].length; j++){
          if (this.bricks[i][j].checkCollision(this.ball)) {
            this.nActiveBricks--;
            this.score += 135;
            this.display.rerender = true;
          }
        }
      }
  
      // If all bricks are destroyed, go to next level
      if (this.nActiveBricks === 0) {
        this.updateLevel();
        this.initGameLevel();
      }
  
      // update this.ball position
      this.ball.update();
  
      // this.ball lost
      if (this.ball.y - this.ball.R > this.canvas.height + 5) {
        this.lives -= 1;
        this.display.rerender = true;
        if (this.lives === 0){
          this.state = Breakout.STATE.FINISHED;
          this.display.vscore = 0;
          this.rerender = true;
        } else {
          this.state = Breakout.STATE.BEFORE_LAUNCH;
        }
      }
    }
    this.display.updateVscore()
  
  },
  
  updateLevel: function(){
    this.level += 1;
    if (this.level > Breakout.Levels.length) {
      this.level = 1;
    }
  },
  
  launchBall: function(){
    if (this.state === Breakout.STATE.BEFORE_LAUNCH) {
      this.controls.disable();
      this.ball.resetSpeed();
      this.state = Breakout.STATE.AFTER_LAUNCH;
    }
  },
  
  animate: function() {
    // Drawing the elements
    this.update();
    this.display.drawGame();
  },

  getPlayArea: function(canvas, widthRatio, heightRatio) {
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
  },

  onclick: function(event) {
    event.preventDefault();
    event.stopPropagation();    
    if (this.state === Breakout.STATE.BEFORE_LAUNCH){
      this.controls.hideInstruction();
      this.launchBall();
    } else if (this.state === Breakout.STATE.FINISHED){
      this.resetGame();
    }
  },

  addListener: function() {
    var canvas = this.canvas;
    var game = this;

    canvas.addEventListener('click', function(e){game.onclick(e);});
    canvas.addEventListener('touchstart', function(e){
      game.onclick(e);
    });
    canvas.addEventListener("mousemove", function(e){
      // Update board position according to mouse position
      var pos = Utils.getMousePos(game.canvas, e);
      game.board.setX(pos.x);
    });
    canvas.addEventListener("touchmove", function(e){
      // Update board position according to touch position
      e.preventDefault();
      var touch = e.changedTouches[0];
      var pos = Utils.getMousePos(game.canvas, touch);
      game.board.setX(pos.x);
    });
    this.controls.levelSelect.addEventListener("change", function(e){
      game.resetGame();
    });
    this.controls.speedSelect.addEventListener("change", function(e){
      game.resetGame();
    });
  },

  
  Display: {
    initialize: function(game) {
      this.game = game;
      this.canvas = this.game.canvas;
      this.area = this.game.area;
      this.fillStyle = this.game.cfg.fillStyle;
      this.font = this.game.cfg.font;
      this.vscore = 0; // score that is displayed on canvas. Progressively get to the real score value.
      this.rerender = true;
    },

    /**
     * Rendering elements that do not change often.
     * (Bricks, score, lives)
     */
    renderSlow: function(ctx) {
      if (this.game.state !== Breakout.STATE.FINISHED) {
        // bricks
        for(var i = 0; i < this.game.bricks.length; i++){
          for(var j = 0; j < this.game.bricks[i].length; j++){
            this.game.bricks[i][j].draw(ctx);
          }
        }
        // walls
        ctx.fillStyle = this.fillStyle.wall;
        ctx.fillRect(0, 0, this.area.left, this.area.bottom);
        ctx.fillRect(0, 0, this.canvas.width, this.area.top);
        ctx.fillRect(this.area.right, 0, this.area.left, this.area.bottom);

        // Lives
        ctx.fillStyle = this.fillStyle.lives;
        var lifeItem = {width: this.area.width * 0.07, height: this.area.top * 0.2, xPad: this.area.width * 0.01};
        for (var i=0; i<this.game.lives; i++){
          Utils.roundRect(
            ctx,
            this.area.left + this.area.width * 0.25 + i * (lifeItem.width + lifeItem.xPad),
            this.area.top/2 - lifeItem.height/2,
            lifeItem.width,
            lifeItem.height, 
            2, 
            true);
        }

        // Current level
        ctx.fillStyle = this.fillStyle.level;
        ctx.font = this.font.level;
        ctx.textAlign="end";
        ctx.textBaseline = 'middle';
        ctx.fillText("Level "+ Utils.pad(this.game.level, 2), this.area.right, this.area.top/2);
      }
    },

    /**
     * Rendering elements that change often
     * (Ball, board, score)
     */
    renderFast: function(ctx) {
      if (this.game.state === Breakout.STATE.FINISHED) {
        this.displayFinalScore(ctx);
      } else {
        this.game.ball.draw(ctx);
        this.game.board.draw(ctx);
        // Score
        ctx.fillStyle = this.fillStyle.score;
        ctx.font = this.font.score;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(Utils.pad(this.vscore, 7), this.area.left, this.area.top/2);
      }
    },

    updateVscore: function(){
      // Score with animation (increases progressively) up to the real score
      if (this.game.state === Breakout.STATE.FINISHED) {
        this.vscoreDelta = 500;
      } else {
        this.vscoreDelta = 5;
      }
      // if (this.vscore < this.game.score) {
        this.vscore = Math.min(this.game.score, this.vscore + this.vscoreDelta); 
      // } else {
      //   this.vscore = this.game.score
      // }
    },

    drawGame: function() {
      var ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Use cached canvas if possible
      if (this.rerender) {
        this.cachedCanvas = Utils.renderToCanvas(
          this.canvas.width, 
          this.canvas.height,
          this.renderSlow.bind(this)
        )
        this.rerender = false;
      }
      ctx.drawImage(this.cachedCanvas, 0, 0, this.canvas.width, this.canvas.height);
      // Render fast moving elements
      this.renderFast(ctx);
    },

    displayFinalScore: function(ctx) {
      ctx.fillStyle = this.fillStyle.wall;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = this.fillStyle.score;
      ctx.font = this.font.finalScore;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height * 0.4);
      ctx.fillText(Utils.pad(this.vscore, 7), this.canvas.width / 2, this.canvas.height / 2);
    }

  },


  Controls: {
    initialize: function(ids, nbLevel) {
      this.levelSelect = document.getElementById(ids.levelSelect);
      this.speedSelect = document.getElementById(ids.speedSelect);
      this.instructions = document.getElementById(ids.instructions);
      this.fillLevelSelect(nbLevel);
    },
    fillLevelSelect: function(nbLevel) {
      this.levelSelect.innerHTML = "";
      for (var i=1; i<=nbLevel; i++){
        var option = document.createElement("option");
        option.text = i;
        this.levelSelect.add(option);    
      }
    },
    getLevel: function() {
      return parseInt(this.levelSelect.value);
    },
    getSpeed: function() {
      return this.speedSelect.value.toLowerCase()
    },
    disable: function() {
      this.levelSelect.disabled = true;
      this.speedSelect.disabled = true;      
    },
    enable: function() {
      this.speedSelect.disabled = false;     
      this.levelSelect.disabled = false;
    },
    hideInstruction: function(){
      this.instructions.classList.add("hidden");
    },
    showInstruction: function(){
      this.instructions.classList.remove("hidden");
    }
  },


  Ball: {
    initialize: function(R, speed) {
      this.R = R;
      this.speed = speed;
    },
  
    /**
     * 
     * @param {String} speed any of 'easy', 'normal', 'hard'
     */
    updateSpeed: function(speed) {
      this.speed = Breakout.Settings.ball.speed[speed];
      if (this.speed === undefined) {
        this.speed = Breakout.Settings.ball.speed.normal;
      }
    },
  
    resetSpeed: function() {
      // Angle between -Pi/4 and - 3 Pi/4
      var angle = -Math.PI * (1/4 + 1/2 * Math.random());
      this.dx = this.speed * Math.cos(angle);
      this.dy = this.speed * Math.sin(angle);
    },

    update: function() {
      this.x += this.dx;
      this.y += this.dy;
    },
  
    draw: function(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.R, 0, 2 * Math.PI, false);
      ctx.lineWidth = 3;
      ctx.fillStyle = Breakout.Settings.fillStyle.ball;
      ctx.fill();
    }
  },


  Board: {
    // border = {left: xx, right: yy} --> positions between which board can move
    initialize: function(x, y, width, height, border) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.xMin = border.left + width / 2;
      this.xMax = border.right - width / 2;
      this.speed = 4;
    },
  
    draw: function(ctx) {
      ctx.fillStyle = Breakout.Settings.fillStyle.board;
      Utils.roundRect(ctx, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, 3, true, false);
    },
  
    isInBoard: function(x, y) {
      // Is the point at (x, y) inside the brick?
      return (
        x > this.x - this.width / 2 && 
        x < this.x + this.width / 2 && 
        y > this.y - this.height / 2 && 
        y < this.y + this.height / 2)
    },
  
    /**
     * Check if ball will collide with board at next step and update the ball direction
     * accordingly.
     * @param ball 
     */
    checkCollision: function(ball) {
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
    },
  
    setX: function(x) {
      this.x = Math.max(this.xMin, Math.min(x, this.xMax)); 
    }
  },


  Brick: {
    initialize: function(x, y, width, height, color) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.color = color;
      this.isAlive = true;
    },
  
    draw: function(ctx) {
      var pad = 2
      if (this.isAlive) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x + pad/2, this.y + pad/2, this.width - pad/2, this.height - pad/2);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + pad/2, this.y + pad/2, this.width - pad/2, this.height - pad/2);
      }
    },
  
    isInBrick: function(x, y) {
      // Is the point at (x, y) inside the brick?
      return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height)
    },
  
    checkCollision: function(ball) {
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
}
