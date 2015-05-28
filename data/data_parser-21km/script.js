

var items =[];

var jsondata;


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

// Unix-time старта забега (локальное)
var start_time =1431844200000;
// Самый медленный результат
var max_time = convertToSeconds('2:55:37');

// Парсим
var parsedata = function(){
	d3.csv("21km_results_170515.csv", function (d){
		console.log("LOG:",'start parsing');
		d.forEach(function(d,i){

			var result_time_string;
			var add_city_info="";
			// Ищем название страны по MOK-коду
			// d.country_name = mokcodes[d.country];

			d.pos = +d.pos;
			d.gender_pos = +d.gender_pos;

			result_time_string = d.netto;

			if (d.country_name === undefined) { d.country_name = d.country };

			// Для обработки бага с городом у иностранцев
			if (d.city === 'Москва' && d.country_name !== "Россия") { d.city = ""};

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
				d["15km_time"] = d.result_time;
			
			// Если добежал до финиша, то обрабатываем данные времени
			} else {
				// Конвертим 
				d.result_time = convertToSeconds(d.result_time);
				d.netto = convertToSeconds(d.netto);

				d["5km_time"] = convertToSeconds(d["5km_time"]);
				d["10km_time"] = convertToSeconds(d["10km_time"]);
				d["15km_time"] = convertToSeconds(d["15km_time"]);
				
				// Проверяем на опечатки
				// Если "нетто" больше "брутто" или не заполнено, то "нетто" = "брутто"
				if ( d.netto > d.result_time || +d.netto === 0) { 
					console.log("LOG:","time-problem with num", d.num, "21km");
					d.netto = d.result_time;
				};

				// Если время на 5км подозрительно, то "время на 5км" = "нетто/4"
				if ( d["5km_time"]/d.netto > 0.3 || d["5km_time"]/d.netto < 0.06) {
					console.log("LOG:","time-problem with num", d.num, "5km_time", d["5km_time"]/d.netto);
					d["5km_time"] = d.netto/4;
				};

				// Если время на 10км подозрительно, то "время на 10км" = "нетто/2"
				if ( d["10km_time"]/d.netto > 0.65 || d["10km_time"]/d.netto < 0.25) {
					console.log("LOG:","time-problem with num", d.num, "10km_time", d["10km_time"]/d.netto);
					d["10km_time"] = d.netto/2;
				};

				// Если время на 15км подозрительно, то "время на 15км" = "нетто/2"
				if ( d["15km_time"]/d.netto > 0.8 || d["15km_time"]/d.netto < 0.5) {
					console.log("LOG:","time-problem with num", d.num, "15km_time", d["15km_time"]/d.netto);
					d["15km_time"] = d.netto/1.4;
				};

			};

			// Переводим в нижний регистр города из одного слова, типа «ЛЮБЕРЦЫ»
			if (d.city.split(' ').length === 1 && d.city.split('-').length === 1) {
				d.city = d.city.charAt(0).toUpperCase() + d.city.substr(1).toLowerCase();

			};

			// Переводим в нижний регистр города из двух слов, типа «ПАВЛОВСКИЙ ПОСАД»
			if (d.city.split(' ').length === 2 && d.city.split('-').length === 1) {
				d.city = d.city.charAt(0).toUpperCase() + d.city.substr(1).toLowerCase();
				d.city = d.city.slice(0, d.city.indexOf(' ') + 1) + d.city.charAt(d.city.indexOf(' ') + 1).toUpperCase() + d.city.substr(d.city.indexOf(' ') + 2).toLowerCase();
			};

			// Переводим в нижний регистр города из двух слов, типа «ОРЕХОВО-ЗУЕВО»
			if (d.city.split('-').length === 2) {
				d.city = d.city.charAt(0).toUpperCase() + d.city.substr(1).toLowerCase();
				d.city = d.city.slice(0, d.city.indexOf('-') + 1) + d.city.charAt(d.city.indexOf('-') + 1).toUpperCase() + d.city.substr(d.city.indexOf('-') + 2).toLowerCase();
			};



			//Упаковываем данные по бегуну
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
						"distance": 15000,
						"time": start_time + d["15km_time"] * 1000
					},
					{
						"distance": 21240,
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
		// console.log(jsondata);
		d3.select("body").append("p").text(JSON.stringify(jsondata));

	});
};

window.setTimeout(parsedata, 1000);