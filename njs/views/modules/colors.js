define(function(){
"use strict";
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
var hslToRgb = function (h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
};


/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
var rgbToHsl = function(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
};



var getHSLGradient = function(steps, colours) {
  var parts = colours.length - 1;
  var gradient = new Array(steps);
  var gradientIndex = 0;
  var partSteps = Math.floor(steps / parts);
  var remainder = steps - (partSteps * parts);
  for (var col = 0; col < parts; col++) {
    // get colours
    var c1 = colours[col],
        c2 = colours[col + 1];
    // determine clockwise and counter-clockwise distance between hues
    var distCCW = (c1.h >= c2.h) ? c1.h - c2.h : 1 + c1.h - c2.h,
        distCW = (c1.h >= c2.h) ? 1 + c2.h - c1.h : c2.h - c1.h;
     // ensure we get the right number of steps by adding remainder to final part
    if (col == parts - 1) partSteps += remainder;
    // make gradient for this part
    for (var step = 0; step < partSteps; step ++) {
      var p = step / partSteps;
      // interpolate h, s, l
      var h = (distCW <= distCCW) ? c1.h + (distCW * p) : c1.h - (distCCW * p);
      if (h < 0) h = 1 + h;
      if (h > 1) h = h - 1;
      var s = (1 - p) * c1.s + p * c2.s;
      var l = (1 - p) * c1.l + p * c2.l;
      // add to gradient array
      gradient[gradientIndex] = {h:h, s:s, l:l};
      gradientIndex ++;
    }
  }
  return gradient;
};
var grad_cache = {};

var getRGBGradColoursCacheKey = function(colours, steps) {
	var key = steps + '-' + colours.map(function(el) {
		return el.map(function(el) {
			return el.toString(16);
		}).join('');
	}).join('#');
	return key;
};

var getRGBGradient = function(steps, colours, key) {
	if (!key){
		key = getRGBGradColoursCacheKey(colours, steps);
	}
	if (grad_cache[key]){
		return grad_cache[key];
	} else {
		var hsl_colours = colours.map(function(el) {
			var hsl = rgbToHsl.apply(null, el);
			return {
				h: hsl[0],
				s: hsl[1],
				l: hsl[2]
			};
		});
		var grad = getHSLGradient(steps, hsl_colours).map(function(el) {
			return hslToRgb(el.h, el.s, el.l).map(function(el) {return Math.floor(el);});
		});
		grad_cache[key] = grad;
		return grad;
	}
};
var mapparse = function(el) {
	return parseInt(el, 16);
};
var parseHEXString = function(str) {
	str = str.replace('#', '');
	return [
		str.slice(0, 2),
		str.slice(2, 4),
		str.slice(4, 6)
	].map(mapparse);
};

var ggco = {
	getResult: function(el) {
    var result = Math.floor(el).toString(16);
    while (result.length != 2){
      result = '0' + result;
    }
		return result;
	}
};
var getGradColor = function(val, min, max, grad) {

	var smooth_value = Math.max(val, min);
	smooth_value = Math.min(smooth_value, max);

	var value_factor = ( smooth_value - min ) / ( max - min );
  if (max == min){
    value_factor = 0.5;
  }

	var color = grad [ Math.floor( (grad.length - 1) * value_factor ) ];
	return '#' + color.map(ggco.getResult).join('').toUpperCase();
};

return {
	parseHEXString: parseHEXString,
	getHSLGradient: getHSLGradient,
	getRGBGradient: getRGBGradient,
	getGradColor: getGradColor,
	getRGBGradColoursCacheKey: getRGBGradColoursCacheKey
};
});