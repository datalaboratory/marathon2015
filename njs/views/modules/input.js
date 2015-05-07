(function(){
	var getScale = function(x) {
		return -Math.log(1-x);
	};
	var input_max = 200;

	var max_x = 0.999;
	var max_y = getScale(max_x);


	var max_scale_value = cvs_data.max_time;

	var x_factor = max_x/input_max;
	var y_factor = max_y/max_scale_value;



	var convertInputValue = function(value) {
		return getScale(value * x_factor)/y_factor;
	};


	var input = document.querySelector('input.time_log');

	if (!input){
		current_input_value = convertInputValue(20);
		return;
	}
	input.max = input_max;
	input.step = 1;

	current_input_value = convertInputValue(input.value);
	input.oninput = function() {
		current_input_value = convertInputValue(input.value);
		mh.getPoints(cvs_data, knodes, current_input_value, true, cvs_data.start_time, total_distance);
	};

	/*input.max = max_time/60;


	current_input_value = input.value * 60;
	input.oninput = function() {
		current_input_value = input.value*60;
		getPoints(knodes, current_input_value, true);
	};*/
})();
