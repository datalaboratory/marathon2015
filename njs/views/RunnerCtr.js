define(['provoda', 'jquery','spv'],
function(provoda, $, spv) {
"use strict";

var RunnerCtr = function() {};
provoda.View.extendTo(RunnerCtr, {
	children_views:{

	},
	createBase: function() {
		this.c = this.root_view.getSample('runner_page');
		this.createTemplate();
	}
});

return RunnerCtr;
});