$( window ).load(function() {

    var crimeIndex = 0;
    var varImgFile = "images/homicide.png";
    var espaniol = false;
    var resInterval;
    var TP = false; //tooltipPinned

    var TRANSLATIONS = {
      "has a similar rate per 100,000":"tiene tasa similar por 100,000",
      "No world data available":"No hay datos de otros países",
      "NA":"ND",
      "Homicide Rate":"Tasa de Homicidios",
      "Kidnapping Rate":"Tasa de Secuestros",
      "Extortion Rate":"Tasa de Extorsión",
      "Violent Car Theft Rate":"Robo de Autos con Violencia",
      "Non Violent Car Theft Rate":"Robo de Autos sin Violencia"
    }

    function t(str){
      if (LANGUAGE=='en')
        return str;
      else
        return TRANSLATIONS[str];
    }

    function updateYear(){
        GYEAR = $("#slider").slider("value");
        $("#main-title").text(varTitle+" in "+$( "#slider" ).slider( "value" ));
        if (GYEAR==2014)
            $("#main-title").append("*");

        ready(GERROR, GSTATES, GRATES);
    }
   //slider         
    $( "#slider" ).slider({
      min: 1997,
      max: 2014,
      step: 1,
      value:GYEAR,
      slide: updateYear,
      change: updateYear
    });

    $("#botones-box .list-group-item").click(function(event){
        goToPoint(event.target.id,GYEAR); 
    });

    $("#close-button").click(
        function(){
          TP = false;
          hideTooltip();
        }
      );      

    function changeYear(){
      if (GYEAR >= 2014){
        clearInterval(resInterval); //stop! 
        $("#play-button").attr("src", "images/play.png");
        $("#play-link").text("play");
        togglePlay = !togglePlay;
        }
      $("#slider").slider("value", GYEAR+=1);
    }
    //resInterval = setInterval(changeYear, 600); //starts the animation

    playFn = function(){
        if (!togglePlay){ //if it's not playing already, play!
          
          resInterval = setInterval(changeYear, 600);  

          $("#play-button").attr("src", "images/pause.png");
          $("#play-link").animate().text("pause");
          if (GYEAR == 2014) //start from the beginning
            GYEAR=1996;
          
        }
        else { //it is playing, let's pause
          clearInterval(resInterval); //stop! 
          $("#play-button").attr("src", "images/play.png");
          $("#play-link").text("play");
        }
        togglePlay = !togglePlay;
    }

    $("#play-button").click(playFn);

    goToPoint = function(crime, year){
      MAXRATE=0;
      GYEAR = year;
      $("#slider").slider("value", GYEAR);
      switch(crime){
        case ("btnHomicide"):
          varImgFile = "images/homicide.png";
          varTitle = t("Homicide Rate");
          crimeIndex = 0;
          MAXRATE=0;
          ready(GERROR, GSTATES, GHOMI);
          break;
        case ("btnKidnap"):
          varImgFile = "images/kidnap.png";
          varTitle = t("Kidnapping Rate");
          crimeIndex = 1;
          MAXRATE=0;
          ready(GERROR, GSTATES, GKIDNAP);
          break;
        case ("btnExtortion"):
          varImgFile = "images/extortion.png";
          varTitle = t("Extortion Rate");
          crimeIndex = 2;
          MAXRATE=0;
          ready(GERROR, GSTATES, GEXTORTION);
          break;
        case ("btnCarViolence"):
          varImgFile = "images/carvio.png";
          varTitle = t("Violent Car Theft Rate");
          crimeIndex = 3;
          MAXRATE=0;
          ready(GERROR, GSTATES, GCARVIO);
          break;
        case ("btnCarNoViolence"):
          varImgFile = "images/carnonvio.png";
          varTitle = t("Non Violent Car Theft Rate");
          crimeIndex = 4;
          MAXRATE=0;
          ready(GERROR, GSTATES, GCARNOVIO);
          break;
        }
      $('#botones-box > .list-group-item').removeClass("active");
      $('#'+crime).addClass("active");
      $("#top-image").attr("src", varImgFile);
      $("#main-title").text(varTitle+" in "+$( "#slider" ).slider( "value" ));
      if (GYEAR==2014)
          $("#main-title").append("*");
    }

  //global var that stores the rates
  var GNODE, GERROR, GSTATES, GRATES,
      GHOMI, GKIDNAP, GEXTORTION, GCARVIO, GCARNOVIO,
      WORLD_RATE,WORLD_CARNONVIO_RATE, WORLD_KIDNAP_RATE;
  var updateMap, borderStateGeoMap, fontSize;
  var isMapLoaded = false
      isChartCreated = false;
  var chart,
      keysArray;
  var MAXRATE=0;
  var stateInChart = "Aguascalientes";

  //saves the CSVs in globals
  d3.csv(LANGPATH+"csv/kidnap-rate.csv", function(d){
        GKIDNAP = d;
      });
  d3.csv(LANGPATH+"csv/extortion-rate.csv", function(d){
        GEXTORTION = d;
      });
  d3.csv(LANGPATH+"csv/car-violence-rate.csv", function(d){
        GCARVIO = d;
      });
  d3.csv(LANGPATH+"csv/car-no-violence-rate.csv", function(d){
        GCARNOVIO = d;
      });
  d3.csv(LANGPATH+"csv/homicide-rate.csv", function(d){
        GHOMI = d;
      });
  //totals
  d3.csv(LANGPATH+"csv/kidnap-total.csv", function(d){
        GKIDNAP_TOTAL = d;
      });
  d3.csv(LANGPATH+"csv/extortion-total.csv", function(d){
        GEXTORTION_TOTAL = d;
      });
  d3.csv(LANGPATH+"csv/car-violence-total.csv", function(d){
        GCARVIO_TOTAL = d;
      });
  d3.csv(LANGPATH+"csv/car-no-violence-total.csv", function(d){
        GCARNOVIO_TOTAL = d;
      });
  d3.csv(LANGPATH+"csv/homicide-total.csv", function(d){
        GHOMI_TOTAL = d;
      });
  d3.csv(LANGPATH+"csv/world-murder-rates.csv", function(d){
        WORLD_RATE = d;
      });
  d3.csv(LANGPATH+"csv/world-kidnap-rates.csv", function(d){
        WORLD_KIDNAP_RATE = d;
      });
  d3.csv(LANGPATH+"csv/world-carnonvio-rates.csv", function(d){
        WORLD_CARNONVIO_RATE = d;
      });

  var shortenLbl = {'Aguascalientes':'Ags.','Baja California':'Baja Calif.','Baja California Sur':'Baja Calif. S.','Campeche':'Camp.',
                    'Chiapas':'Chia.','Chihuahua':'Chihuahua','Coahuila':'Coah.','Colima':'Col.','Distrito Federal':'DF',
                    'Durango':'Dur.','Guanajuato':'Gto.','Guerrero':'Guerrero','Hidalgo':'Hgo.','Jalisco':'Jal.','Mexico':'Mex.',
                    'Michoacan':'Mich.','Morelos':'Mor.','Nayarit':'Nay.','Nuevo Leon':'N. Leon','Oaxaca':'Oax.','Puebla':'Puebla',
                    'Queretaro':'Quer.','Quintana Roo':'Q. Roo','San Luis Potosi':'Sn Luis','Sinaloa':'Sinaloa','Sonora':'Sonora',
                    'Tabasco':'Tabasco','Tamaulipas':'Tamp.','Tlaxcala':'Tlax.','Veracruz':'Ver.','Yucatan':'Yuc.','Zacatecas':'Zac.'};

  //year must be between 1997 and 2014
  function rateById(year, id, arr)
    {
      //arr[year][state]
      //year 1 = 1997
      ////state 0 = Total,  state 1 = Aguascalientes, state 2 = Baja California...
      if (year < 1997 || year > 2014)
          throw { name: 'FatalError', message: 'Year out of limits' }

      return arr[year-1996][id];
    }

  //Calculates the maximum value per CSV of crime
  function maxValue(arr){
    var max = 0;
    for (var i=1; i <= 32; i++) { //ignores the total
      for (var j=1; j <= 18; j++) {
        if (+arr[j][i]>max){
          max = +arr[j][i];
        }
      }
    }
    return +max;
  }

  //the SVG main demers map    
  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = 900 - margin.left - margin.right,
      height = 650 - margin.top - margin.bottom,
      padding = 3;

  var projection = d3.geo.conicConformal()
            .rotate([102, 0])
            .center([0, 24])
            .parallels([17.5, 29.5])
            .scale(1600)
            .translate([width / 2, height / 2])
            ;

   var force = d3.layout.force()
      .charge(0)
      .gravity(0)
      .size([width, height]);

  var svg = d3.select("#demers").append("svg")
      .attr("width", width)
      .attr("height", height);

  var xSlider = d3.time.scale()
      .domain([new Date(1997, 0, 1), new Date(2014, 0, 1)])
      .range([0, 820]);

  var xAxis = d3.svg.axis()
      .scale(xSlider)
      .ticks(d3.time.years, 1);

  var sliderSVG = d3.select("#slider-label").insert("svg")
      .attr("width", "900px")
      .attr("height", "50px");

  sliderSVG.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(14," + 2 + ")") //separation from slider
      .call(xAxis)
    .selectAll("text")
      .attr("y", 0)
      .attr("x", 0)
      .attr("dy", "1.8em")
      .style("text-anchor", "middle");

  queue()
    .defer(d3.json, LANGPATH+"json/mx-state-centroids.json") //states
    .defer(d3.csv, DATAFILE)
    .await(ready);

  function ready(error, states, rates) {

    //the global vars are updated to have access to the data pulled by the json in d3's format
    GERROR = error;
    GSTATES = states;
    GRATES = rates;

    if (MAXRATE==0) {//only calculates it once
      MAXRATE = maxValue(rates);
      scaleValues(MAXRATE);
    }

    //returns appropriate color
    function colorFn(value){
        if (value == -1)
          return chroma.hex("#eeeeee"); //no data

        //maps color using a sqrt scale
      var colorDomRange = d3.scale.sqrt() //values for the square sizes 
        .domain([0, MAXRATE]) 
        .range([0, 63]);

        var v = colorDomRange(value);
        if ( v < 9)
          return chroma.hex("#4575b4"); //less crime
        else if (v >= 9 && v < 18)
          return chroma.hex("#91bfdb");
        else if (v >= 18 && v < 27)
          return chroma.hex("#e0f3f8");
        else if (v >= 27 && v < 36)
          return chroma.hex("#ffffbf");
        else if (v >= 36 && v < 45)
          return chroma.hex("#fee090");
        else if ( v >= 45 && v < 54)
          return chroma.hex("#fc8d59");
        else 
          return chroma.hex("#d73027"); //more crime
      }
    //brute force to get the correct steps :D
    function getStepValues(max){
      var counter, 
        currentcolor = colorFn(0),
        stepvalues=[],
        step;

      for (counter=0; counter <= max; counter+=0.1){  
        step = colorFn(counter);
        if (step.toString() != currentcolor.toString()){
          stepvalues.push(Math.round( counter * 10 ) / 10);
          currentcolor = step;
        }
      }
      return stepvalues;
    }

    //draws the appropriate scale values for this current CSV
    function scaleValues(max){

      var sv = getStepValues(max);
      
      $( "#ol-scale li:eq(0)" ).text(Math.round( max*10 )/10);
      $( "#ol-scale li:eq(1)" ).text(sv[5]);
      $( "#ol-scale li:eq(2)" ).text(sv[4]);
      $( "#ol-scale li:eq(3)" ).text(sv[3]);
      $( "#ol-scale li:eq(4)" ).text(sv[2]);
      $( "#ol-scale li:eq(5)" ).text(sv[1]);
      $( "#ol-scale li:eq(6)" ).text(sv[0]);
    }

    var radius = d3.scale.sqrt() //values for the square sizes 
      .domain([0, MAXRATE]) 
      .range([0, 64]);

    var colorLabel = function (val){
        if (val>=MAXRATE/7*3.7) { 
          return chroma.hex("#ffffff");
        }
        else
          return chroma.hex("#444444");
      }

    fontSize = d3.scale.linear() //values for the font sizes
      .domain([-1, MAXRATE]) 
      .range([9, 36]);

    var nodes = states
        .map(function(d) {

          var point = projection([d.geo_longitude,d.geo_latitude])
          	value = rateById(GYEAR, +d.id, rates),
          	color = colorFn(value),
            colorlbl = colorLabel(value),
          	state = d.state,
            id = +d.id;

          if (isNaN(value)) throw { name: 'FatalError', message: 'Values for squares are not numbers' };
          
          return {
            x: point[0], y: point[1],
            x0: point[0], y0: point[1],
            r: radius(value),
            value: Math.round( value * 10 ) / 10,
            state: state,
            color: color,
            colorlbl: colorlbl,
            id: id
          };
        }); //closes .map

    force
        .nodes(nodes)
        .on("tick", tick)
        .start().stop();
        //.start();

    //the enter() section
    var nodeData = svg.selectAll(".nodeG")
        .data(nodes);
    //squares enter
    nodeData
        .enter().append("g").attr('class', 'nodeG').append("rect")
        .on('mouseenter', function(d) {
            borderStateGeoMap(d.state, '#000000');
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select();
            }
            showTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y); 
        })
        .on('mouseover', function(d) { 
            this.setAttribute("style", "fill:"+d.color+"; stroke:#000000; z-index:999");
        })
        .on('click', function(d) {
            pinTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y);
        })
        .on('mouseleave', function(d) { 
            this.setAttribute("style", "fill:"+d.color+"; stroke:'#bbbbbb';");
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select(false);
            }
            hideTooltip();
            borderStateGeoMap(d.state, '#ffffff');
        })
        .attr('class', 'node')
        .attr("id", function(d) { return "idn-"+String(d.state).replace(/ /g,''); }) //add one id got from states (mx-state-centroids)
        .attr("style", function(d) { return "fill:"+d.color+";"; })
        //.attr("stroke", function(d) { return d.color; })
        .attr("width", function(d) { return positive(d.r * 2); })
        .attr("height", function(d) { return positive(d.r * 2); })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
    //rate  enter
    nodeData.enter()
        .append("text")
        .on('mouseenter', function(d) {
            borderStateGeoMap(d.state, '#000000');
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select();
            }
            showTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y); 
        })
        .on('mouseover', function(d) { 
            d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
        })
        .on('click', function(d) { 
            pinTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y);
        })
        .on('mouseleave', function(d) {
            d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "#bbbbbb"); 
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select(false);
            }
            hideTooltip();
            borderStateGeoMap(d.state, '#ffffff');
        })
        .attr("class", "lblValue")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("dy", "2.5em")
        .attr("dx", function(d) { return positive(d.r);}) //half the size of the square
        .attr("font-size", function(d) { return fontSize(d.value); })
        .attr("fill", function(d) { return d.colorlbl;})
        .attr("text-anchor", "middle")
        .text(function(d){return (d.value != -1)? d.value:''});
    //state name label enter
    nodeData.enter()
          .append("text")
          .on('mouseenter', function(d) {
            borderStateGeoMap(d.state, '#000000');
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select();
            }
            showTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y); 
        })
        .on('mouseover', function(d) { 
            d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
        })
        .on('click', function(d) {     
            pinTooltip(d.state, na(d.value), d3.select(this).datum().x, d3.select(this).datum().y);
        })
        .on('mouseleave', function(d) { 
            d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "#bbbbbb"); 
            if (d.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
              chart.series[0].data[index].select(false);
            }
            hideTooltip();
            borderStateGeoMap(d.state, '#ffffff');
        })
          .attr("class", "lblEstado")
          .attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; })
          .attr("dx", function(d) { return positive(d.r);}) //half the size of the square
          .attr("dy", "1.4em")
          //.attr("font-size", function(d) { return fontSize(d.value)/1.2; })
          .attr("fill", function(d) { return d.colorlbl;})
          .attr("text-anchor", "middle")
          .text(function(d){return (d.value != -1)? shortenLbl[d.state]:''});

    //deletes the tooltip in case it is still there.
    hideTooltip();

     //for the update() section
    var node = svg.selectAll(".node");
    //squares update
    node.data(nodes)
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("style", function(d) { return "fill:"+d.color+";"; })
        .transition().duration(500)
        .attr("width", function(d) { return positive(d.r * 2); }) 
        .attr("height", function(d) { return positive(d.r * 2); });
    //rate value update
    var label = svg.selectAll(".lblValue");
    label.data(nodes)
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("dx", function(d) { return positive(d.r);}) //half the size of the square
        .transition().duration(500)
        .attr("font-size", function(d) { return fontSize(d.value); })
        .attr("fill", function(d) { return d.colorlbl;})
        .text(function(d){return (d.value != -1)? d.value:''});
    //state name label update
    var nEstado = svg.selectAll(".lblEstado");
     nEstado.data(nodes)
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("dx", function(d) { return positive(d.r);}) //half the size of the square
        .transition().duration(500)
        //.attr("font-size", function(d) { return d.value/1.2; })
        .attr("fill", function(d) { return d.colorlbl;})
        //.text(function(d){return (d.value != -1)? d.state:''});

    //node.data(nodes);
    force
        .nodes(nodes)
        //.start().stop();
        .start();
        
    GNODE = nodes; //make it available globally
    if (isMapLoaded){
        updateMap(); 
    }
        
    var estadosArray = [],
        valuesArray = [];
    keysArray = [];

    $.each(GNODE, function(i, d) { //data gets an array with all the state info
        if (d.value != -1) //don't put in the list if no value
          keysArray.push({'state':d.state,'value':+d.value, 'color': d.color});
     });

    keysArray.push({'state':'Total','value':rateById(GYEAR,0,rates), 'color': '#FF0000'});

    //Todo, order the states according to the estadosArraysort
    keysArray.sort(function(b, a) { 
        return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
    });

    for (var i=0; i < keysArray.length; i++){
        estadosArray.push(keysArray[i].state);
        if (typeof keysArray[i].color != 'undefined')
          valuesArray.push({'y':+keysArray[i].value, 'color':keysArray[i].color.toString()});
        else
          console.log(keysArray[i])
    }

    //the highchart bar
    $(function () {

      var options = {
          chart: {
              renderTo: 'list-states',
              backgroundColor: '#eeeeee',
              type: 'bar'
          },
          title: {
              text: barTitulo +' ('+GYEAR+')'
          },
          subtitle: {
              text: barTasa
          },
          xAxis: {
              categories: estadosArray,
              title: {
                  text: null
              }
          },
          yAxis: {
              min: 0,
              title: {
                  text: barFuente,
                  align: 'high'
              },
              labels: {
                  overflow: 'justify'
              }
          },
          tooltip: {
              enabled: false
          },
          plotOptions: {
              bar: {
                  dataLabels: {
                      enabled: true
                  }
              }
          },
          legend: {
              layout: 'vertical',
              align: 'right',
              verticalAlign: 'top',
              x: -40,
              y: 100,
              floating: true,
              borderWidth: 1,
              backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
              shadow: true
          },
          credits: {
              enabled: false
          },
          exporting: {
              enabled: false
          },
          series: [{
            name:varTitle, 
            data: valuesArray,
            showInLegend: false,
            color: '#D4C2C5',
            animation: {
                duration: 300,
                easing: 'easeOutBounce'
            },
            point: {
                events: {
                    mouseOver: function () {
                        if (String(this.category)!='Total'){
                          d3.select("#idn-" + String(this.category).replace(/ /g,'')).style("stroke", "black");
                          //currentNodo = getNode(this.category);
                          //showTooltip(this.category, currentNodo.value, currentNodo.x, currentNodo.y);
                          borderStateGeoMap(this.category, '#000000');
                        }
                    },
                    mouseOut: function () {
                        if (String(this.category)!='Total'){
                          d3.select("#idn-" + String(this.category).replace(/ /g,'')).style("stroke", "#bbbbbb"); //restores the fill color
                          //hideTooltip();
                          borderStateGeoMap(this.category, '#ffffff');
                        }
                    }
                }
            },
          }]
      }; 

      if (!isChartCreated){
        chart = new Highcharts.Chart(options);  
        isChartCreated = true;
      }
      else{
        chart.setTitle({ text: barTitulo+' ('+GYEAR+')'});
        chart.series[0].setData(valuesArray,true);
        chart.xAxis[0].setCategories(estadosArray,true);
      }
  }); //ends the highchart bar

  //all below is for the force layout
    function tick(e) {
      var grav = 0.3;
      var coll = 0.5;
      node.each(gravity(grav))
          .each(collide(coll))
          .attr("x", function(d) { return d.x - d.r; })
          .attr("y", function(d) { return d.y - d.r; });
      label.each(gravity(grav))
          .each(collide(coll))
          .attr("x", function(d) { return d.x - d.r; })
          .attr("y", function(d) { return d.y - d.r; });
      nEstado.each(gravity(grav))
          .each(collide(coll))
          .attr("x", function(d) { return d.x - d.r; })
          .attr("y", function(d) { return d.y - d.r; }); 
    }

    function gravity(k) {
      return function(d) {
        d.x += (d.x0 - d.x) * k;
        d.y += (d.y0 - d.y) * k;
      };
    }

    function collide(k) {
      var q = d3.geom.quadtree(nodes);
      return function(node) {
        var nr = node.r + padding,
            nx1 = node.x - nr,
            nx2 = node.x + nr,
            ny1 = node.y - nr,
            ny2 = node.y + nr;
        q.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== node)) {
            var x = node.x - quad.point.x,
                y = node.y - quad.point.y,
                lx = Math.abs(x),
                ly = Math.abs(y),
                r = nr + quad.point.r;
            if (lx < r && ly < r) {
              if (lx > ly) {
                lx = (lx - r) * (x < 0 ? -k : k);
                node.x -= lx;
                quad.point.x += lx;
              } else {
                ly = (ly - r) * (y < 0 ? -k : k);
                node.y -= ly;
                quad.point.y += ly;
              }
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    } //end function collide

    //update the state tooltip
    //if (TP)
      updateTooltip();

  }; //end ready (d3.json)

  //add geo map
  var centroids = [{"id":"01","state":"Aguascalientes","geo_longitude":-102.2950405,"geo_latitude":21.8823971},
{"id":"02","state":"Baja California","geo_longitude":-115.1425107,"geo_latitude":30.0338923},
{"id":"03","state":"Baja California Sur","geo_longitude":-111.5706164,"geo_latitude":25.5818014},
{"id":"04","state":"Campeche","geo_longitude":-90.5,"geo_latitude":19},
{"id":"05","state":"Coahuila","geo_longitude":-102.3075153,"geo_latitude":27.2113466},
{"id":"06","state":"Colima","geo_longitude":-104,"geo_latitude":19.166667},
{"id":"07","state":"Chiapas","geo_longitude":-92.5000001,"geo_latitude":16.5000001},
{"id":"08","state":"Chihuahua","geo_longitude":-106.0000001,"geo_latitude":28.5000001},
{"id":"09","state":"Distrito Federal","geo_longitude":-99.166667,"geo_latitude":19.45},
{"id":"10","state":"Durango","geo_longitude":-104.833333,"geo_latitude":24.33333},
{"id":"11","state":"Guanajuato","geo_longitude":-101.5,"geo_latitude":21},
{"id":"12","state":"Guerrero","geo_longitude":-100,"geo_latitude":17.666667},
{"id":"13","state":"Hidalgo","geo_longitude":-99.2,"geo_latitude":20.5},
{"id":"14","state":"Jalisco","geo_longitude":-103.6666671,"geo_latitude":20.3333331},
{"id":"15","state":"Mexico","geo_longitude":-100.4045803,"geo_latitude":19.9253628},
{"id":"16","state":"Michoacan","geo_longitude":-101.878113,"geo_latitude":19.707098},
{"id":"17","state":"Morelos","geo_longitude":-99,"geo_latitude":18.65},
{"id":"18","state":"Nayarit","geo_longitude":-105.0000001,"geo_latitude":22.3500001},
{"id":"19","state":"Nuevo Leon","geo_longitude":-99.8873,"geo_latitude":26.2384363},
{"id":"20","state":"Oaxaca","geo_longitude":-96.5,"geo_latitude":17},
{"id":"21","state":"Puebla","geo_longitude":-97.6,"geo_latitude":18.433333},
{"id":"22","state":"Queretaro","geo_longitude":-99.54756,"geo_latitude":21.4242575},
{"id":"23","state":"Quintana Roo","geo_longitude":-88.5000001,"geo_latitude":19.6666671},
{"id":"24","state":"San Luis Potosi","geo_longitude":-100.5000001,"geo_latitude":22.8000001},
{"id":"25","state":"Sinaloa","geo_longitude":-107.5000001,"geo_latitude":25.0000001},
{"id":"26","state":"Sonora","geo_longitude":-110.6666671,"geo_latitude":29.3333331},
{"id":"27","state":"Tabasco","geo_longitude":-92.6666671,"geo_latitude":18.3000001},
{"id":"28","state":"Tamaulipas","geo_longitude":-98.7500001,"geo_latitude":24.0000001},
{"id":"29","state":"Tlaxcala","geo_longitude":-97.93671533,"geo_latitude":19.9180485},
{"id":"30","state":"Veracruz","geo_longitude":-96.066667,"geo_latitude":20.033333},
{"id":"31","state":"Yucatan","geo_longitude":-89.09984681,"geo_latitude":20.8878917},
{"id":"32","state":"Zacatecas","geo_longitude":-103.0000001,"geo_latitude":23.3000001}];
  // initialize qtip tooltip class
  $.fn.qtip.defaults.style.classes = 'ui-tooltip-bootstrap';
  $.fn.qtip.defaults.style.def = false;

  var opts = { padding: 0 };
  var map = kartograph.map('#map');
  var bgmap = kartograph.map('#bgmap');
  map.loadMap(LANGPATH+'svg/MEX.svg', mapLoaded, opts);
  bgmap.loadMap(LANGPATH+'svg/MEX.svg', bgmapLoaded, opts);

  function getNode(name){      
    var nodo;
      $.each(GNODE, function(i,n) {
          if (name == n.state) {
            nodo = n;
            return false;
            }
        })
      return nodo;
  };
  //background gray map
  function bgmapLoaded(bgmap) {
      bgmap.addLayer('admin1', {
          name: 'background',
          styles: {
              stroke: '#bbbbbb',
              fill: '#eeeeee'
          },
      });
    }
  //geo map
  function mapLoaded(map) {
      var currentNodo;
      map.addLayer('admin1', {
          styles: {
              stroke: '#bbbbbb',
              fill: function(d) { return getNode(d.name).color;}
          },
          mouseenter: function(d, path) {
              borderStateGeoMap(d.name, '#000000');
              d3.select("#idn-" + String(d.name).replace(/ /g,'')).style("stroke", "black");
              currentNodo = getNode(d.name);
              if (currentNodo.value!=-1){ //select list item just if it exists
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.name);
                chart.series[0].data[index].select();  
              }
              showTooltip(d.name, na(currentNodo.value), currentNodo.x, currentNodo.y);
            },
          click: function(d, path){
              currentNodo = getNode(d.name);              
              pinTooltip(d.name, na(currentNodo.value), currentNodo.x, currentNodo.y);
          },
          mouseleave: function(d, path) {
            borderStateGeoMap(d.name, '#bbbbbb');
            d3.select("#idn-" + String(d.name).replace(/ /g,'')).style("stroke", "#bbbbbb"); //restores the square border color 
            if (currentNodo.value!=-1){ //select list item just if it exists
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.name);
              chart.series[0].data[index].select(false);
            }
            hideTooltip();
          }
      });
      //values
      map.addSymbols({
            type: kartograph.Label,
            data: centroids,
            location: function(d) { return [d.geo_longitude, d.geo_latitude] },
            text: function(d) { return getNode(d.state).value==-1? t("NA"):"";}, //only prints NA if -1
            mouseenter: function(d, path) {
              borderStateGeoMap(d.state, '#000000');
              d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
              currentNodo = getNode(d.state);
              if (currentNodo.value!=-1){ //select list item just if it exists
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                chart.series[0].data[index].select();  
              }
              showTooltip(d.state, na(currentNodo.value), currentNodo.x, currentNodo.y);                        
            }, 
            click: function(d, path){
              pinTooltip(d.state, na(getNode(d.state).value), currentNodo.x, currentNodo.y); 
            },
            mouseleave: function(d, path) {
              borderStateGeoMap(d.state, '#bbbbbb');
              d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "#bbbbbb"); //restores the square border color 
              if (currentNodo.value!=-1){ //select list item just if it exists
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                chart.series[0].data[index].select(false);
              }
              hideTooltip();
            }
        });

      updateMap = function() {
          map.getLayer('admin1')
            .style('fill', function(d) { return getNode(d.name).color;});

          map.removeSymbols();
          //values update
          map.addSymbols({
                type: kartograph.Label,
                data: centroids,
                location: function(d) { return [d.geo_longitude, d.geo_latitude] },
                text: function(d) { return getNode(d.state).value==-1?t("NA"):"";}, //only prints NA
                mouseenter: function(d, path) {
                  borderStateGeoMap(d.state, '#000000');
                  d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black"); 
                  currentNodo = getNode(d.state);
                  if (currentNodo.value!=-1){ //select list item just if it exists
                    var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                    chart.series[0].data[index].select();  
                  }                 
                  showTooltip(d.state, na(currentNodo.value), currentNodo.x, currentNodo.y);
                }, 
                click: function(d, path){
                  pinTooltip(d.state, na(getNode(d.state).value), currentNodo.x, currentNodo.y);
                },
                mouseleave: function(d, path) {
                  borderStateGeoMap(d.state, '#bbbbbb');
                  d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "#bbbbbb"); //restores the square border color 
                  if (currentNodo.value!=-1){ //select list item just if it exists
                    var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                    chart.series[0].data[index].select(false);
                  }
                  hideTooltip();
                }
            });
          
      }

      borderStateGeoMap = function (name, color){
          map.getLayer('admin1')
            .style('stroke', function(d) { if (name==d.name) return color; else return '#bbbbbb';});   
      }

      isMapLoaded = true;
    }//finish mapLoaded

  //finds closest world rate crime
  function getClosest(val, arr){
    if (val==-1)
      return t("NA");

      var tmpmin = 99999999, //big enough so it will be eliminated at the first round
          len = arr.length,
          pais,
          diff;
      for (var i = 0; i < len; i++) {
          diff = val - arr[i].rate; //compares received val with array
          if (diff < tmpmin){
              tmpmin = diff;
              if (tmpmin<=0){
                if (LANGUAGE == 'en')
                  {
                    return arr[i].country;  
                  }
                else
                  {
                    return arr[i].pais;   
                  }
              }       
          }
      }
      if (LANGUAGE == 'en')
        return "No Country";
      else
        return "Ningún país";
  }

  //Tooltip functions
  function updateTotals(state,rate){
    var arr, 
        world_arr = [];

    var figure = "monitos";
    
    switch(crimeIndex){
      case(0): //homicides
        arr = GHOMI_TOTAL;
        world_arr = WORLD_RATE;
        figure = "monitos";
        break;
      case(1): //kidnap
        arr = GKIDNAP_TOTAL;
        world_arr = WORLD_KIDNAP_RATE;
        figure = "monitos";
        break;
      case(2): //extortion
        arr = GEXTORTION_TOTAL;
        break;
      case(3): //car with violence
        arr = GCARVIO_TOTAL;
        figure = "carritos";
        break;
      case(4): //car without violence
        arr = GCARNOVIO_TOTAL;
        world_arr = WORLD_CARNONVIO_RATE;
        figure = "carritos";
        break;
    }
    
    var total = rateById(GYEAR, +getNode(state).id, arr);
    d3.select("#stpTotalNumber").text(na(total));

    if (total == -1 || total == "NA"){
        d3.select("#stpWeekNumber").text(t("NA"));
        putMonitos(0);
    } else {
        var weekly = Math.round(total/52);
        d3.select("#stpWeekNumber").text(na(weekly));
        if (figure == "monitos")
          putMonitos(weekly);
        else
          putCars(weekly);
      }

    if (world_arr.length>1){
        d3.select("#stpCountry").text(getClosest(rate,world_arr));
        d3.select("#stpCountryText").text(t("has a similar rate per 100,000"));
      }
    else{
        d3.select("#stpCountry").text("-");
        d3.select("#stpCountryText").text(t("No world data available"));
      }
  }

  function showTooltip(state, number, x, y){

    if (TP) //if another is pinned
      return;
    //displaces the tooltip
    x += 40;
    y -= 200;

    stateInChart = state;
    drawChart(stateInChart, crimeIndex, espaniol);
    d3.select("#stpNumber").text(number);
    d3.select("#stateTooltip h4").text(state + " " + GYEAR.toString());

    d3.select("#stateTooltip")
      .style("visibility", "visible")
      .style("top", y+"px")
      .style("left",x+"px")
      .transition().duration(500).style("opacity", 0.9);

    d3.select("#stpInstructions").style("visibility", "visible");
    updateTotals(state,number);  
  }

  function pinTooltip(state, number, x, y){
    TP = false;
    showTooltip(state, number, x, y);
    d3.select("#stpInstructions").style("visibility", "hidden");
    d3.select("#stateTooltip").transition().duration(500).style("opacity", 1);
    TP = true;
  }

  function updateTooltip(){
    nodo = getNode(stateInChart);
    d3.select("#stateTooltip h4").text(stateInChart + " " + GYEAR.toString());
    d3.select("#stpNumber").transition().text(na(nodo.value));
    drawChart(stateInChart, crimeIndex, espaniol);
    updateTotals(stateInChart,nodo.value);
  }

  function hideTooltip(){
    //d3.select("#stateTooltip").transition().duration(500).style("opacity", 0).transition().duration(1000).style("visibility", "hidden");
    if (!TP)
      {
        d3.select("#stpInstructions").style("visibility", "hidden");

        d3.select("#stateTooltip")
          .style("opacity", 0.9)
          .style("visibility", "hidden");
        TP = false;
      }
  }

  function positive(num){
      return num <  0 ? 0 : num;
  }

  function na(num){
      return num <  0 ? t("NA") : num;
  }

  function putMonitos(num){
      var i=0;
      $( "#monitos" ).empty();
      while(i++ < num){
        $("#monitos").append('<img src="'+LANGPATH+'svg/human.svg" class="human">');
      }
  }

  function putCars(num){
      var i=0;
      $( "#monitos" ).empty();
      while(i++ < num){
        $("#monitos").append('<img src="'+LANGPATH+'svg/car.png" class="carrito">');
      }
  }
});