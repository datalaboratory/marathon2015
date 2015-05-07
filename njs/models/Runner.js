define(['../libs/BrowseMap', 'moment'], function(BrowseMap, moment) {
"use strict";

var Runner = function() {};
BrowseMap.Model.extendTo(Runner, {
	model_name: 'runner',
	init: function(opts, raw) {
		this._super(opts);
		this.mapStates(this.raw_map_st, raw, true);
		this.updateState('raw', raw);
		this.initStates();
		this.wlch(this.map_parent, 'selected_filter_gender');
		this.rawdata = raw;


		/*		var tstr;
				if (from_start) {
					tstr = moment(cvs_data.start_time)
					.startOf('day')
					.add( cur.relative_to_start)
					.format(cur.last ? 'HH:mm:ss' : 'HH:mm');
				} else {
					tstr = moment(cur.relative_to_day)
					.format(cur.last ? 'HH:mm:ss' : 'HH:mm');
				}*/
	},
	switchSelection: function() {
        if (this.rawdata.gender != 2)
		this.map_parent.switchSelectRunner(this);
		
	},
	'compx-full_time_string':{
		depends_on: ['start_time', 'result_time', 'gender'],
		fn: function(start_time, result_time, gender) {
			if (start_time && result_time){
				var tstr = moment(start_time)
					.startOf('day')
					.add( result_time * 1000 )
					.format('H:mm:ss');
			if (gender === 2) {
				tstr = 'сошел'
			}
				return tstr;
			}
		}
	},
	raw_map_st: {
		pos: 'pos',
		gender_pos: 'gender_pos',
		num: 'num',
		full_name: 'full_name',
		birthyear: 'birthyear',
		country: 'country',
		region: 'region',
		city: 'city',
		team: 'team',
		result_time: 'result_time',
		gender: 'gender',
		start_time: 'start_time'
	//	full_time_string: 'result_time_string'
	}

	//Ctry✌✄✌Region✌✄✌City✌✄✌Club✌✄✌Result✌✄✄✌Group✌✄✌P.on g.✌✄✌Netto time✌✄✄
});
return Runner;

});