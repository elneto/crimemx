      //global var that stores the rates
      var GNODE, GERROR, GSTATES, GRATES,
          GHOMI, GKIDNAP, GEXTORTION, GCARVIO, GCARNOVIO;
      var ratesNationalHomicides;
      var updateMap, borderStateGeoMap;
      var isMapLoaded = false
          isChartCreated = false;
      var MAXRATE=0;
      var chart,
          keysArray;

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

       //for the colors 
      var colHi = chroma.hex(varColor), //homicides red
          colLow = chroma.hex("#eeeeee");
      
      //the SVG main demers map    
      var margin = {top: 0, right: 0, bottom: 0, left: 0},
          width = 960 - margin.left - margin.right,
          height = 700 - margin.top - margin.bottom,
          padding = 3;

      var projection = d3.geo.conicConformal()
                .rotate([102, 0])
                .center([0, 24])
                .parallels([17.5, 29.5])
                .scale(1700)
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
        .defer(d3.json, "json/mx-state-centroids.json") //states
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
        }

        var radius = d3.scale.sqrt() //values for the square sizes 
          .domain([0, MAXRATE]) 
          .range([0, 58]);

        colHi = chroma.hex(varColor); //updates the color
        var colorFn = chroma.scale([colLow, colHi])
            .domain([0, MAXRATE]); 

        var colorLabel = function (val){
            if (val>MAXRATE/2){ 
              return chroma.hex("#ffffff");
            }
            else
              return chroma.hex("#333333");
          }

        var fontSize = d3.scale.linear() //values for the font sizes
          .domain([-1, MAXRATE]) 
          .range([7, 36]);

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
            .start();

        //the enter() section
        var grupos = svg.selectAll("g")
            .data(nodes)
            .enter().append("g");
            //.attr("x", function(d) { return d.x; })
            //.attr("y", function(d) { return d.y; });

        grupos.append("rect")
            .attr("id", function(d) { return "idn-"+String(d.state).replace(/ /g,''); }) //add one id got from states (mx-state-centroids)
          	.attr("style", function(d) { return "fill:"+d.color+"; stroke:"+d.color+";"; })
            .attr("stroke", function(d) { return d.color; })
            .attr("width", function(d) { return positive(d.r * 2); })
            .attr("height", function(d) { return positive(d.r * 2); })
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });

        var label = grupos.append("text")
            .attr("class", "lblValue")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("dy", "1.8em")
            .attr("dx", "1.6em")
            .attr("font-family", "Helvetica")
            .attr("font-weight", "bold")
            .attr("font-size", function(d) { return fontSize(d.value); })
            .attr("fill", function(d) { return d.colorlbl;})
            .attr("text-anchor", "middle")
            .text(function(d){return (d.value != -1)? d.value:''});

            grupos.append("text")
              .attr("class", "lblEstado")
              .attr("x", function(d) { return d.x; })
              .attr("y", function(d) { return d.y; })
              .attr("dy", "3.5em")
              .attr("dx", "0.8em")
              .attr("font-family", "Helvetica")
              .attr("font-weight", "bold")
              .attr("font-size", function(d) { return fontSize(d.value)/1.2; })
              .attr("fill", function(d) { return d.colorlbl;})
              .attr("text-anchor", "start")
              .text(function(d){return (d.value != -1)? ABBREV[d.state]:''});
            
        //deletes the tooltip in case it is still there.
        hideTooltip();

        //for the update() section
        var node  = svg.selectAll("g").data(nodes);

        svg.selectAll("g").select("rect")
            .on('mouseenter', function(d) {
                borderStateGeoMap(d.state, '#000000');
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                chart.series[0].data[index].select();
                showTooltip(d.state, d.value, d3.select(this).datum().x, d3.select(this).datum().y); //d3.select(this)[0][0].width.animVal.value
            })
            .on('mouseover', function(d) { 
                this.setAttribute("style", "fill:"+d.color+"; stroke:#000000; z-index:999");
                //d3.select("#idlist-" + d.id).style("background-color", barColorOver).style("font-weight", "bold");
            })
            .on('mouseleave', function(d) { 
                this.setAttribute("style", "fill:"+d.color+"; stroke:"+d.color);
                var index = keysArray.map(function(x) {return x.state; }).indexOf(d.state);
                chart.series[0].data[index].select(false);
                hideTooltip();
                borderStateGeoMap(d.state, '#ffffff');
            })
            .attr("style", function(d) { return "fill:"+d.color+"; stroke:"+d.color+";"; })
            .transition().attr("width", function(d) { return positive(d.r * 2); }) 
            .attr("height", function(d) { return positive(d.r * 2); })
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });

        svg.selectAll("g").select(".lblValue")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .transition().attr("font-size", function(d) { return fontSize(d.value); })
            .attr("fill", function(d) { return d.colorlbl;})
            .text(function(d){return (d.value != -1)? d.value:''});

         svg.selectAll("g").select(".lblEstado")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("font-size", function(d) { return fontSize(d.value)/1.2; })
            .attr("fill", function(d) { return d.colorlbl;})
            .text(function(d){return (d.value != -1)? ABBREV[d.state]:''});
            
        GNODE = nodes; //make it available globally
        if (isMapLoaded){
            updateMap(); 
        }
            
        var estadosArray = [],
            valuesArray = [];
        keysArray = [];

        $.each(svg.selectAll("rect").data(), function(i, d) { //data gets an array with all the state info
            keysArray.push({'state':d.state,'value':+d.value, 'color': d.color});
         });

        //Todo, order the states according to the estadosArraysort
        keysArray.sort(function(b, a) { 
            return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
        });

        for (var i=0; i < keysArray.length; i++){
            estadosArray.push(keysArray[i].state);
            valuesArray.push({'y':+keysArray[i].value, 'color':keysArray[i].color.toString()});
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
                  text: 'Rank by State ('+GYEAR+')'
              },
              subtitle: {
                  text: 'Source: SNSP'
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
                      text: varTitle+' (per 100,000)',
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
                            d3.select("#idn-" + String(this.category).replace(/ /g,'')).style("stroke", "black");
                            currentNodo = getNode(this.category);
                            showTooltip(this.category, currentNodo.value, currentNodo.x, currentNodo.y);
                            borderStateGeoMap(this.category, '#000000');
                        },
                        mouseOut: function () {
                            d3.select("#idn-" + String(this.category).replace(/ /g,'')).style("stroke", getNode(this.category).color); //restores the fill color
                            hideTooltip();
                            borderStateGeoMap(this.category, '#ffffff');
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
            chart.setTitle({ text: 'Rank by State ('+GYEAR+')'});
            chart.series[0].setData(valuesArray,true);
            chart.xAxis[0].setCategories(estadosArray,true);
          }
        //console.log(Highcharts.charts);
      });

        //all below is for the force layout
        function tick(e) {
          node.each(gravity(e.alpha * .1))
              .each(collide(.2))
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

  //add thumbnail map
  // initialize qtip tooltip class
  $.fn.qtip.defaults.style.classes = 'ui-tooltip-bootstrap';
  $.fn.qtip.defaults.style.def = false;

  var opts = { padding: 0 };
  var map = kartograph.map('#map');
  map.loadMap('svg/mexusa.svg', mapLoaded, opts);

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

  function mapLoaded(map) {
      var currentNodo;
      map.addLayer('mylayer', {
          styles: {
              stroke: '#ffffff',
              fill: function(d) { 
                if (getNode(d.name)===undefined) 
                  return '#eeeeee';
                return getNode(d.name).color;}
          },
          mouseenter: function(d, path) {
              path.attr('stroke', '#000000');
              d3.select("#idn-" + String(d.name).replace(/ /g,'')).style("stroke", "black");  
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.name);
              chart.series[0].data[index].select();
              currentNodo = getNode(d.name);
              showTooltip(d.name, currentNodo.value, currentNodo.x, currentNodo.y);
          }, 
          mouseleave: function(d, path) {
              path.attr('stroke', '#ffffff'); 
              d3.select("#idn-" + String(d.name).replace(/ /g,'')).style("stroke", getNode(d.name).color); //restores the last color
              var index = keysArray.map(function(x) {return x.state; }).indexOf(d.name);
              chart.series[0].data[index].select(false);
              hideTooltip();
          }
      });



      updateMap = function() {
          map.getLayer('mylayer')
            .style('fill', function(d) { return getNode(d.name).color;});
      }

      borderStateGeoMap = function (name, color){
          map.getLayer('mylayer')
            .style('stroke', function(d) { if (name==d.name) return color; else return 'white';});   
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
    d3.csv("csv/d3-kidnap.csv", function(states){
          GKIDNAP = states;
        });
    d3.csv("csv/d3-extortion.csv", function(states){
          GEXTORTION = states;
        });
    d3.csv("csv/d3-car-violence.csv", function(states){
          GCARVIO = states;
        });
    d3.csv("csv/d3-car-no-violence.csv", function(states){
          GCARNOVIO = states;
        });
    d3.csv("csv/d3-homicide.csv", function(states){
          GHOMI = states;
        });

    var ABBREV = {'Aguascalientes':'AGU','Baja California':'BCN','Baja California Sur':'BCS','Campeche':'CAM',
'Chiapas':'CHP','Chihuahua':'CHH','Coahuila':'COA','Colima':'COL','Distrito Federal':'DIF',
'Durango':'DUR','Guanajuato':'GUA','Guerrero':'GRO','Hidalgo':'HID','Jalisco':'JAL','Mexico':'MEX',
'Michoacan':'MIC','Morelos':'MOR','Nayarit':'NAY','Nuevo Leon':'NLE','Oaxaca':'OAX','Puebla':'PUE',
'Queretaro':'QUE','Quintana Roo':'ROO','San Luis Potosi':'SLP','Sinaloa':'SIN','Sonora':'SON',
'Tabasco':'TAB','Tamaulipas':'TAM','Tlaxcala':'TLA','Veracruz':'VER','Yucatan':'YUC','Zacatecas':'ZAC'};
  

