var Utils = {
  /** 
   * Rotate a vector with an angle in radian.
   * @param {Number} x 
   * @param {Number} x 
   * @param {Number} angle angle in radian 
   */
  rotateVector: function(x, y, angle){
    return {
      x: x * Math.cos(angle) - y * Math.sin(angle),
      y: x * Math.sin(angle) + y * Math.cos(angle)
    };
  },

  /**
   * Pad a number with leading zeros.
   * @param {Number} num Number to format
   * @param {Number} size Number of characters to display
   */
  pad: function(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
  },

  /**
   * Convert coordinates from Event to Canvas.
   * @param {Canvas} canvas 
   * @param {Event} evt 
   */
  getMousePos: function(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
      scaleX = canvas.width / rect.width,  // relationship bitmap vs. element for X
      scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y  
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY   // been adjusted to be relative to element
    }
  },

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
  roundRect: function(ctx, x, y, width, height, radius, fill, stroke) {
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
  },

  /**
   * Returns a canvas object on which the render function was applied. 
   * Can be used to cache a Canvas for faster rendering.
   * @param {Number} width 
   * @param {Number} height 
   * @param {function(ctx)} render function taking ctx as input and drawing on it.
   */
  renderToCanvas: function(width, height, render) {
    var cachedCanvas = document.createElement('canvas');
    cachedCanvas.width  = width;
    cachedCanvas.height = height;
    render(cachedCanvas.getContext('2d'));
    // renderSlow(g, cachedCanvas.getContext('2d'));
    return cachedCanvas;
  }
    
};
  