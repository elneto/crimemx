
function drawChart(stateInChart, crimeIndex, espaniol){  
  d3.json('../python/'+stateInChart+'.json', function(data) {
    nv.addGraph(function() {
      //var chart = nv.models.stackedAreaChart()
      var chart = nv.models.lineChart()
                    .x(function(d) { return d[0] })   //We can modify the data accessor functions...
                    .y(function(d) { return d[1] })   //...in case your data is formatted differently.
                    .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                    .transitionDuration(500);

      //Format x-axis labels with custom function.
      chart.xAxis
          .tickFormat(function(d) { 
            return d3.time.format('%Y')(new Date(d)) 
      });

      chart.yAxis
          .tickFormat(d3.format(',.2f'));
                    //hom
      chart.color(['#984ea3', '#b15928', '#a6d854', '#f4cae4', '#33a02c']);
      //chart.style('stream');
      for (var i = 0; i <= 4; i++){
        data[i].disabled = true;

      if (espaniol)
        {
          data[0].key="homicidio";
          data[1].key="secuestro";
          data[2].key="extorsión";
          data[3].key="autos violencia";
          data[4].key="autos sin violencia";
        }
      }
        
      data[crimeIndex].disabled=false;

      d3.select('#state-chart')
        .datum(data)
        .call(chart);

      nv.utils.windowResize(chart.update);

      return chart;
    });
  })
}
