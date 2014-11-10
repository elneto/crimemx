      //global var that stores the rates
      var GNODE, GERROR, GSTATES, GRATES,
          GHOMI, GKIDNAP, GEXTORTION, GCARVIO, GCARNOVIO;
      var ratesNationalHomicides;
      var updateMap, borderStateGeoMap, fontSize;
      var isMapLoaded = false
          isChartCreated = false;
      var chart,
          keysArray;
      var MAXRATE=0;

      //year must be between 1997 and 2014
      function rateById(year, id)
        {
          //ratesNationalHomicides[year][state]
          //year 1 = 1997
          ////state 0 = Total,  state 1 = Aguascalientes, state 2 = Baja California...
          if (year < 1997 || year > 2014)
              throw { name: 'FatalError', message: 'Year out of limits' }

          return ratesNationalHomicides[year-1996][id];
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

      //draws the appropriate scale values for this current CSV
      function scaleValues(max){
        $( "#ol-scale li:eq(0)" ).text(Math.round( max*10 )/10);
        $( "#ol-scale li:eq(1)" ).text(Math.round( max/7*6*10 )/10);
        $( "#ol-scale li:eq(2)" ).text(Math.round( max/7*5*10 )/10);
        $( "#ol-scale li:eq(3)" ).text(Math.round( max/7*4*10 )/10);
        $( "#ol-scale li:eq(4)" ).text(Math.round( max/7*3*10 )/10);
        $( "#ol-scale li:eq(5)" ).text(Math.round( max/7*2*10 )/10);
        $( "#ol-scale li:eq(6)" ).text(Math.round( max/7*1*10 )/10);
      }
      
      //the SVG main demers map    
      var margin = {top: 0, right: 0, bottom: 0, left: 0},
          width = 900 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom,
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
        ratesNationalHomicides = rates;
      
        if (MAXRATE==0) {//only calculates it once
          MAXRATE = maxValue(rates);
          scaleValues(MAXRATE);
        }

        var radius = d3.scale.sqrt() //values for the square sizes 
          .domain([0, MAXRATE]) 
          .range([10, 60]);

        var colorDomRange = d3.scale.sqrt() //values for the square sizes 
          .domain([0, MAXRATE]) 
          .range([0, 63]);

        function colorFn (value){
          if (value == -1)
            return chroma.hex("#eeeeee"); //no data

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

        var colorLabel = function (val){
            if (val>MAXRATE/2){ 
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
              	value = rateById(GYEAR, +d.id),
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
                  showTooltip(d.state, d.value, d3.select(this).datum().x, d3.select(this).datum().y); //d3.select(this)[0][0].width.animVal.value
                }
                else
                  showTooltip(d.state, "NA", d3.select(this).datum().x, d3.select(this).datum().y); 
            })
            .on('mouseover', function(d) { 
                this.setAttribute("style", "fill:"+d.color+"; stroke:#000000; z-index:999");
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
                  showTooltip(d.state, d.value, d3.select(this).datum().x, d3.select(this).datum().y); //d3.select(this)[0][0].width.animVal.value
                }
                else
                  showTooltip(d.state, "NA", d3.select(this).datum().x, d3.select(this).datum().y); 
            })
            .on('mouseover', function(d) { 
                d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
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
                  showTooltip(d.state, d.value, d3.select(this).datum().x, d3.select(this).datum().y); //d3.select(this)[0][0].width.animVal.value
                }
                else
                  showTooltip(d.state, "NA", d3.select(this).datum().x, d3.select(this).datum().y); 
            })
            .on('mouseover', function(d) { 
                d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
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
              .text(function(d){return (d.value != -1)? d.state:''});
    
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
            .text(function(d){return (d.value != -1)? d.state:''});

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

        keysArray.push({'state':'Total','value':rateById(GYEAR,0), 'color': '#FF0000'});

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
                  text: barFuente
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
                      text: barTasa,
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
                              currentNodo = getNode(this.category);
                              showTooltip(this.category, currentNodo.value, currentNodo.x, currentNodo.y);
                              borderStateGeoMap(this.category, '#000000');
                            }
                        },
                        mouseOut: function () {
                            if (String(this.category)!='Total'){
                              d3.select("#idn-" + String(this.category).replace(/ /g,'')).style("stroke", "#bbbbbb"); //restores the fill color
                              hideTooltip();
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
          var grav = 0.01;
          var coll = 0.01;
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

  function bgmapLoaded(bgmap) {
      bgmap.addLayer('admin1', {
          name: 'background',
          styles: {
              stroke: '#bbbbbb',
              fill: '#eeeeee'
          },
      });
    }

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
                showTooltip(d.name, currentNodo.value, currentNodo.x, currentNodo.y);
              }
              else{
                showTooltip(d.name, "NA", currentNodo.x, currentNodo.y);
              }
              
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
            text: function(d) { 
                  var val = getNode(d.state).value;
                  if (val==-1)
                    val = "NA"
                  return val},
            style: function(d){ return "font-size:"+getNode(d.state).value+"px;"},
            mouseenter: function(d, path) {
              borderStateGeoMap(d.state, '#000000');
              d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black");
              currentNodo = getNode(d.state);
              if (currentNodo.value!=-1){ //select list item just if it exists
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                chart.series[0].data[index].select();  
                showTooltip(d.state, currentNodo.value, currentNodo.x, currentNodo.y);
              }
              else{                
                showTooltip(d.state, "NA", currentNodo.x, currentNodo.y);
              }
              
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
      
      //d3.selectAll("#map.kartograph tspan")
        //.data(GNODE)
        //.style("font-size", function(d) { return fontSize(d.value) + "px"; });

      updateMap = function() {
          map.getLayer('admin1')
            .style('fill', function(d) { return getNode(d.name).color;});

          map.removeSymbols();
          //values
          map.addSymbols({
                type: kartograph.Label,
                data: centroids,
                location: function(d) { return [d.geo_longitude, d.geo_latitude] },
                text: function(d) { 
                  var val = getNode(d.state).value;
                  if (val==-1)
                    val = "NA"
                  return val},
                mouseenter: function(d, path) {
                  borderStateGeoMap(d.state, '#000000');
                  d3.select("#idn-" + String(d.state).replace(/ /g,'')).style("stroke", "black"); 
                  currentNodo = getNode(d.state);
                  if (currentNodo.value!=-1){ //select list item just if it exists
                    var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                    chart.series[0].data[index].select();  
                    showTooltip(d.state, currentNodo.value, currentNodo.x, currentNodo.y);
                  }
                  else{                    
                    showTooltip(d.state, "NA", currentNodo.x, currentNodo.y);
                  }
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
          
          //d3.selectAll("#map.kartograph tspan")
            //.data(GNODE)
            //.style("font-size", function(d) { return fontSize(d.value) + "px"; });
      }

      borderStateGeoMap = function (name, color){
          map.getLayer('admin1')
            .style('stroke', function(d) { if (name==d.name) return color; else return '#bbbbbb';});   
      }

      isMapLoaded = true;
    }//finish mapLoaded

    //Tooltip functions
    function showTooltip(state, number, x, y){
        d3.select("#stateTooltip h4").text(state);
        d3.select("#stpNumber").text(number);
        d3.select("#stateTooltip").style("top", y+"px").style("left",x+"px");
        d3.select("#stateTooltip").style("visibility", "visible");
    }

    function hideTooltip(){
        d3.select("#stateTooltip").style("visibility", "hidden");
    }

    function positive(num){
        return num <  0 ? 0 : num;
    }

    //saves the CSVs in globals
    d3.csv(LANGPATH+"csv/d3-kidnap.csv", function(states){
          GKIDNAP = states;
        });
    d3.csv(LANGPATH+"csv/d3-extortion.csv", function(states){
          GEXTORTION = states;
        });
    d3.csv(LANGPATH+"csv/d3-car-violence.csv", function(states){
          GCARVIO = states;
        });
    d3.csv(LANGPATH+"csv/d3-car-no-violence.csv", function(states){
          GCARNOVIO = states;
        });
    d3.csv(LANGPATH+"csv/d3-homicide.csv", function(states){
          GHOMI = states;
        });

    var ABBREV = {'Aguascalientes':'AGU','Baja California':'BCN','Baja California Sur':'BCS','Campeche':'CAM',
'Chiapas':'CHP','Chihuahua':'CHH','Coahuila':'COA','Colima':'COL','Distrito Federal':'DIF',
'Durango':'DUR','Guanajuato':'GUA','Guerrero':'GRO','Hidalgo':'HID','Jalisco':'JAL','Mexico':'MEX',
'Michoacan':'MIC','Morelos':'MOR','Nayarit':'NAY','Nuevo Leon':'NLE','Oaxaca':'OAX','Puebla':'PUE',
'Queretaro':'QUE','Quintana Roo':'ROO','San Luis Potosi':'SLP','Sinaloa':'SIN','Sonora':'SON',
'Tabasco':'TAB','Tamaulipas':'TAM','Tlaxcala':'TLA','Veracruz':'VER','Yucatan':'YUC','Zacatecas':'ZAC'};
  

