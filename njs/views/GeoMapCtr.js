define(['provoda', 'spv', 'jquery', 'leaflet', './RunMapCtr'], function(provoda, spv, $, L, RunMapCtr) {
    "use strict";
    var GeoMapCtr = function() {};
    provoda.View.extendTo(GeoMapCtr, {
        children_views:{
            run_map: RunMapCtr
        },
        'collch-run_map': true,
        bindBase: function() {/*
// create a map in the "map" div, set the view to a given place and zoom
            var div = document.createElement('div');
            this.c.append(div);
            this.map_con = div
            this.zoom = 0.778;
            this.height = Math.max((window.innerHeight - 80)/this.zoom, 600/this.zoom);
            $(div).css({
                left: 0,
                right: 0,
                top: 0,
                height: this.height,
                position: 'absolute',
                'z-index': -1,
                zoom: this.zoom
            });

            var map = L.map(div, {
                zoomControl:false,
                trackResize: false
            }).setView([59.9477, 30.363], 13);
            this.map = map;

            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            window.map = map;

            //'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.jpg'
            L.tileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-i86l3621/{z}/{x}/{y}.jpg').addTo(this.map);
            this.wch(this, 'vis_con_appended', function(e) {
                if (e.value){
                    this.createDD();
                }
            });
            this.project = function(p) {
                var point = map.latLngToLayerPoint(new L.LatLng(p[1], p[0]));
                return [point.x, point.y];
            };
            var _this = this;
            $(window).on('resize', spv.debounce(function() {
                _this.checkSizes();
            },100));
            this.wch(this, 'width', function(e) {
                this.parent_view.promiseStateUpdate('mapwidth', e.value);
            });
            this.wch(this, 'height', function(e) {
                this.parent_view.promiseStateUpdate('mapheight', e.value);
            });
            this.checkSizes();
        */},
        createDD: function() {
        }/*,
        checkSizes: function() {
            var result = {};
            var container = this.c.parent();
            if (container[0]){
                result.width = container.width();
                result.height = container.height();
            }
            result.height = Math.max((window.innerHeight - 80)/this.zoom, 600/this.zoom);

            var zopts = {animate: false};

            var zooml = this.map.getZoom();
            var newHeight = Math.max((window.innerHeight - 80)/this.zoom, 600/this.zoom);
            var newZoom = this.zoom * newHeight/this.height;

            newHeight = Math.max((window.innerHeight - 80)/newZoom, 600/newZoom);

            //this.map.invalidateSize(zopts);
            //this.map.setZoom(zooml + 1, zopts);
            //this.map.setZoom(zooml, zopts);

            $(this.map_con).css({
                height: newHeight,
                zoom: newZoom
            });
            this.updateManyStates(result);
        },
        updateManyStates: function(obj) {
            var changes_list = [];
            for (var name in obj) {
                changes_list.push(name, obj[name]);
            }
            this._updateProxy(changes_list);
        },
        'compx-geobounds': {
            depends_on: ['^geodata'],
            fn: function(geodata) {
                var lay = L.geoJson(geodata);
                var geobounds = lay.getBounds();
                //this.map.fitBounds(geobounds, {animate: false});  // если бы змей был привязан к карте - по ресайзу можно было бы делать так - центрировать по границам
                                                                    //но сейчас в итоге всё сползает
                return geobounds;

            }
        }*/
    });
    return GeoMapCtr;
});