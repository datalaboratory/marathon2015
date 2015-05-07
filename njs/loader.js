(function(){
"use strict";
requirejs.config({
	paths: {
		provoda: 'libs/provoda',
		spv: 'libs/spv',
		angbo: 'libs/StatementsAngularParser.min',
		jquery: 'libs/jquery-2.0.2.min',
		d3: 'libs/d3.v3.min',
		leaflet: 'libs/leaflet',
		lodash: 'libs/lodash.min',
		moment: 'libs/moment+langs.min'
	},
	shim: {
		"jquery-ui": {
			exports: "$",
			deps: ['jquery']
		},
		segments_data: {
			init: function(){
				return {
					types_features: window.types_features,
					uds_object: window.uds_object,
					segments: window.segments
				};
			}
		},
		d3: {
			exports: 'd3'
		}
	}
});

require(['models/AppModel', 'views/AppView', 'angbo', 'provoda'], function(AppModel, AppView, angbo, provoda) {
	var md = new AppModel();
	md.init();
	window.app = md;

	var proxies_space = Date.now();
	var views_proxies = provoda.views_proxies;
	views_proxies.addSpaceById(proxies_space, md);
	var mpx = views_proxies.getMPX(proxies_space, md);

	//скроллим к визуализации
	$('html, body').animate({ scrollTop: $(".big-wrap").offset().top }, 200);

	(function() {
		var view = new AppView();
		mpx.addView(view, 'root');
		view.init({
			mpx: mpx,
			proxies_space: proxies_space
		}, {d: window.document, angbo: angbo});
		view.onDie(function() {
			//views_proxies.removeSpaceById(proxies_space);
			view = null;
		});
		view.requestAll();
	})();

    $(window).on('resize', updateImgVert)
    function updateImgVert() {
        var link = (locale == 'rus') ? 'i/mm-logo.png' : '../i/mm-logo.png'
        var style = 'url(' + link + ') no-repeat 50% ' + window.innerHeight/2 + 'px'
        $('.before_load').css({
            background: style,
            "background-size" : "62px"
        })
    }
    updateImgVert();
});

})();