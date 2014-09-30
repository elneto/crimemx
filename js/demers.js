      // Ratio of Homicides SNSP 2014
      var valueById = [
        NaN,1.97, 14.19, 3.91,  4.14,  8.61,  10.41, 5.46,  20.36, 5.26,  11.96, 7.9, 29.01, 3.48,  7.36,  7.97,  15.27, 15.81, 7.08,  6.66,  10.34, 3.16,  3.09,  7.19,  5.79,  23.22, 13.66, 4.66,  13.25, 3.89,  4.37,  1.24,  3.97
      ];

      /*
      // Ratio of Homicides SNSP 2013
      var valueById13 = [
        NaN,3.11,22.92, 7.80,  7.61,  10.55, 39.69, 22.32, 25.49, 8.42,  27.54, 11.21, 59.22, 4.42,  14.19, 11.81, 19.91, 31.85, 12.81, 14.55, 13.54, 7.05,  5.71,  14.41, 9.66,  41.20, 20.17, 6.00,  16.03, 5.63,  10.89, 1.94,  10.77
      ];*/

      var quantize = d3.scale.quantize()
    	.domain([0, d3.max(valueById)])
    	.range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

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

      var radius = d3.scale.sqrt()
          .domain([0, d3.max(valueById)])
          .range([0, 54]);

      var force = d3.layout.force()
          .charge(0)
          .gravity(0)
          .size([width, height]);

      var svg = d3.select("#demers").append("svg")
          .attr("width", width)
          .attr("height", height);

      d3.json("mx-state-centroids.json", function(error, states) {
        var nodes = states
            .filter(function(d) { return !isNaN(valueById[+d.id]); })
            .map(function(d) {
              var point = projection([d.geo_longitude,d.geo_latitude])
              	value = valueById[+d.id],
              	q = quantize(valueById[+d.id]),
              	state = d.state;
              
              if (isNaN(value)) fail();
              return {
                x: point[0], y: point[1],
                x0: point[0], y0: point[1],
                r: radius(value),
                value: value,
                state: state,
                q: q
              };
            });

        force
            .nodes(nodes)
            .on("tick", tick)
            .start();

        var node = svg.selectAll("rect")
            .data(nodes)
          .enter().append("rect")
          	.attr("class", function(d) { return d.q; })
            .attr("width", function(d) { return d.r * 2; })
            .attr("height", function(d) { return d.r * 2; })
            ;

        node.append("title").text(function(d) { return d.state +" "+ d.value; });

        function tick(e) {
          node.each(gravity(e.alpha * .1))
              .each(collide(.5))
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
        }
      });