define(['../libs/BrowseMap', 'spv', 'provoda', './Runner', './modules/cvsloader', 'lodash'],
function(BrowseMap, spv, provoda, Runner, cvsloader, _) {
"use strict";


var FilterItem = function() {};
BrowseMap.Model.extendTo(FilterItem, {
	init: function(opts, params, type) {
		this._super(opts);
		spv.cloneObj(this.init_states, params);
		this.init_states.type = type;
		this.initStates();
		this.wch(this.map_parent, 'selected_filter_' + type, this.checkActiveState);

	},
	checkActiveState: function(e) {
		var novalue = this.state('novalue');
        var _this = this
        if (this.state('type') =='gender') {
            this.updateState('no_men', _this.map_parent.no_men)
            this.updateState('no_women', _this.map_parent.no_women)
        }
		if (novalue){
			this.updateState('active', !e.value);
		} else {
			this.updateState('active', e.value && e.value == this.state('label'));
		}
	},
	setFilter: function() {
        var _this = this
       // if (!(this.state('type') == 'gender' &&
          //   (this.state('no_men') || this.state('no_women')))) {
            this.map_parent.updateState('last_filter', this.state('type'))
            this.map_parent.setFilterBy(this.state('type'), !this.state('novalue') && this.state('label'));
        //}

	}
});


var StartPage = function() {};
BrowseMap.Model.extendTo(StartPage, {
	model_name: 'start_page',
	zero_map_level: true,
	init: function(opts) {
        var _this = this
		this._super(opts);
		this.common_sopts = {app: this.app, map_parent: this};
		this.updateState('query', '');

		cvsloader.on('load', function(data) {
            this.updateState('cvsdata42', data.data42)
            this.updateState('cvsdata10', data.data10)
            this.updateState('cvsdata', data.data42)

		}, this.getContextOpts());

        this.wch(this.app, 'cvs_data', function(e){
            _this.updateState('cvsdata', e.value);
            _this.app.updateNesting('selected_runners', []);
            _this.updateState('last_filter', '');

        })
        this.wch(this, 'cvsdata', function(e){
            if (!e.value) return
            var data = e.value
            _this.cvsdata = data;
            _this.filters = {};
            _this.filters_cache = {};
            var runners = [];
            for (var i = 0; i < data.items.length; i++) {
                var runner = new Runner();
                runner.init(this.common_sopts, data.items[i]);
                data.items[i].model = runner;
                runners.push(runner);
            }
            _this.updateNesting('runners', runners);
            _this.getIndexes(runners, data);
            _this.makeFiltersResult();
            _this.clearFilters();

        })

		this.filters = {};
		this.filters_cache = {};

		this.wch(this, 'query', function(e) {
			var runners = this.getNesting('runners');
			if (!runners){
				return;
			}
			if (e.value){
				this.searched_r = spv.searchInArray(runners, e.value, this.search_fields);
			} else {
				this.searched_r = [];
				
			}
			this.checkRunners(true);
		});
		this.wch(this, 'current_pages', function() {
			this.checkRunners();
		});


		this.on('child_change-full_filtered_list', function(e) {
			if (!e.value) {
				return;
			}

			var raw_array = spv.filter(e.value, 'rawdata');
			var obj = cvsloader.getGenderAgesGroups(raw_array, this.cvsdata.age_ranges, this.cvsdata.start_year);
			obj.items = raw_array;
			this.app.updateState('current_runners_data', obj);
            this.updateFilters(e)
		});

        var city_header = (locale == 'rus') ? ['город', 'города', 'городов'] : ['city', 'cities']
        var team_header = (locale == 'rus') ? ['команда', 'команды', 'команд'] : ['team', 'teams']
        this.runner_state_filters = [{
            name: 'team',
            limit: 1,
            no_flabel: team_header
        }, {
            name: 'city',
            limit: 1,
            no_flabel: city_header
        }]
		this.no_men = false
        this.no_women = false
		return this;
	},
	page_limit: 100,
	switchSelectRunner: function(md) {
		var arr = this.app.getNesting('selected_runners') || [];
		var pos = arr.indexOf(md);
		if (pos == -1) {
			if (arr.length == 5) {
				var elder_md = arr.shift();
				elder_md.updateState('selected', false);
			}
			
			arr.push(md);

			md.updateState('selected', true);
			this.app.updateNesting('selected_runners', arr);
		} else {
			md.updateState('selected', false);
			arr.splice(pos, 1);
			this.app.updateNesting('selected_runners', arr);
		}
	},
	makeSearch: function(query) {
		this.updateState('query', query);
	},
	search_fields: [['states','num'], ['states','full_name'], ['states','gender_pos']],
    clearFilters: function () {
        this.updateState('last_filter', '');

        //Обнуляем поле ("Имя или номер")
        this.updateState('query', "");
        $(".firunr_search").prop("value","");

        this.setFilterBy('gender', false);
        this.setFilterBy('ages', false);
        this.setFilterBy('team', false);
        this.setFilterBy('city', false);
    },
	getFilterData: function(runners, field, limit) {
		var count = 0;
        var _this = this;
		limit = limit || 0;
		var full_field = ['states', field];
		var index = spv.makeIndexByField(runners, full_field, true);

		var result = [];
		for (var name in index){
			count++;
			if (name == '#other' || index[name].length < limit){
				//continue;
                count--;
                var label = ''
                if (field == 'team')  label = (locale == 'rus') ? 'Команда не указана' : 'Team is not specified'
                if (field == 'city') label = (locale == 'rus') ? 'Город не указан' : 'City is not specified'

                var other_item = {
                    label: label,
                    counter: index[name].length,
                    not_specified: true
                };
                index[label] = index[name]
                continue;
			}
			result.push({
				label: name,
				counter: index[name].length
			});
		}


		var filter_opts = [{
			field: ['counter'],
			reverse: true
		}, {
			field: ['label']
		}];
		result.sort(function(a, b) {
			return spv.sortByRules(a, b, filter_opts);
		});
        var has_other = false
        if (other_item) {
            result.push(other_item)
            has_other = true
        }

		return {
			index: index,
			items: result,
			count: count,
            has_other: has_other
		};
	},
    setFilterResult: function(result, name, no_flabel, reverse) {
        var _this = this
        var selectByNum = function(num, array) {
            return num + ' ' + array[spv.getUnitBaseNum(num)];
        };
        if (!this.filters_cache[name]) this.filters_cache[name] = result.index;
        if (no_flabel){
            if (typeof no_flabel == 'string'){
                result.items.unshift({
                    label: no_flabel,
                    novalue: true,
                    counter: result.count,
                    limited_count: result.items.length
                });
            } else {
                var label;
                var count = (name == 'team') ? result.items.length : result.count
                if (name == 'team' && result.has_other) count--
                if (locale == 'rus'){
                    label = (count) ? selectByNum(count, no_flabel) : 'не указано'
                } else {
                    label = (count > 1) ? count + ' ' + no_flabel[1] : '1 ' + no_flabel[0]
                    label = (count) ? label : 'no ' + no_flabel[1]
                }
                result.items.unshift({
                    label: label,
                    novalue: true,
                    counter: result.count,
                    limited_count: result.items.length
                });

            }

        }
        if (reverse){
            result.items.reverse();
        }

        var array = [];
        for (var i = 0; i < result.items.length; i++) {
            var cur = new FilterItem();
            cur.init(_this.common_sopts, result.items[i], name);
            array.push(cur);
        }
        this.updateNesting('filter_' + name, array);

        this.updateState('filter_' + name, result.items)
    },
    getMinMaxAge: function(runners, cvsdata) {
        var max_age = 0;
        var min_age = 100
        for (var i = 0; i < runners.length; i++) {
            if (!runners[i].states.birthyear || (runners[i].rawdata.gender == 2)){
                continue;
            }
            max_age = Math.max((new Date(cvsdata.start_time)).getFullYear() - runners[i].states.birthyear, max_age);
            min_age = Math.min((new Date(cvsdata.start_time)).getFullYear() - runners[i].states.birthyear, min_age);
        }
        return {min_age: min_age, max_age: max_age}
    },

    getLocalized: function(string, locale, args) {
        var locales = {
            'rus': {
                'all_from': "Все от % до %"
            },
            'en': {
                'all_from': "All from % to %"
            }
        }
        return applyArguments(locales[locale][string], args)
    },
	getIndexes: function(runners, cvsdata) {
		var _this = this;
		
		this.runner_state_filters.forEach(function(el) {
			var result = _this.getFilterData(runners, el.name, el.limit);
            if (el.name == 'team') {
                result.items = result.items.filter(function(item){
                    return item.counter > 2
                })
                _this.teams = result.items.map(function(item){
                    return item.label
                })
            }
			_this.setFilterResult(result, el.name, el.no_flabel);
			
		});

		var ages = this.getMinMaxAge(runners, cvsdata)
        var ages_header = (locale == 'rus') ? ('Все от ' + ages.min_age + ' до ' + ages.max_age) : ('All from ' + ages.min_age + ' to ' + ages.max_age)
		this.setFilterResult(this.getAgesGroups(runners, cvsdata.big_ages_ranges, cvsdata), 'ages', ages_header);

        var gender_header = (locale == 'rus') ? 'Всех вместе' : 'All genders'
		this.setFilterResult(this.getGenderGroups(runners), 'gender', gender_header, true);

	},
    updateFilters: function(e) {
        var _this = this;
        if (!e.value) return;
        var current_runners;

        var cvsdata = this.cvsdata;

        this.runner_state_filters.forEach(function(el) {
                if (_this.state('last_filter') != el.name){
                    current_runners =(_this.filtered_for_filter[el.name]||e.value)
                    var result = _this.getFilterData(current_runners, el.name, el.limit);
                    if (el.name == 'team'){
                        result.items = result.items.filter(function(item){
                            return _.find(_this.teams, function(team){return team == item.label})
                        })
                    }
                    _this.setFilterResult(result, el.name, el.no_flabel);
                }

            });
        current_runners = (this.filtered_for_filter['ages'] || e.value)
        var ages = this.getMinMaxAge(current_runners, cvsdata)

        var ages_text_rus = (ages.min_age == ages.max_age) ? ('Все ' + ages.max_age) : ('Все от ' + ages.min_age + ' до ' + ages.max_age)
        var ages_text_en = (ages.min_age == ages.max_age) ? ('All ' + ages.max_age) : ('All from ' + ages.min_age + ' to ' + ages.max_age)
        var ages_header = (locale == 'rus') ? ages_text_rus : ages_text_en

        var result = this.getAgesGroups(current_runners, cvsdata.big_ages_ranges, cvsdata)
        if (this.state('last_filter') != 'ages') {
            if (!result.items.length) ages_header = (locale == 'rus') ? 'никого нет' : 'nobody'
            this.setFilterResult(result, 'ages', ages_header);
        }

    },
	getGenderGroups: function(runners) {
		var result = [];
		
		var field = ['states', 'gender'];
		var index = spv.makeIndexByField(runners, field, true);

        var label_men = (locale == 'rus') ? 'Мужчин':'Men'
        var label_women = (locale == 'rus') ? 'Женщин':'Women'
        var counter_men = index[0] && index[0].length
        var counter_women = index[1] && index[1].length
        this.no_men = (counter_men) ? false : true
        this.no_women = (counter_women) ? false : true
		result.push({
			label: label_women,
			counter: counter_women
		},{
			label: label_men,
			counter: counter_men
		});

		index = (locale == 'rus')? {
			'Мужчин': index[1],
			'Женщин': index[0]
		}:{
            'Men': index[1],
            'Women': index[0]
        };
		return {
			index: index,
			items: result
		};
	},
	getAgesGroups: function(runners, age_ranges, cvsdata) {
		var result = [];
		var field = ['states', 'birthyear'];
		var groups = cvsdata.getAgeGroups(runners, age_ranges, field);
		var index = {};
		for (var i = 0; i < age_ranges.length; i++) {
            if (groups[i].length){
                index[age_ranges[i].label] = groups[i];
                result.push({
                    label: age_ranges[i].label,
                    counter: groups[i].length
                });
            }
		}
		return {
			index: index,
			items: result
		};
	},
	setFilterBy: function(type, name) {
		if (this.filters[type] == name){
			this.filters[type] = null;
		} else {
			this.filters[type] = name;
		}

        this.updateState('selected_filter_' + type, this.filters[type]);
		this.checkFilters();
	},
	checkFilters: function() {
		var result = [];
		var caches = [];
        var runners = this.getNesting('runners');
		for (var type in  this.filters) {
			var cur = this.filters[type];
			if (!cur){
                caches.push({type: type, value: runners});
				continue;
			}
			result.push({
				type: type,
				value: cur
			});
		}

		var _this = this;
		var sort_rule = [{
			field: function(el) {
				var array = _this.filters_cache[el.type];
				array = array && array[el.value];
				return array && array.length;
			}
		}];

		result.sort(function(a, b) {
			return spv.sortByRules(a, b, sort_rule);
		});

		result.forEach(function(el) {
            var type = el.type;
            var value = _this.filters_cache[el.type][el.value]
			caches.push({type: el.type, value: _this.filters_cache[el.type][el.value]});
		});

		this.makeFiltersResult(result, caches);

	},
	makeFiltersResult: function(filters, caches) {
		var result;
        var cachesCity = [], cachesTeam = [], cachesAges = [], cachesGender = []
        if (caches) {
            caches.forEach(function(cache) {
                if (cache.type!='city') cachesCity.push(cache.value)
                if (cache.type!='team') cachesTeam.push(cache.value)
                if (cache.type!='ages') cachesAges.push(cache.value)
                if (cache.type!='gender') cachesGender.push(cache.value)
            })
            caches = caches.map(function(cache){
                return cache.value
            })
        }

		if (filters && filters.length) {
			result = _.intersection.apply(_, caches);

            this.filtered_for_filter = {
                city: _.intersection.apply(_, cachesCity),
                team: _.intersection.apply(_, cachesTeam),
                ages: _.intersection.apply(_, cachesAges)
            }

		} else {
            result = this.getNesting('runners')
            if (result) {
                result = result.slice();
            }
            this.filtered_for_filter = ''
		}

		var rules = [{field: ['states', 'result_time']}, {field: ['states', 'pos']}, {field: ['states', 'num']}];
		result.sort(function(a, b) {
			return spv.sortByRules(a, b, rules);
		});

        this.filtered_r = result;
		this.checkRunners(true);

	},
	checkRunners: function(reset_page) {
		var has_query = !!this.state('query');

		var result = has_query ? this.searched_r : this.filtered_r;
		if (!result){
			return;
		}

		this.updateNesting('full_filtered_list', result);
		
		var current_pages;
		if (!reset_page){
			current_pages = this.state('current_pages');
		} else {
			current_pages = 0;
			this.updateState('current_pages', current_pages);
		}
		var cutted = result.slice(0, this.page_limit * ((current_pages || 0) + 1));
		this.updateState('has_more_button', result.length > cutted.length);
		this.updateNesting('runners_filtered', cutted);
	},
	showMore: function() {
		var current_pages = this.state('current_pages') || 0;
		this.updateState('current_pages', current_pages + 1);
	}

});
return StartPage;

});