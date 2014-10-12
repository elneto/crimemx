      //global var that stores the rates
      var ratesNationalHomicides;

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
      var colHi = chroma.hex("rgb(72,27,24)"),
          colLow = chroma.hex("#ebe6e5");
          

      

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
          .attr("transform", "translate(12," + 2 + ")") //separation from slider
          .call(xAxis)
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 0)
          .attr("dy", "1.8em")
          .style("text-anchor", "middle");

      queue()
        .defer(d3.json, "json/mx-state-centroids.json")
        .defer(d3.csv, "csv/D3-national-homicide-rates.csv")
        .await(ready);

      function ready(error, states, rates) {

        //the global vars are updated to have access to the data pulled by the json in d3's format
        GERROR = error;
        GSTATES = states;
        GRATES = rates;
        ratesNationalHomicides = rates;

        var rankingPerYear = [];
      
        var colorFn = chroma.scale([colLow, colHi]).domain([0,75]);

        var nodes = states
            .map(function(d) {

              var point = projection([d.geo_longitude,d.geo_latitude])
              	value = rateById(GYEAR, +d.id),
              	color = colorFn(value),
              	state = d.state;

              if (isNaN(value)) throw { name: 'FatalError', message: 'Values for squares are not numbers' };
              return {
                x: point[0], y: point[1],
                x0: point[0], y0: point[1],
                r: radius(value),
                value: value,
                state: state,
                color: color
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
          	.attr("style", function(d) { return "fill:"+d.color+";"; })
            .attr("width", function(d) { return d.r * 2; })
            .attr("height", function(d) { return d.r * 2; })
            .append("title").text(function(d) { 
                //rankingPerYear.push({state:d.state,value:d.value});
                return d.state +" "+ d.value; });
        //for the update() section
        node
            .attr("style", function(d) { return "fill:"+d.color+";"; })
            .transition().attr("width", function(d) { return d.r * 2; })
            .attr("height", function(d) { return d.r * 2; })
            .select("title").text(function(d) { 
                rankingPerYear.push({state:d.state,value:d.value});
                return d.state +" "+ d.value; });
              
        //order rankingPerYear
        rankingPerYear.sort(function(a, b) { 
          return b.value - a.value;
        })

        //enter list
        ol.selectAll("li")
            .data(rankingPerYear)
            .enter()
          .append("li")
            .classed("li-background", true)
            .style("width", function(d) { return d.value*2 +"px" } )
            .text(function(d) { return d.state+" "+d.value; });
        //update list
        ol.selectAll("li")
            .data(rankingPerYear)
            .style("width", function(d) { return d.value*2 +"px" } )
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

