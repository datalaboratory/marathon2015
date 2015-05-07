define(function() {
var timecache = {};


var getTime = function(input) {
	if (typeof input == 'string'){
		if (!timecache[input]){
			var date = input.split(/\:|\./gi);
			if (date.length == 2){
				date.unshift(0);
			}
			var num = (date[0] * 60 + date[1]*1) * 60 + date[2]*1;
			timecache[input] = num;
		}
		
	//	console.log(timecache[input]);
		return timecache[input];
	} else {
		return input;
	}
};

var filters = {
	limitTo: function(input, limit) {
		if (Array.isArray(input)){
			return input.slice(0, limit);
		} else if ( typeof input == 'string' ) {
			if (limit) {
				return limit >= 0 ? input.slice(0, limit) : input.slice(limit, input.length);
			} else {
				return "";
			}
		} else {
			return input;
		}
	},
	compareTime: function(input, start, end) {
		start = getTime(start);
		end = getTime(end);

		return (input > getTime(start) || (start === input && input === 0)) && input <= end;
	//	console.log(arguments);
	},
	timeToNum: function(input) {
		
		/*
				var stringToTime = function(obj, place) {
			if (obj[place]){
				var date = obj[place].split(/\:|\./gi);
				obj[place] = ;
			}
		};*/
		return getTime(input);
		
	}
};

return filters;
});