define(['provoda', 'jquery', './GeoMapCtr', './TimeGraphCtr', './modules/colors', 'spv', 'd3', './modules/maphelper'],
function(provoda, $, GeoMapCtr, TimeGraphCtr, colors, spv, d3, mh) {
"use strict";

var RunMapCompxCtr = function() {};
provoda.View.extendTo(RunMapCompxCtr, {
	gender_grads: [colors.getRGBGradient(255, ['#FFCBD5', '#EE2046'].map(colors.parseHEXString)), colors.getRGBGradient(255, ['#B8E8FF', '#1D56DF'].map(colors.parseHEXString))],
	grays: colors.getRGBGradient(4, ['#EEEEEE','#777777'].map(colors.parseHEXString)),
	children_views:{
		geo_map: GeoMapCtr,
		time_graph: TimeGraphCtr
	},
	createDetails: function() {
		this.c = this.root_view.els.runm_c;
		this.createTemplate();

		var svg;
		svg = document.createElementNS(mh.SVGNS, 'svg');
		//this.c = $(svg).css('display', 'none');
		$(svg).appendTo(this.tpl.ancs['legendage']);
		
		this.legendage = d3.select(svg);

		svg = document.createElementNS(mh.SVGNS, 'svg');
		$(svg).appendTo(this.tpl.ancs['legendcount']);
		this.legendcount =  d3.select(svg);


		var scroll_marker = this.tpl.ancs['scroll_marker'];
		var controlls = this.tpl.ancs['controlls'];

		this.marker_width = scroll_marker.width();
		this.half_width = this.marker_width / 2;

		var relative_con = this.tpl.ancs['controlls'];

		var _this = this;


		this.setVisState('con_width', relative_con.width());

		var changeTime = function(pos) {
			var factor = pos/_this.state('vis_con_width');
			factor = Math.min(factor, 1);
			factor = Math.max(factor, 0);
			_this.promiseStateUpdate('', factor);
			_this.RPCLegacy('setTime', factor);
		};

		var watchPos = function(e) {
			var pos = e.pageX - _this.con_offset.left;
			changeTime(pos, _this.con_offset);
		};

		var watchTouchPos = function(e) {
			var pos = e.changedTouches[0].pageX - _this.con_offset.left;
			changeTime(pos, _this.con_offset);
		};

		scroll_marker
			.on('mousedown', function(e) {
				e.preventDefault();
				_this.con_offset = relative_con.offset();
				$(document).on('mousemove', watchPos);
				$(document).on('mouseup', function() {
					$(document).off('mousemove', watchPos);
				});
			});

		//Поведение на тач-устройствах
		//Оригинальные тач-события упакованы в x.Event. Слушаем их на "div.controlls.big_block"
        controlls.on('touchstart', function(e) {
                e.preventDefault();
                // console.log(e,e.type, e.originalEvent)
                _this.con_offset = relative_con.offset();
                controlls.on('touchmove', function(e) {
                	watchTouchPos(e.originalEvent);
                });
                controlls.on('touchend', function(e) {
                	watchTouchPos(e.originalEvent);
                });
            });

		this.wch(this.root_view, 'maxwdith', spv.debounce(function() {
			this.con_offset = null;
			this.checkSizes();
		},100));

		this.wch(this.root_view, 'runners_rate', function(e) {
			this.promiseStateUpdate('runners_rate', e.value);
		});

		this.wch(this.root_view, 'd3map_dets', function(e) {
			this.promiseStateUpdate('d3map_dets', e.value);
		});


		var mpd42 = {},
            mpd10 = {};
		this.mapcover_data_42 = mpd42;
        this.mapcover_data_10 = mpd10;
		['excesstop',
		'excessright',
		'excessbottom',
		'excessleft',
		'bigwidth',
		'bigheight'].forEach(function(el) {
			var value42 = _this.tpl.ancs['mapcover42'].attr(el);
			value42 = value42 * 1;
			mpd42[el] = isNaN(value42) ? 0 : value42;

            var value10 = _this.tpl.ancs['mapcover10'].attr(el);
            value10 = value10 * 1;
            mpd10[el] = isNaN(value10) ? 0 : value10;

		});

		mpd42.clipped_height = mpd42.bigheight - mpd42.excesstop - mpd42.excessbottom;
		mpd42.clipped_width = mpd42.bigwidth - mpd42.excessleft - mpd42.excessright;
        mpd10.clipped_height = mpd10.bigheight - mpd10.excesstop - mpd10.excessbottom;
        mpd10.clipped_width = mpd10.bigwidth - mpd10.excessleft - mpd10.excessright;

	},
	checkSizes: function() {
		this.setVisState('con_width', this.tpl.ancs['controlls'].width());
	},
	'compx-curpos':{
		depends_on: ['selected_time', 'vis_con_width'],
		fn: function(factor, con_width) {
			if (!this.con_offset){
				this.con_offset = this.tpl.ancs['controlls'].offset();
			}
			var start_pos =  - this.half_width;


			var target_pos = start_pos + con_width * factor;
			this.tpl.ancs['scroll_marker'].css('left', target_pos + 'px');
		}
	},
	'compx-time_value': {
		depends_on: ['selected_time', 'cvs_data'],
		fn: function(selected_time, cvs_data) {
			if (cvs_data && typeof selected_time != 'undefined'){
				return cvs_data.run_gap * selected_time;     //cvs_data.run_gap - максимальное время (временной интервал) в секундах, selected_time от 0 до 1
			}
		}
	},
    'compx-legendcount': {
        depends_on: ['cvs_data'],
        fn: function(cvs_data) {
            if (!cvs_data)return
            var container = this.tpl.ancs['legendcount'];
            var width = 80
            var height= 20//container.height();
            var factor = cvs_data.genders_groups[0].raw.length / cvs_data.items.length
            $(this.legendcount.node()).css({
                width: width,
                height: height
            });
            var svg = this.legendcount
            function formatSnakePath(width, height, factor) {
                return 'M0 '+ height +
                    'L' + width + ' ' + height +
                    'L' + width + ' ' + height * (1 - factor) +
                    ' C'+ width / 2 +' ' + (height * (1 - factor) +  height * factor / 5) + ' ' +
                    ( width / 2) + ' ' + (height - 1 * height * factor / 20) +
                    ' 0 ' + height + ' Z'
            }
            svg.append('path')
                .attr('d', formatSnakePath(width, height, 1))
                .style('fill', '#82c0fd')
            svg.append('path')
                .attr('d', formatSnakePath(width, height, factor))
                .style('fill', '#f492a2')
            svg.selectAll('path').style('stroke', 'none')
            return height
        }
    },
    'compx-legendcount_text': {
        depends_on: ['runners_rate', 'legendcount'],
        fn: function(runners_rate, height) {
            if (!runners_rate || !height) return
            var count = Math.round(mh.getStepValueByHeight(height, runners_rate.step));
            count = (count % 100 > 50 ? count - count % 100 + 100 : count - count % 100)
            this.tpl.ancs['legendcounttext'].empty();
            var num_span = $('<div>' + count + '</div>').css({width: 20, float: 'left'});
            var span = $('<div class="textblock"></div>');
            var text = (locale == 'rus')? " бегунов на км":' runners per&nbsp;1&nbsp;km'
            span.html(text);

            this.tpl.ancs['legendcounttext'].append(num_span);
            this.tpl.ancs['legendcounttext'].append(span);
        }
    },
	'compx-legend_age':{
		depends_on: ['cvs_data'],
		fn: function(cvs_data) {
			var container = this.tpl.ancs['legendage'];
			var width  = container.width();
			var height = container.height();
			var svg = this.legendage;
			svg.selectAll('*').remove();
			$(svg.node()).css('width', width);

			var space = 1;
			var vert_space = 1;
			var half_width = width / 2;
			//var _this = this;
			
			var max1 = cvs_data.big_genders_groups[1].age_groups.max;
			var max2 = cvs_data.big_genders_groups[0].age_groups.max;
			
			var lng1 = cvs_data.big_genders_groups[1].age_groups.lng;
			var lng2 = cvs_data.big_genders_groups[0].age_groups.lng;

            var height_factor = (height - vert_space * cvs_data.big_genders_groups[1].age_groups.length) / Math.max(lng1, lng2);
            var width_factor  = height_factor * (width - space) / (2 * (max1 + max2));
			
            // var width_factor = 0.1;

			var result_data = {
				text_desc:[]
			};

			var _this = this;

			(function(){
				var array = cvs_data.big_genders_groups[1].age_groups;
				var grad = _this.gender_grads[1];
				var limit = half_width - space/2;
				
				var el_top = 0;
				
                // console.log(array);
				
				for (var i = 0; i < cvs_data.big_genders_groups[1].age_groups.length; i++) {

                    var cur = cvs_data.big_genders_groups[1].age_groups[i];

                    var rstart = cvs_data.big_ages_ranges[i].start;
                    var rend   = cvs_data.big_ages_ranges[i].end;

                    // console.log(rstart);

					var y = el_top;
					var rheight = height_factor * (rend - rstart + 1);
					var rwidth  = (cur.length * width_factor / rheight);
					var x = limit - rwidth;
					                    
					var color = colors.getGradColor(i, 1, array.length, grad);

					svg.append('rect').attr({
						x: x,
						y: y,
						width:  rwidth,
						height: rheight,
						fill: color
					});

                    // console.log(rstart, rend, color, x, y, rwidth, rheight);
				
				    el_top = el_top + rheight + vert_space;
				};

			})();

			(function(){
				var array = cvs_data.big_genders_groups[0].age_groups;
				var grad = _this.gender_grads[0];
				var limit = half_width - space/2;
				
				var el_top = 0;
				
                // console.log(array);
                
                var max_length = 0;
                
                for (var i = 0; i < cvs_data.big_genders_groups[0].age_groups.length; i++) {
                    var cur = cvs_data.big_genders_groups[0].age_groups[i];

                    var rstart = cvs_data.big_ages_ranges[i].start;
                    var rend   = cvs_data.big_ages_ranges[i].end;

					var rwidth  = (cur.length * width_factor / (height_factor * (rend - rstart + 1)));
					                    
					if (rwidth > max_length) {
					    max_length = rwidth;
					}                
                }
				
				for (var i = 0; i < cvs_data.big_genders_groups[0].age_groups.length; i++) {

                    var cur = cvs_data.big_genders_groups[0].age_groups[i];

                    var rstart = cvs_data.big_ages_ranges[i].start;
                    var rend   = cvs_data.big_ages_ranges[i].end;

                    // console.log(rstart);

					var y = el_top;
					var rheight = height_factor * (rend - rstart + 1);
					var rwidth  = (cur.length * width_factor / rheight);
					var x = width - limit;
					                    
					var color = colors.getGradColor(i+1, 1, array.length, grad);

					svg.append('rect').attr({
						x: x,
						y: y,
						width:  rwidth,
						height: rheight,
						fill: color
					});

                    result_data.text_desc[i] = {
                     x: x + max_length,
                     y: y + rheight / 2
                    };

                    // console.log(rstart, rend, color, x, y, rwidth, rheight);
				
				    el_top = el_top + rheight + vert_space;
				};

			})();
			return result_data;
		}
	},
	'compx-legend_age_text':{
		depends_on: ['legend_age', 'cvs_data'],
		fn: function(legend_age, cvs_data) {
			if (!legend_age){
				return;
			}
			var con = this.tpl.ancs['legendage_textc'];
			con.empty();
			var dfrg = document.createDocumentFragment();

			for (var i = 0; i < cvs_data.big_ages_ranges.length; i++) {
				var cur = cvs_data.big_ages_ranges[i];
				$('<span class="textblock"></span>').appendTo(dfrg).css({
					top: Math.round(legend_age.text_desc[i].y),
					left: Math.round(legend_age.text_desc[i].x)
				}).text(cur.label);
				//cvs_data.big_ages_ranges[i]
			}
			con.append(dfrg);

		}
	},

	getPointPxByDistance: function(geodata, distance) {
		var pp = mh.getPointAtDistance(geodata.geometry.coordinates, distance, true);
		var point = this.root_view.projection(pp.target);
		point[2] = pp.target[2];
		return point.map(Math.round);
	},
	'compx-start_point':{
		depends_on: ['d3map_dets', 'geodata'],
		fn: function(d3map_dets, geodata) {
			if (d3map_dets && geodata){
				return this.getPointPxByDistance(geodata, 0);
			}
		}
	},
	'compx-end_point':{
		depends_on: ['d3map_dets', 'geodata'],
		fn: function(d3map_dets, geodata) {
			if (d3map_dets && geodata){
				return this.root_view.projection(geodata.geometry.coordinates[geodata.geometry.coordinates.length - 1]);
			}
		}
	},

	'compx-mapcover_hor': {
		depends_on: ['trackwidth', 'track_left_padding', 'distance_type'],
		fn: function(trackwidth, track_left_padding, type) {
			if (trackwidth){
				track_left_padding = track_left_padding || 0;
				var mpd = (type == 42) ? this.mapcover_data_42 : this.mapcover_data_10;
				var width_factor = trackwidth/mpd.clipped_width;
                this.tpl.ancs['mapcover'+ type].css({
                    width: width_factor * mpd.bigwidth,
                    left: track_left_padding -  mpd.excessleft * width_factor
                });
            return true
			}

		}
	},
	'compx-mapcover_vert':{
		depends_on: ['trackheight', 'track_top_padding', 'distance_type'],
		fn: function(trackheight, track_top_padding, type) {
			if (trackheight){
				track_top_padding = track_top_padding || 0;
				var mpd = (type == 42) ? this.mapcover_data_42 : this.mapcover_data_10;
				var height_factor = trackheight/mpd.clipped_height;
                this.tpl.ancs['mapcover'+ type].css({
                    height: height_factor * mpd.bigheight,
                    top: (track_top_padding -  mpd.excesstop * height_factor)
                });
                return true
            }

		}
	}
});
return RunMapCompxCtr;
});