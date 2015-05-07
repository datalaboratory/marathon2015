(function(){
"use strict";
var max_time = 0;
//var start_time = new Date(2013, 6, 30, 9) * 1;

var start_time = new Date(2013, 8, 15, 8) * 1;


var getResultSteps = function(el, total_distance) {
	var result = [];
	result.push({
		distance:0,
		time: el.start_time
	}, {
		distance: total_distance,
		time: el.end_time
	});
	return result;
};
var stringToTime = function(obj, place) {
	if (obj[place]){
		var date = obj[place].split(/\:|\./gi);
		obj[place] = (date[0] * 60 + date[1]*1) * 60 + date[2]*1;
	}
};
var stringToNum = function(obj, space) {
	if (obj[space]){
		var num = obj[space] * 1;
		if (!isNaN(num)){
			obj[space] = num;
		}
		
	}
};

var setTargetField = function(obj, tree, value) {
	tree = Array.isArray(tree) ? tree : tree.split('.');
	var cur_obj = obj;
	for (var i=0; i < tree.length; i++) {
		var cur = tree[i];
		if (i != tree.length -1){
			var target = cur_obj[cur];
			if (!target){
				target = cur_obj[cur] = {};
			}
			cur_obj = target;
		} else {
			cur_obj[cur] = value;
		}
	}
	return true;
};
var getTargetField = function(obj, tree){
	tree= Array.isArray(tree) ? tree : tree.split('.');
	var nothing;
	var target = obj;
	for (var i=0; i < tree.length; i++) {
		if (target[tree[i]] !== nothing){
			target = target[tree[i]];
		} else{
			return;
		}
	}
	return target;
};

var mapProps = function(props_map, donor, acceptor) {
	for (var name in props_map){
		var value = getTargetField(donor, props_map[name]);
		if (typeof value != 'undefined'){
			setTargetField(acceptor, name, value);
		}
	}
	return acceptor;
};


var convertToObj = function(el) {
	var result = {};
	for (var i = 0; i < el.length; i++) {
		result[i] = el[i];
		
	}
	return result;
};









var props_map = {
	birthyear: '3',
	full_name: '2',
	result_time: '8',
	result_time_string: '20',
	pos: '0',
	num: '1',

	country: '4',
	region: '5',
	city: '6',
	team: '7'
};

var ncvs = [];
(function(){
	var i;
	var cvs = document.getElementById('cvs').textContent.replace(/✌/gi, '').split(/\n/gi).map(function(el){
		var pa = el.split('✄');
		pa[20] = pa[8];

		
		[8].forEach(function(prop) {
			stringToTime(pa, prop);
		});

		
		if (pa[8]){
			max_time = Math.max(pa[8], max_time);
		}
		[0, 1, 3].forEach(function(prop) {
			stringToNum(pa, prop);
		});

		
		return pa;
	});

	
	for (i = 0; i < cvs.length; i++) {
		if (cvs[i][8]){
			ncvs.push(convertToObj(cvs[i]));
		}
	}

	var group_num = 20;
	var groups_count = Math.ceil(cvs.length/group_num);

	var normlz_maxtime = max_time /4;
	var start_diff = (normlz_maxtime / groups_count) * 1000;




	for (i = 0; i < ncvs.length; i++) {

		var el = ncvs[i];
		el.start_time = start_time + (Math.ceil((i+1)/groups_count) - 1) * start_diff;
		el.end_time = start_time + el[8] * 1000;
		
		el.result_steps = getResultSteps(el, 42800);
		var gender = Math.random() > 0.66 ? 0 : 1;
		el.gender = gender;

		mapProps(props_map, el, el);

	}
})();






window.onmessage = function(e) {
	
	if (e.data == 'send_data'){
		var parent = window.parent;
		if (parent){
			parent.postMessage({
				cvs_data: true,
				data: {
					start_time: start_time,
					max_time: max_time,
					items: ncvs
				}
			}, '*');
		}
	}
};
})();