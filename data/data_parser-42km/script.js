

var items =[];

var jsondata;

// Unix-time старта забега
var start_time =1411275600000;
// Самый медленный результат
var max_time = 23138;


// Создаем MOK-справочник стран
// var mokcodes = {};
// d3.csv("mokcodes.csv", function (d){
// 		d.forEach(function(d){
// 			mokcodes[d.mokCode]=d.countryName;
// 		})
// 	});

var convertToSeconds = function(time_string) {

	if (time_string === "") {
		return 0
	} else {
	 	var time = time_string.split(":");
		time = ((+time[0])*60 + (+time[1]))*60 + (+time[2]);
		return time;
	};
 	
};

// Вычисление итогового времени в часах
var convertToTimeString = function(seconds) {
	var h = seconds/3600 ^ 0 ;
	var m = (seconds-h*3600)/60 ^ 0 ;
	var s = seconds-h*3600-m*60 ;
	return (h<10?"0"+h:h)+":"+(m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
};

// Парсим
var parsedata = function(){
	d3.csv("42km-result.csv", function (d){
		d.forEach(function(d,i){

			var result_time_string;
			var add_city_info="";
			// Ищем название страны по MOK-коду
			// d.country_name = mokcodes[d.country];

			d.pos = +d.pos;
			d.gender_pos = +d.gender_pos;

			result_time_string = d.netto;


			//Обработка поля "city"
			if (d.city !== "") {
			
				if (d.country_name !== "Россия" && d.country_name !== "") {
					add_city_info = ", " + d.country_name;
				};

			} else {
				d.city = d.country_name
			};
			
			//Расшифровка поля "gender"
			if (d.gender === "М") { d.gender = 1 }
				else { d.gender = 0 };

			// Логика для сошедших с дистанции
			if (d.result_time === "н/ф") {
				// gender = 2, чтоб не отображать на диаграмме финишей;
				d.gender = 2;

				// Обнуляем позиции, на всякий случай.
				d.pos = null;
				d.gender_pos = null;

				// Подгоняем время, чтоб на карте бегуны стояли на финише, а в таблице — в самом низу.
				// Может слететь логика подписи "сошел" в таблице
				// d.result_time = max_time + 1;

				d.netto = max_time + 1;


				d["5km_time"] = d.result_time;
				d["10km_time"] = d.result_time;
				d["half_time"] = d.result_time;
				d["30km_time"] = d.result_time;
				d["35km_time"] = d.result_time;
			
			// Если добежал до финиша, то обрабатываем данные времени
			} else {
				// Конвертим 
				d.result_time = convertToSeconds(d.result_time);
				d.netto = convertToSeconds(d.netto);

				d["5km_time"] = convertToSeconds(d["5km_time"]);
				d["10km_time"] = convertToSeconds(d["10km_time"]);
				d["half_time"] = convertToSeconds(d["half_time"]);
				d["30km_time"] = convertToSeconds(d["30km_time"]);
				d["35km_time"] = convertToSeconds(d["35km_time"]);
				
				// Проверяем на опечатки
				// Если "нетто" больше "брутто" или не заполнено, то "нетто" = "брутто"
				if ( d.netto > d.result_time || +d.netto === 0) { 
					console.log("LOG:","time-problem with num", d.num, "42km");
					d.netto = d.result_time;
				};

				// Если время на 5км подозрительно, то "время на 5км" = "нетто/8"
				if ( d["5km_time"]/d.netto > 0.3 || d["5km_time"]/d.netto < 0.06) {
					console.log("LOG:","time-problem with num", d.num, "5km", d["5km_time"]/d.netto);
					d["5km_time"] = d.netto/8;
				};

				// Если время на 10км подозрительно, то "время на 10км" = "нетто/4"
				if ( d["10km_time"]/d.netto > 0.4 || d["10km_time"]/d.netto < 0.1) {
					console.log("LOG:","time-problem with num", d.num, "10km", d["10km_time"]/d.netto);
					d["10km_time"] = d.netto/4;
				};

				// Если время на 21км подозрительно, то "время на 21км" = "нетто/2"
				if ( d["half_time"]/d.netto > 0.65 || d["half_time"]/d.netto < 0.25) {
					console.log("LOG:","time-problem with num", d.num, "21km", d["half_time"]/d.netto);
					d["half_time"] = d.netto/2;
				};

				// Если время на 30км подозрительно, то "время на 30км" = "нетто/"
				if ( d["30km_time"]/d.netto > 0.8 || d["30km_time"]/d.netto < 0.5) {
					console.log("LOG:","time-problem with num", d.num, "30km", d["30km_time"]/d.netto);
					d["30km_time"] = d.netto/1.4;
				};
				
				// Если время на 35км подозрительно, то "время на 35км" = "нетто/"
				if ( d["35km_time"]/d.netto > 0.9 || d["35km_time"]/d.netto < 0.6) {
					console.log("LOG:","time-problem with num", d.num, "35km", d["35km_time"]/d.netto);
					d["35km_time"] = d.netto/1.2;
				};
			};

			items[i] = 
						{
				"num": +d.num,
				"birthyear": +d.birthyear,
				"full_name": d.full_name,
				"gender": d.gender,
				"pos": d.pos,
				"gender_pos": d.gender_pos,
				"result_time": +d.netto,
				"result_time_string": result_time_string,
				"start_time": start_time,
				"end_time": start_time + d.netto*1000,
				"result_steps": [
					{
						"distance": 0,
						"time": start_time + (d.result_time - d.netto)*1000
					},
					{
						"distance": 5000,
						"time": start_time + d["5km_time"] * 1000
					},
					{
						"distance": 10000,
						"time": start_time + d["10km_time"] * 1000
					},
					{
						"distance": 21000,
						"time": start_time + d["half_time"] * 1000
					},
					{
						"distance": 30000,
						"time": start_time + d["30km_time"] * 1000
					},
					{
						"distance": 35000,
						"time": start_time + d["35km_time"] * 1000
					},
					{
						"distance": 42280,
						"time": start_time + d.netto*1000
					}
				],
				"team": d.team,
				// "country": d.country,
				"country_name":d.country_name,
				"region": d.region,
				"city": d.city + add_city_info
			}

		})

		jsondata = {
			"items": items,
			"start_time":start_time,
			"max_time":max_time
		};
		console.log(jsondata);
		d3.select("body").append("p").text(JSON.stringify(jsondata));

	});
};

window.setTimeout(parsedata, 1000);