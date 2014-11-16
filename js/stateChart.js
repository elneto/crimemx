
function drawChart(stateInChart){  
  d3.json('../python/'+stateInChart+'.json', function(data) {
    nv.addGraph(function() {
      var chart = nv.models.stackedAreaChart()
                    //.margin({right: 50})
                    .x(function(d) { return d[0] })   //We can modify the data accessor functions...
                    .y(function(d) { return d[1] })   //...in case your data is formatted differently.
                    .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                    //.rightAlignYAxis(true)      //Let's move the y-axis to the right side.
                    .transitionDuration(500)
                    .showControls(false)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                    //.showLegend(false)
                    .clipEdge(true);

      //Format x-axis labels with custom function.
      chart.xAxis
          .tickFormat(function(d) { 
            return d3.time.format('%Y')(new Date(d)) 
            //return d3.time.format('%x')(new Date(d)) 
      });

      chart.yAxis
          .tickFormat(d3.format(',.2f'));

      chart.color(['#ff0000', '#ffa556', '#6bbc6b', '#984ea3', '#629fca']);
      //chart.style('stream');
      for (var i = 0; i <= 4; i++)
        data[i].disabled = true;

      data[0].disabled=false;

      d3.select('#state-chart')
        .datum(data)
        .call(chart);


      nv.utils.windowResize(chart.update);

      chartGLOBAL = chart;

      return chart;
    });
  })
}
