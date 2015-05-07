(function(){
"use strict";
for (var i = 0; i < window.jsondata.items.length; i++) {
	var cur = window.jsondata.items[i];
//	cur.pos = cur.gender_pos;
	//window.jsondata[i]
}

window.onmessage = function(e) {
	
	if (e.data == 'send_data'){
		var parent = window.parent;
		if (parent){
			parent.postMessage({
				cvs_data: true,
				data: window.jsondata,
				key: 10
			}, '*');
		}
	}
};
})();