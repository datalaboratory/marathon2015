define(['d3', 'provoda', 'spv', './modules/maphelper', 'jquery', './modules/colors', 'moment'], function(d3, provoda, spv, mh, $, colors, moment) {
"use strict";

var TimeGraphCtr = function() {};
provoda.View.extendTo(TimeGraphCtr, {
	bindBase: function() {

		var svg = document.createElementNS(mh.SVGNS, 'svg');
		this.svgc = $(svg).css('display', 'none');
		this.svg = d3.select(svg);

		this.wch(this.root_view, 'maxwdith', spv.debounce(function() {
			this.checkSizes();
		},100));
		this.wch(this, 'vis_con_appended', function(e) {
			if (e.value){
				this.checkSizes();
			}
			this.setVisState('ready', e.value);
			
		});
        var _this = this;

        this.wch(this, 'current_runners_data', function(e){
            if (!e.value) return;
            var selectByNum = function(num, array) {
                return num + ' ' + array[spv.getUnitBaseNum(num)];
            };
            var male_current_number = e.value.genders_groups[1].raw.length
            var female_current_number = e.value.genders_groups[0].raw.length

            var male = (locale == 'rus') ? selectByNum(male_current_number, ['мужчина','мужчины','мужчин']) : selectByNum(male_current_number, ['man','men','men']);
            var female = (locale == 'rus') ? selectByNum(female_current_number, ['женщина','женщины','женщин']) : selectByNum(female_current_number, ['woman','women','women']);

            male_current_number = (male_current_number) ? male : ''
            female_current_number = (female_current_number) ? female : ''

            _this.updateState('male_current_number', male_current_number)
            _this.updateState('female_current_number', female_current_number)

            var max_age = 0;
            var min_age = 100
            var runners = e.value.items
            for (var i = 0; i < runners.length; i++) {
                if (!runners[i].birthyear || runners[i].gender == 2){
                    continue;
                }
                max_age = Math.max((new Date(_this.states.cvs_data.start_time)).getFullYear() - runners[i].birthyear, max_age);
                min_age = Math.min((new Date(_this.states.cvs_data.start_time)).getFullYear() - runners[i].birthyear, min_age);
            }
            min_age = (min_age != max_age) ? min_age : ''
            var age_text = (locale == 'rus') ? selectByNum(max_age, ['года','лет','лет']) : max_age
            _this.updateState('min_age', min_age)
            _this.updateState('max_age', age_text)
        })
		this.areas_group = this.svg.append('g');


		var checkPointerMove = function(e) {
			_this.checkPointerMove(e);
		};



		this.c
		.on('mouseenter', function() {
			_this.coffset = _this.c.offset();
			$(window.document).on('mousemove', checkPointerMove);
		})
		.on('mouseleave', function() {

			$(window.document).off('mousemove', checkPointerMove);
			_this.promiseStateUpdate('selector', false);
		});
		this.promiseStateUpdate('px_step', this.px_step);

		this.timemarksg1 = this.svg.append('g');
		this.timemarksg2 = this.svg.append('g');
        this.select_line = this.svg.append('g')
            .append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('y2', 0)
            .classed('select_line', true)

        this.no_select_line = this.svg.append('g')
            .append('line')
            .attr('y1', 0)
            .attr('y2', 0)
            .classed('no_select_line', true);

		this.c.append(svg);
	},
	checkSizes: function() {
		var result = {};
		var container = this.c;
		
		if (container[0]){
			result.width = container.width();
            this.no_select_line.attr('x1', result.width)
		}
		this.original_height = container.height();
//		result.height = ;
		this.updateManyStates(result);
	},
	updateManyStates: function(obj) {
		var changes_list = [];
		for (var name in obj) {
			changes_list.push(name, obj[name]);
		}
		this._updateProxy(changes_list);
	},
	'compx-time_value': {
		depends_on: ['selected_time', 'cvs_data'],
		fn: function(selected_time, cvs_data) {
			if (cvs_data && typeof selected_time != 'undefined'){
				return cvs_data.run_gap * selected_time;
			}
		}
	},
    'compx-current_controll_value': {
        depends_on: ['time_value', 'cvs_data', 'hours_marks'],
        fn: function(time, data) {
            if (data && typeof time != 'undefined'){
                var values = {}
                var context_width = this.c.width();
                var pixel_pos = Math.floor(context_width * time / data.run_gap)
                var offset = $('.current_time').width()/2
                var marks = $('.mark_bottom')
                var left_time = pixel_pos - offset,
                    right_time = pixel_pos + offset
                if (marks.length) marks.each(function(i,el) {
                    var left_el = (i == marks.length - 1) ? context_width - $(el).find('.just_text_of_mark').width() : $(el).position().left,
                        right_el = (i == marks.length - 1) ? context_width : $(el).position().left + $(el).width()
                    if (left_time < left_el && left_el < right_time &&  right_time < right_el  ||
                        left_el < left_time && left_time < right_el && right_el < right_time ||
                        left_time < left_el && right_time > right_el ||
                        left_time > left_el && right_time < right_el){
                        $(el).css({
                            opacity: 0
                        })
                    } else {
                        $(el).css({
                            opacity: 1
                        })
                    }
                })

                var convertToTimeString = function(seconds) {
                	var h = seconds/3600 ^ 0 ;
                	var m = (seconds-h*3600)/60 ^ 0 ;
                	return (h<10?"0"+h:h)+":"+(m<10?"0"+m:m);
                };
                // почему тут был использован moment.js?
                // values.time =  moment((time - 4*3600)*1000).format('HH:mm');
                values.time = convertToTimeString(time);
                values.pos = pixel_pos - offset;
                return values;
            }
        }
    },
    'compx-winner':{
        depends_on: ['cvs_data', 'width'],
        fn: function(data, width) {
            if (!data) return;

            var context_width = width;
            var context_height = Math.floor(this.c.height());
            var winner_man = data.items[0];
            var i=0
            while (data.items[i].gender != 0) {
                i++
            }
            var winner_woman = data.items[i]
            var factor_man = +winner_man.result_time/data.run_gap ;
            var factor_woman = +winner_woman.result_time/data.run_gap ;
            winner_man.pixel_pos = Math.floor(context_width * factor_man)
            winner_woman.pixel_pos = Math.floor(context_width * factor_woman)

            this.svg.select('.circle-line-g').remove()
            var g = this.svg.append('g').classed('circle-line-g', true)
            g.append('circle').classed('man_circle', true).attr('r', 2).attr('cx', winner_man.pixel_pos ).attr('cy', 165)
            g.append('line').classed('man_line', true).attr('x1', winner_man.pixel_pos ).attr('y1', 165).attr('x2', winner_man.pixel_pos ).attr('y2', context_height)

            g.append('circle').classed('woman_circle', true).attr('r', 2).attr('cx', winner_woman.pixel_pos ).attr('cy', 89)
            g.append('line').classed('woman_line', true).attr('x1', winner_woman.pixel_pos ).attr('y1', 89).attr('x2', winner_woman.pixel_pos ).attr('y2', context_height)
            return {
                winner_man: winner_man,
                winner_woman: winner_woman
            };
        }
    },
    'compx-winner-redraw':{
        depends_on: ['time_value', 'winner', 'distance_type'],
        fn: function(time, winner, type) {
            if (!winner) return;
            //var grad = _this.parent_view.parent_view.gender_grads[winner.gender];
            //var color = colors.getGradColor(el.num, 1, 5, grad);
            var color_man = (type == 42) ? '#8DCDFB' : '#8DCDFB'
            var color_woman = (type == 42) ? '#FBA1B3' : '#FBA1B3'
            var gray = (type == 42) ? '#EEEEEE ' : '#EEEEEE'
            color_man = (time < winner.winner_man.result_time) ? gray : color_man
            color_woman = (time < winner.winner_woman.result_time) ? gray : color_woman
            this.svg.select('.man_circle').attr('fill', color_man)
            this.svg.select('.man_line').attr('stroke', color_man)

            this.svg.select('.woman_circle').attr('fill', color_woman)
            this.svg.select('.woman_line').attr('stroke', color_woman)

        }
    },
	'compx-hours_steps':{
		depends_on: ['cvs_data'],
		fn: function(cvs_data) {
			if (!cvs_data){
				return;
			}
			var step = 60 * 60;

			var items = [];
			var cur = 0;
			while (cur < cvs_data.run_gap){
				items.push({
					relative_to_start: cur * 1000,
					relative_to_day: cvs_data.start_time + cur * 1000,
					value: cur
				});
				cur += step;
				//cur = Math.min(cur, cvs_data.run_gap);
			}
			if (items.length > 2) items.pop();  //что за хрень
			items.push({
				relative_to_start: cvs_data.run_gap * 1000,
				relative_to_day: cvs_data.start_time + cvs_data.run_gap * 1000,
				value: cvs_data.run_gap,
				last: true
			});
			return items;

		}
	},
	'compx-hours_marks':{
		depends_on: ['hours_steps', 'cvs_data', 'width', 'distance_type'],
		fn: function(hours_steps,cvs_data, width) {
			if (!hours_steps || !cvs_data || !width){
				return;
			}

			var node  = this.tpl.ancs['timeline_textc'];
			node.empty();
			var width_factor = width/cvs_data.run_gap;
			var dfrg = document.createDocumentFragment();

			
			var createText = function(cur, from_start) {
				var tstr;
				if (from_start) {
					tstr = moment(cvs_data.start_time).startOf('day')
					.add( cur.relative_to_start)

					.format(cur.last ? 'HH:mm:ss' : 'HH:mm');
				} else {
					tstr = moment(cur.relative_to_day)
					.zone(-240)
					.format(cur.last ? 'HH:mm:ss' : 'HH:mm');
				}
				var span_top = $('<span class="tl_text_mark"></span>').appendTo(dfrg);
				if (from_start){
					span_top.addClass('mark_bottom');
				} else {
					span_top.addClass('mark_top');
				}

				$('<span class="just_text_of_mark"></span>').text(tstr).appendTo(span_top);


				span_top.css('left', width_factor * cur.value);
				if (cur.last){
					span_top.addClass('last_mark');
				}
			};

			for (var i = 0; i < hours_steps.length; i++) {
				var cur = hours_steps[i];
//				var full_format = 
				createText(cur);
				createText(cur, true);
				
				
			}

			$(dfrg).appendTo(node);
            return Date.now()
		}
	},
	'compx-timesteps': {
		depends_on: ['cvs_data'],
		fn: function(cvs_data) {
			var step = 20*60;

			var items = [];
			var cur = 0;
			while (cur < cvs_data.run_gap){
				items.push(cur);
				cur += step;
				//cur = Math.min(cur, cvs_data.run_gap);
			}
			//items.pop();
			items.push(cvs_data.run_gap);
			return items;

		}
	},
	'compx-marks': {
		depends_on: ['timesteps', 'base_graph_data'],
		fn: function(timesteps, base_graph_data) {
			if (timesteps && base_graph_data){
				var result = [];
				this.timemarksg1.selectAll('*').remove();
				this.timemarksg2.selectAll('*').remove();
				var mheight = 4;
				for (var i = 0; i < timesteps.length; i++) {
					var line1 = this.timemarksg1.append('line');
					line1.attr({
						y1: 0,
						y2: mheight,
						'stroke':'#CBCBCB',
						'stroke-width':1
					});
					var line2 = this.timemarksg1.append('line');
					line2.attr({
						y1: this.height,
						y2: this.height - mheight,
						'stroke':'#CBCBCB',
						'stroke-width':1
					});
					result.push({
						top: line1,
						bottom: line2
					});

					//timesteps[i]
				}
				return result;
			}

		}
	},
	'compx-marks_done': {
		depends_on: ['marks', 'bd', 'cvs_data', 'timesteps'],
		fn: function(marks, bd, cvs_data, timesteps) {
			if (marks && bd && cvs_data && timesteps){
				var width_factor = this.width/cvs_data.run_gap;
				for (var i = 0; i < marks.length; i++) {
					var val =  width_factor * timesteps[i];
                    if (val) {
                        var attrs = {
                            x1: val,
                            x2: val
                        };
                        marks[i].top.attr(attrs);
                        marks[i].bottom.attr(attrs);
                    }
				}
				return width_factor;
			}
			
		}
	},
    'compx-select_line': {
        depends_on: ['marks_done', 'cvs_data', 'selected_time'],
        fn: function(width_factor, cvs_data, time) {
            if (!width_factor || !cvs_data || !time) return
            var _this = this
            this.select_line.attr('x2', _this.width * time)
            this.no_select_line.attr('x2', _this.width * time)
        }
    },
	'compx-bd': {
		depends_on: ['width', 'vis_ready'],
		fn: function(width, vis_ready) {
			if ( !width || !vis_ready){
				return;
			}
			//var container = this.c.parent();
			//container.css('height', height);
			this.width = width;
			//this.height = height;
			this.svgc.css('display', '');
			this.svg.attr({
				width: this.width
				//height: this.height
			});

	
				
			return Date.now();
		}
	},
	'compx-total_distance':{
		depends_on: ['geodata'],
		fn: function(geodata) {
			if (geodata){
				return d3.geo.length(geodata) * mh.earth_radius;
			}
		}
	},
	'compx-basedet': {
		depends_on: ['total_distance', 'bd'],
		fn: function(total_distance, bd) {
			if (total_distance && bd){
				
				return Date.now();
			}
			
		}
	},
	'compx-age_areas': {
		depends_on: ['cvs_data'],
		fn: function(cvs_data) {
			if (!cvs_data){
				return;
			}
			this.areas_group.selectAll('*').remove();
			var age_areas = {};


			var array = cvs_data.runners_groups.slice();//.reverse();
			var _this = this;
			array.forEach(function(el) {
				var grad = _this.parent_view.gender_grads[el.gender];
                var gray_grad = _this.parent_view.grays;
				var color = colors.getGradColor(el.num, 1, el.groups_count, grad);
                var gray = colors.getGradColor(el.num, 1, el.groups_count, gray_grad);
				age_areas[ el.key ] = {
                    left:_this.areas_group.append('path').style({
                        stroke: 'none',
                        "fill": color
                    }),
                    right: _this.areas_group.append('path').style({
                        stroke: 'none',
                        "fill": gray
                    })
                };

			});
			return age_areas;
		}
	},
	px_step: 3,
	y_scale: 1.2,
	'compx-base_graph_data': {
		depends_on: ['basedet', 'cvs_data', 'current_runners_data'],
		fn: function(basedet, cvs_data, current_runners_data) {
			if (!basedet || !cvs_data || !current_runners_data){
				return;
			}
			
			var px_step = this.px_step;
			var steps = this.width/px_step;

			steps = Math.floor(steps);


			var time_step = (cvs_data.last_finish_time - cvs_data.start_time)/steps;

			

			var makeStep = function(step_num, runners) {
				var result = [];
				var range_start = cvs_data.start_time + step_num * time_step;
				var range_end = range_start + time_step;
				for (var i = 0; i < runners.length; i++) {
					var cur = runners[i];
					if (cur.end_time > range_start &&  cur.end_time <= range_end){
						result.push(cur);
					} else {

					}
				}
				return result;
			};
			var getRunnersByTime = function(runners) {
				var runners_by_time = [];
				
				for (var i = 0; i < steps; i++) {
					var array = makeStep(i, runners);
					runners_by_time.push(array);
				}
				return runners_by_time;
			};

			var reversed_groups = current_runners_data.runners_groups.slice();
			reversed_groups.reverse();

			var runners_byd = {};

			current_runners_data.runners_groups.forEach(function(el) {
				runners_byd[el.key] = getRunnersByTime(el.runners);
			});
			var steps_data = [];
			var getMaxInStep = function(step_num) {
				var summ = 0;
				var all_runners_in_step = [];
				reversed_groups.forEach(function(el) {
					summ += runners_byd[el.key][step_num].length;
					all_runners_in_step.push.apply(all_runners_in_step, runners_byd[el.key][step_num]);
				});

				steps_data.push(all_runners_in_step);
				return summ;
			};

			var max_runners_in_step = 0;
			for (var i = 0; i < steps; i++) {
				max_runners_in_step = Math.max(max_runners_in_step, getMaxInStep(i));
			}
			
			this.height = Math.max(this.original_height, max_runners_in_step * this.y_scale);

			var height_factor = this.height/ (max_runners_in_step * this.y_scale);
			this.c.css('height', this.height);
			this.svgc.css('height', this.height);

			return {
				steps: steps,
				px_step: px_step,
				height_factor: height_factor,
				runners_byd: runners_byd,
				steps_data: steps_data
			};


		}
	},
	'compx-height_factor': {
		depends_on: ['base_graph_data'],
		fn: function(base_graph_data) {
			return base_graph_data && base_graph_data.height_factor;
		}
	},
	checkPointerMove: function(e) {

		var pos = e.pageX - this.coffset.left;


		var pos_x = Math.floor(pos/this.px_step);
		if (pos_x < 0){
			this.promiseStateUpdate('selector', false);
			return;
		}
		var base_graph_data = this.state('base_graph_data');
		if (!base_graph_data){
			this.promiseStateUpdate('selector', false);
			return;
		}

		var pos_y = Math.floor((this.height - (e.pageY - this.coffset.top))/base_graph_data.height_factor);

		if (pos_y < 0){
			this.promiseStateUpdate('selector', false);
			return;
		}

		this.promiseStateUpdate('selector', {
			pos_x_factor: this.width/pos,
			pos_x: pos_x,
			pos_y: pos_y
		});
	},
	age_words: ['год', 'года', 'лет'],
	'compx-selector_matching': {
		depends_on: ['selector', 'base_graph_data', 'cvs_data'],
		fn: function(sel, base_graph_data, cvs_data) {
			if (!sel || !base_graph_data || !cvs_data){
				return;
			}
			var used_selector = {};
			var getByS = function(pos_x, pos_y) {
				used_selector.pos_x = pos_x;
				used_selector.pos_y = pos_y;
				return spv.getTargetField(base_graph_data.steps_data, [pos_x, pos_y]);

			};
			var matched = getByS(sel.pos_x, sel.pos_y);
			if (!matched){
				matched = getByS(sel.pos_x +1, sel.pos_y);
			}
			if (!matched){
				matched = getByS(sel.pos_x -1, sel.pos_y);
			}
			if (!matched){
				matched = getByS(sel.pos_x, sel.pos_y + 1);
			}
			if (!matched){
				matched = getByS(sel.pos_x, sel.pos_y - 1);
			}

			if (!matched){
				return;
			} else {
				if (!matched.end_time_string){
					matched.end_time_string = matched.result_time_string;
				}
				if (!matched.age_years && matched.birthyear){
					var age = (new Date(cvs_data.start_time)).getFullYear() - matched.birthyear;
                    var age_text = (locale == 'rus') ? this.age_words[spv.getUnitBaseNum(age)] : 'years old'
					matched.age_years = age + ' ' + age_text;
	
				}
				return {
					runner: matched,
					selector: used_selector
				};
			}
			
		}
	},
	'compx-draw': {
		depends_on: ['base_graph_data', 'current_runners_data', 'age_areas', 'selected_time'],
		fn: function(base_graph_data, current_runners_data, age_areas, selected_time) {
			if (!base_graph_data || !current_runners_data ||!age_areas){
				return;
			}

			var _this = this;

			var reversed_groups = current_runners_data.runners_groups.slice();
			reversed_groups.reverse();
			var points_byd = {};
            var points_byd_left = {};
            var points_byd_right = {};


			var steps = base_graph_data.steps;
            var cur_step = selected_time * steps

			var px_step = this.px_step;
			var height_factor = base_graph_data.height_factor;
			var runners_byd = base_graph_data.runners_byd;

			var getRunByDPoints = function(array, prev_array) {

				var result = [];
                var result1 = []
                var result2 = []
				for (var i = 0; i < steps; i++) {
					var x1 = i * px_step;
					var x2 = x1 + px_step;
					var y = _this.height - height_factor * array[i].length;
                    if (!y && y!==0) return [[],[],[]]
					if (prev_array){
						var prev_v = prev_array[i *2];
						y = y - (_this.height - prev_v.y);
					}
					



					result.push({
						x: x1,
						y: y
					}, {
						x: x2,
						y: y
					});
                    if (i <= cur_step) {
                        result1.push({
                            x: x1,
                            y: y
                        }, {
                            x: x2,
                            y: y
                        });
                    } else {
                        result2.push({
                            x: x1,
                            y: y
                        }, {
                            x: x2,
                            y: y
                        });
                    }
				}
                if (!result2.length) result2.push({
                    x: x2,
                    y: y
                }, {
                    x: x2,
                    y: y
                });
				return [result, result1, result2];
			};

			reversed_groups.forEach(function(el, i) {
				var prev = reversed_groups[i-1];
				prev = prev && points_byd[prev.key];
				points_byd[el.key] = getRunByDPoints(runners_byd[el.key], prev)[0]
                points_byd_left[el.key] = getRunByDPoints(runners_byd[el.key], prev)[1]
                points_byd_right[el.key] = getRunByDPoints(runners_byd[el.key], prev)[2];
			});



            var areas_data_left = {}
            var areas_data_right = {}

			var getRunByDPathData = function(array) {
                if (!array.length) {
                    return
                }
                var result = '';
				result += 'M' + mh.format({x: array[0].x, y: _this.height});
				for (var i = 0; i < array.length; i++) {
					result += ' L' + mh.format(array[i]);
				}
				result += ' L' + mh.format({x: (array[array.length - 1]).x, y: _this.height});
				result += ' Z';
				return result;
			};
			current_runners_data.runners_groups.forEach(function(el) {
                areas_data_left[el.key] = getRunByDPathData(points_byd_left[el.key]);
                areas_data_right[el.key] = getRunByDPathData(points_byd_right[el.key]);
			});


			current_runners_data.runners_groups.forEach(function(el) {
                age_areas[el.key].left.attr("d", areas_data_left[el.key]);
                age_areas[el.key].right.attr("d", areas_data_right[el.key]);
			});

			return {
				runners_byd: runners_byd,
				points_byd: points_byd,
				areas_data: {
                    left: areas_data_left,
                    right: areas_data_right
                },
				height_factor: height_factor
			};
		}
		
	}
});

return TimeGraphCtr;

});