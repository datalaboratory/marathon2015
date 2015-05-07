define(['provoda', 'jquery', 'spv'], function(provoda, $, spv) {
"use strict";
var cvs_data;


/*
18-19, 20-22, 23-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65+

18-22
23-34
35-49
50-65
65+

v


*/
var big_ages_group = [
	{
		start: 16,
		end: 19,
		label: '16-19'
	},{
		start: 20,
		end: 22,
		label: '20-22'
	},{
		start: 23,
		end: 34,
		label: '23-34'
	},{
		start: 35,
		end: 39,
		label: '35-39'
	},{
		start: 40,
		end: 44,
		label: '40-44'
	},{
		start: 45,
		end: 49,
		label: '45-49'
	},{
		start: 50,
		end: 54,
		label: '50-54'
	},{
		start: 55,
		end: 59,
		label: '55-59'
	},{
		start: 60,
		end: 64,
		label: '60-64'
	},{
		start: 65,
		end: 90,
		label: '65+'
	}
];

var small_ages_group = [
	{
		start: 16,
		end: 22,
		label: '16-22'
	},{
		start: 23,
		end: 34,
		label: '23-34'
	},{
		start: 35,
		end: 49,
		label: '35-49'
	},{
		start: 50,
		end: 65,
		label: '50-65'
	},{
		start: 65,
		end: 90,
		label: '65+'
	}
];



var getAgeGroups = function(array, ranges, field, start_year){
	var age_groups = [];
	var r = array;
	var max = 0;
	var lng = 0;
	
	for (var i = 0; i < ranges.length; i++) {

		var age_range = ranges[i];
		
		var g = spv.filter(r, field, function(value) {
			var date = start_year - value;
			if (date >= age_range.start && date <= age_range.end){
				return true;
			}
		});
		
		age_groups.push(g);
		r = g.not;
		max = Math.max(max, (g.length / (age_range.end + 1 - age_range.start)));
		lng = lng + age_range.end + 1 - age_range.start;
		// console.log(lng);
	}
	
	age_groups.max = max;
	age_groups.lng = lng;

	return age_groups;
};
var age_field = ['birthyear'];
var getGenderAgesGroups = function(items, age_ranges_to_use, start_year) {
	var genders_groups = [{
		raw: []
	}, {
		raw: []
	}, {
		raw: []
	}	];
	var runners_groups = [];

	var i;
	for ( i = 0; i < items.length; i++) {
		
		genders_groups[items[i].gender].raw.push(items[i]);
	}
	genders_groups.forEach(function(el) {
		el.age_groups = getAgeGroups(el.raw, age_ranges_to_use, age_field, start_year);
	});
	for ( i = 0; i < genders_groups[0].age_groups.length; i++) {
		runners_groups.push({
			key: 0 + '-' + i,
			num: i + 1,
			groups_count: genders_groups[0].age_groups.length,
			gender: 0,
			runners: genders_groups[0].age_groups[i]
		});
	}
	for ( i = genders_groups[1].age_groups.length - 1; i >= 0; i--) {
		runners_groups.push({
			key: 1 + '-' + i,
			num: i + 1,
			groups_count: genders_groups[1].age_groups.length,
			gender: 1,
			runners: genders_groups[1].age_groups[i]
		});
	}
	runners_groups.reverse();


	return {
		genders_groups: genders_groups,
		runners_groups: runners_groups
	};
};

var checkData = function() {
	if (cvs_data){
		var items = cvs_data.items;
		items.sort(function(a, b){
			return spv.sortByRules(a, b, [{
				field: ['result_time'],
				reverse: false
			}]);
		});

		var last_finish_time = 0;

		for (var i = 0; i < items.length; i++) {

			last_finish_time = Math.max(last_finish_time, items[i].end_time);
		}

		var start_year = (new Date(cvs_data.start_time)).getFullYear();


		var setRunnersGroupMark = function(runners_groups, marker_prop) {
			if (!marker_prop){
				throw new Error();
			}
			runners_groups.forEach(function(el) {
				for (var i = 0; i < el.runners.length; i++) {
					el.runners[i][marker_prop] = el.key;
					el.runners[i][marker_prop + '_full'] = el;
				}
			});
		};

		var ga_groups = getGenderAgesGroups(items, small_ages_group, start_year);
		var big_ga_groups = getGenderAgesGroups(items, big_ages_group, start_year);
		setRunnersGroupMark(big_ga_groups.runners_groups, 'big_genderage_group');
		/*var bad = [];
		for (var i = 0; i < cvs_data.items.length; i++) {
			if (!cvs_data.items[i].big_genderage_group){
				bad.push(cvs_data.items[i]);
			}
			
		}
		console.log(bad);*/

		cvs_data.getAgeGroups = function(array, ranges, field) {
			return getAgeGroups(array, ranges, field, start_year);
		};
		cvs_data.genders_groups = ga_groups.genders_groups;
		cvs_data.runners_groups = ga_groups.runners_groups;
		cvs_data.big_genders_groups = big_ga_groups.genders_groups;
		cvs_data.start_year = start_year;

		cvs_data.last_finish_time = last_finish_time;
		cvs_data.run_gap = (last_finish_time - cvs_data.start_time)/1000;
		cvs_data.age_ranges = small_ages_group;
		cvs_data.big_ages_ranges = big_ages_group;
		return cvs_data//eventor.trigger('load', cvs_data);
	}
};
var Cvsloader = function() {};
provoda.Eventor.extendTo(Cvsloader, {
	'regfr-cvload': {
		test: function(namespace) {
			return namespace.indexOf('load') === 0;
		},
		fn: function() {
			return cvs_data;
		}
	},
	getGenderAgesGroups: getGenderAgesGroups
});
var eventor = new Cvsloader();
eventor.init();

// var data_path42 = (locale == 'rus')? 'data/data42km/data3.html':'../data/data42km_en/data3.html';
// var data_path10 = (locale == 'rus')? 'data/data10km/data3.html':'../data/data10km_en/data3.html';

var data_path42 = (locale == 'rus')? 'data/data42km/data3.html':'../data/data42km/data3.html';
var data_path10 = (locale == 'rus')? 'data/data10km/data3.html':'../data/data10km/data3.html';


function getData(path, callback, key) {
    var frame;
    $(window).on('message', function(e) {
        var message = e.originalEvent.data;
        if (message && message.cvs_data && message.key == key){
            cvs_data = message.data;
            $(frame).remove();
            callback(checkData())
            //eventor.trigger('load', checkData())
        }

    });

    $(function() {
        frame = document.createElement('iframe');
        $(frame)
            .css({
                visibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: '-1000px'
            })
            .attr('src', path)
            .on('load', function() {
                frame.contentWindow.postMessage('send_data','*');
            })
            .appendTo(document.body);
    });

}

var data = {}
var callback42 =  function(d){
    if (!data.data42) data.data42 = d
    if (data.data10)
        eventor.trigger('load', data)
}
var callback10 =  function(d){
    if (!data.data10) data.data10 = d
    if (data.data42){
        eventor.trigger('load', data)
    }

}
getData(data_path42, callback42, 42)
getData(data_path10, callback10, 10)


return eventor;
});