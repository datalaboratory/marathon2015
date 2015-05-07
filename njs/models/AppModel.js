define(['./AppModelBase', './StartPage', 'provoda', './RunnerMapComplex', 'spv'], function(AppModelBase, StartPage, provoda, RunnerMapComplex, spv) {
"use strict";



var AppModel = function(){};
AppModelBase.extendTo(AppModel, {
	init: function() {
		this._super();
		var _this = this;
		this.start_page = (new StartPage()).init({
			app: this
		});
		this.updateNesting('navigation', [this.start_page]);
		this.updateNesting('start_page', this.start_page);


		this.map
			.init(this.start_page)
			.on('map-tree-change', function(nav_tree) {
				_this.changeNavTree(nav_tree);
			}, {immediately: true})
			.on('changes', function(changes) {
				//console.log(changes);
				_this.animateMapChanges(changes);
			}, {immediately: true})
			.on('title-change', function(title) {
				_this.setDocTitle(title);

			}, {immediately: true})
			.makeMainLevel();


		var runs_map_compx = new RunnerMapComplex();
		runs_map_compx.init({
			map_parent: this,
			app: this
		});
		this.runs_map_compx = runs_map_compx;
		this.updateNesting('runs_map_compx', runs_map_compx);
	},
	matchNav: function() {
		var runner = spv.filter(this.nav_tree, 'model_name', 'runner')[0];
		var runner_data = runner && runner.states;
		this.updateState('current_runner_data', runner_data);

	}
});
return AppModel;
});