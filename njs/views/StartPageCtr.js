define(['provoda', 'jquery','spv'],
function(provoda, $, spv) {
"use strict";

var StartPageCtr = function() {};
provoda.View.extendTo(StartPageCtr, {
	children_views:{

	},
	createDetails: function() {
		this.c = this.root_view.els.start_screen;
		this.createTemplate();
		
		this.c.find('.filterr_menu').each(function(i, el) {
			var root = $(el);
            root.find('.filtrr').click(function(e) {
				e.stopPropagation();
				root.toggleClass('menu_opened');
			});
			root.click(function(e) {
				e.stopPropagation();
				root.removeClass('menu_opened');
			});
			$(document).click(function() {
				root.removeClass('menu_opened');
			});

            root.find('.filtrr').on('touch',function(e) {
                e.stopPropagation();
                root.toggleClass('menu_opened');
            });
            root.on('touch', function(e) {
                e.stopPropagation();
                root.removeClass('menu_opened');
            });
            $(document).on('touch', function() {
                root.removeClass('menu_opened');
            });
			
		});
		this.header = this.tpl.ancs['runners_header'];
		this.list = this.tpl.ancs['runners_list'];

		this.promiseStateUpdate('header_height', this.header.height());


		var _this = this;
		$(window).on('resize', spv.throttle(function() {
			_this.checkListWidth();
			_this.checkListPos();
			_this.checkFixPos();

		}, 150));
		this.wch(this.root_view, 'mapheight', function(e) {
			if (!e.value){
				return;
			}
			this.checkListWidth();
			this.checkListPos();
			this.checkFixPos();
		});

		$(window).on('scroll', function() {

			_this.checkFixPos();
		});

	},
	'after-collch-runners_filtered':function() {
		this.nextTick(function() {
			this.checkListPos();
			this.checkFixPos();
		});
	},
	checkListWidth: function() {
		this.list_width = this.list.width();
	},
	checkFixPos: function() {
		
		var list_top = this.state('list_top');
		var list_bottom = this.state('list_bottom');
		var header_height = this.state('header_height');
		if (list_top && list_bottom){

			var list_width = this.list_width;

			var possible_top = list_top - header_height;
			var possible_bottom = list_bottom;
			var scroll_top = $(window).scrollTop();
			var need_fix = scroll_top > possible_top && scroll_top < possible_bottom;
			this.header.toggleClass('fixed_rheader', need_fix);
			this.list.css('margin-top', need_fix ? (header_height + 'px') : '' );
			this.header.css({
				left: need_fix ? this.list_offset.left : '',
				width: need_fix ? list_width : ''
			});
		}

	},
	checkListPos: function() {
		this.list_offset = this.list.offset();
		var top = this.list_offset.top;
		this.promiseStateUpdate('list_top', top);
		this.promiseStateUpdate('list_bottom', top + this.list.height());

	},
	tpl_events:{
		makeSearch: spv.debounce(function(e, node) {
			this.RPCLegacy('makeSearch', $(node).val());
		}, 200)
	},
	setFilterBy: function(type, scope) {
		var item = scope.filtr_item;
		this.RPCLegacy('setFilterBy', type, !item.novalue && item.label);
	}
});
return StartPageCtr;
});