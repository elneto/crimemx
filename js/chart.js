var chartMargin = {top: 20, right: 20, bottom: 50, left: 70},
    chartWidth = 300 - chartMargin.left - chartMargin.right,
    chartHeight = 400 - chartMargin.top - chartMargin.bottom;

var x = d3.scale.linear()
    .range([0,chartWidth]);

var y = d3.scale.ordinal()
    .rangeRoundBands([0, chartHeight], .1); //.1 is a padding

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(4);

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(12);

var chartSVG = d3.select("#chart").append("svg")
    .attr("width", chartWidth + chartMargin.left + chartMargin.right)
    .attr("height", chartHeight + chartMargin.top + chartMargin.bottom)
  .append("g")
    .attr("transform", "translate(" + chartMargin.left + "," + chartMargin.top + ")");

d3.tsv("national.tsv", type, function(error, data) {
  x.domain([0, d3.max(data, function(d) { return d.value; })]);
  y.domain(data.map(function(d) { return d.month; }));

  chartSVG.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(xAxis)
      .append("text")
      .attr("transform", "translate("+type(chartWidth/2)+",0)")
      .attr("dy", "3.5em")
      .style("text-anchor", "middle")
      .text("Homicides");

  chartSVG.append("g")
      .attr("class", "y axis")
      .call(yAxis)

  var bar = chartSVG.selectAll(".bar")
      .data(data)
    .enter().append("g");

    bar.append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("height", y.rangeBand())
      .attr("y", function(d) { return y(d.month); })
      .attr("width", function(d) { return x(d.value); });

    bar.append("text")
      .attr("x", function(d) { return x(d.value)-3;} )
      .attr("y", function(d) { return y(d.month); })
      .attr("dy", "1.1em")
      .attr("class", "bar_num")
      .style("text-anchor", "end")
      .text(function(d) { return d.value });
      

});

function type(d) {
  d.value = +d.value; // coerce to number
  return d;
}