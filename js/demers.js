      //global var that stores the rates
      var ratesNationalHomicides;
      var GNODE;
      var updateMap;
      var isMapLoaded = false;
      var mapLastStateColor;

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

      //var colHi = chroma.hex("rgb(72,27,24)"),
      var colHi = chroma.hex("#711a26"),
          colLow = chroma.hex("#eeeeee");
          
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

      var radius = d3.scale.sqrt() //values for the square sizes
          .domain([0, 110.71])
          .range([0, 58]);

      var force = d3.layout.force()
          .charge(0)
          .gravity(0)
          .size([width, height]);

      var svg = d3.select("#demers").append("svg")
          .attr("width", width)
          .attr("height", height);

      var ol = d3.select("#list-states").append("ol");

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
        .defer(d3.csv, "csv/D3-national-homicide-rates.csv")
        .await(ready);

      function ready(error, states, rates) {

        //the global vars are updated to have access to the data pulled by the json in d3's format
        GERROR = error;
        GSTATES = states;
        GRATES = rates;
        ratesNationalHomicides = rates;

        var estadosArray = [];
      
        var colorFn = chroma.scale([colLow, colHi]).domain([0,75]);

        var nodes = states
            .map(function(d) {

              var point = projection([d.geo_longitude,d.geo_latitude])
              	value = rateById(GYEAR, +d.id),
              	color = colorFn(value),
              	state = d.state,
                id = +d.id;

              if (isNaN(value)) throw { name: 'FatalError', message: 'Values for squares are not numbers' };
              return {
                x: point[0], y: point[1],
                x0: point[0], y0: point[1],
                r: radius(value),
                value: value,
                state: state,
                color: color,
                id: id
              };
            }); //closes .map

        force
            .nodes(nodes)
            .on("tick", tick)
            .start();

        var node = svg.selectAll("rect")
            .data(nodes);

        //the enter() section
        node
            .enter().append("rect")
            .attr("id", function(d) { return "idn-"+d.id; }) //add one id got from states (mx-state-centroids)
          	.attr("style", function(d) { return "fill:"+d.color+";"; })
            .attr("width", function(d) { return d.r * 2; })
            .attr("height", function(d) { return d.r * 2; })
            .append("title").text(function(d) { 
                //estadosArray.push({state:d.state,value:d.value});
                return d.state +" "+ d.value; });
        //for the update() section
        node
            .on('mouseover', function(d) { 
                d3.select("#idn-" + d.id).style("fill", "yellow");
                d3.select("#idlist-" + d.id).style("background-color", "yellow").style("font-weight", "bold");
            })
            .on('mouseleave', function(d) { 
                d3.select("#idlist-" + d.id).style("background-color", "#711a26").style("font-weight", "normal");
                d3.select("#idn-" + d.id).style("fill", d.color);
            })
            .attr("style", function(d) { return "fill:"+d.color+";"; })
            .transition().attr("width", function(d) { return d.r * 2; })
            .attr("height", function(d) { return d.r * 2; })
            .select("title").text(function(d) {
                estadosArray.push({state:d.state,value:d.value, id:d.id}); 
                return d.state +" "+ d.value; });
        
        GNODE = node; //make it available globally
        if (isMapLoaded){
            updateMap();
        }
            
        //order by state (descending)
        estadosArray.sort(function(a, b) { 
          return a.state < b.state ? -1 : a.state > b.state ? 1 : 0;
        });

        //enter list
        ol.selectAll("li")
            .data(estadosArray, function(d) { return d.id; })
            .enter()
          .append("li")
            .attr("id", function(d) { return "idlist-"+d.id; }) //add one id got from states (mx-state-centroids)
            .classed("li-background", true)
            .transition().style("width", function(d) { return d.value*2 +"px" } )
            .text(function(d) { return d.state+" "+d.value; });
        //update list
        ol.selectAll("li")
            .data(estadosArray, function(d) { return d.id; }) //adds a key function
            .transition().style("width", function(d) { return d.value*2 +"px" } )
            .text(function(d) { return d.state+" "+d.value; });

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
  map.loadMap('svg/MEX.svg', mapLoaded, opts);

  function getValueFromNode(name, valName){      
      var val;
      $.each(GNODE[0], function(index, nodo) {
          if (name == nodo.__data__.state) {
            val = nodo.__data__[valName];
            return false; //to break the .each
            }
        })
      return val;
  }

  function mapLoaded(map) {
      map.addLayer('admin1', {
          styles: {
              stroke: '#aaa',
              fill: function(d) { 
                return getValueFromNode(d.name, 'color');
                }
          },
          tooltips: function(d) {
              return [d.name, getValueFromNode(d.name, 'value') + ' homicides per 100,000 people'];
              },
          mouseenter: function(d, path) {
              mapLastStateColor = path.attrs.fill; //saves the last color;
              path.attr('fill', '#ff0');
              d3.select("#idn-" + getValueFromNode(d.name, 'id')).style("fill", "yellow");
              d3.select("#idlist-" + getValueFromNode(d.name, 'id')).style("background-color", "yellow").style("font-weight", "bold");
          }, 
          mouseleave: function(d, path) {
              path.attr('fill', mapLastStateColor); //restores the last color
              d3.select("#idn-" + getValueFromNode(d.name, 'id')).style("fill", mapLastStateColor);
              d3.select("#idlist-" + getValueFromNode(d.name, 'id')).style("background-color", "#711a26").style("font-weight", "normal");
          }
      });

      updateMap = function() {
          map.getLayer('admin1').style('fill', 
                function(d) { 
                return getValueFromNode(d.name, 'color');
                }
            ).tooltips(function(d) {
              return [d.name, getValueFromNode(d.name, 'value') + ' homicides per 100,000 people'];
              });
      }
      isMapLoaded = true;
    }

  

