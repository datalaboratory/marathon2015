define(['provoda', './modules/mm2014-42km-geo','./modules/mm2014-10km-geo','./modules/mm2014-42km-geo-accurate','./modules/mm2014-10km-geo-accurate', './modules/cvsloader'],
    function(provoda, geodata42, geodata10, geodata_alt42, geodata_alt10, cvsloader) {
"use strict";




var TimeGraph = function() {};
provoda.HModel.extendTo(TimeGraph, {
	init: function(opts) {
		this._super(opts);
        var _this = this;
        this.wch(this.map_parent, 'distance_type', function(e) {
            var geodata = (e.value == 42) ? geodata42 : geodata10
            _this.updateState('geodata', geodata)
        })
		this.wlch(this.map_parent, 'selected_time');
        this.wlch(this.map_parent, 'distance_type')
        cvsloader.on('load', function(data) {
            this.updateState('cvs_data', data.data42)
        }, this.getContextOpts());
		this.wlch(this.map_parent.map_parent, 'current_runners_data');
        this.wlch(this.app, 'cvs_data');

	}
});

var RunMap = function() {};
provoda.HModel.extendTo(RunMap, {
	init: function(opts) {
		this._super(opts);

		this.wlch(this.map_parent.map_parent, 'selected_time');
        this.wlch(this.map_parent.map_parent, 'distance_type')
        this.wlch(this.map_parent.map_parent, 'geo_alt')
        var _this = this;
        this.wch(this.map_parent.map_parent, 'distance_type', function(e) {
            var geodata = (e.value == 42) ? geodata42 : geodata10
            _this.updateState('geodata', geodata)
        })
        this.wlch(this.app, 'cvs_data')

		this.wlch(this.map_parent.map_parent.map_parent, 'current_runners_data');


		cvsloader.on('load', function(data) {
            this.updateState('cvs_data', data.data42)
		}, this.getContextOpts());

		this.app.on('child_change-selected_runners', function(e) {
			_this.updateNesting('selected_runners', e.value);
		});
	}
});

var GeoMap = function() {};
provoda.HModel.extendTo(GeoMap, {
	init: function(opts) {
		this._super(opts);

		var run_map = new RunMap();
		run_map.init({
			app: this.app,
			map_parent: this
		});
		this.updateNesting('run_map', run_map);
	}
});


var RunnerMapComplex = function() {};
provoda.HModel.extendTo(RunnerMapComplex, {
	init: function(opts){
        var _this = this;
		this._super(opts);
        this.updateState('geodata', geodata42);
        this.updateState('distance_type', 42);
        this.updateState('geo_alt', geodata_alt42);

        cvsloader.on('load', function(data) {
            this.updateState('cvs_data42', data.data42)
            this.updateState('cvs_data10', data.data10)
            this.updateState('cvs_data', data.data42)
        }, this.getContextOpts());

		var common_sub_opts = {
			app: this.app,
			map_parent: this
		};
		
		var geo_map = new GeoMap();
		geo_map.init(common_sub_opts);
		this.updateNesting('geo_map', geo_map);

		var time_graph = new TimeGraph();
		time_graph.init(common_sub_opts);
		this.updateNesting('time_graph', time_graph);


		this.setTime(0.2);
		this.wlch(this.app, 'current_runner_data');
        this.wlch(this.app, 'cvs_data');
        $(document).click(function() {
            if (_this.state('menu_opened')){
                _this.updateState('menu_opened', false)
            }
        });
        var menu_item42 = $('.42menu_item')
        var menu_item10 = $('.10menu_item')

        function setToggle(current_item, other_item){
            current_item.mouseover(function(){
                if (_this.state('menu_opened')) {
                    other_item.removeClass('current_menu_item')
                    current_item.addClass('current_menu_item')
                }
            })
            current_item.mouseleave(function(){
                if (_this.state('menu_opened')) {
                    other_item.addClass('current_menu_item')
                    current_item.removeClass('current_menu_item')
                }
            })
            current_item.click(function(){
                current_item
                    .addClass('current_menu_item')
                    .unbind('mouseover')
                    .unbind('mouseleave')
                other_item.removeClass('current_menu_item')
                setToggle(other_item, current_item)

            })
        }
        setToggle(menu_item42, menu_item10)

	},
	setTime: function(factor) {
		this.updateState('selected_time', factor);
	},
    updateGeo42: function(e) {
        e.event.stopPropagation();
        $('.before_load').css({
            position: 'absolute'
        })
        if (this.state('distance_type') == 42) {
            this.updateState('menu_opened', !this.state('menu_opened'))
        } else {
            this.updateState('menu_opened', false)
            this.updateState('distance_type', 42)
            this.updateState('geodata', geodata42)
            this.updateState('geo_alt', geodata_alt42);

            var data42 = this.state('cvs_data42')
            this.app.updateState('cvs_data', data42)
            $('.legendage_c .svgcon').css({'margin-right': '-68px'})
        }

    },
    updateGeo10: function(e) {
        e.event.stopPropagation();
        $('.before_load').css({
            position: 'absolute'
        })
        if (this.state('distance_type') == 10) {
            this.updateState('menu_opened', !this.state('menu_opened'))
        } else {
            this.updateState('menu_opened', false)
            this.updateState('distance_type', 10)
            this.updateState('geodata', geodata10)
            this.updateState('geo_alt', geodata_alt10);

            var data10 = this.state('cvs_data10')
            this.app.updateState('cvs_data', data10)
            $('.legendage_c .svgcon').css({'margin-right': '-39px'})
        }

    }
});
return RunnerMapComplex;
});