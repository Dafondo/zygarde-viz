'use strict';

function energyChart() {
  var svgWidth = 700, svgHeight = 300,
      margin = { top: 20, bottom: 50, left: 50, right: 50},
      dimension = { chartTitle: 20, xAxis: 20, yAxis: 20, xTitle: 20, yTitle: 20 },
      chartTitle, yTitle, xTitle,
      border = false,
      drawXAxis = true, drawYAxis = true, drawNavChart = true,
      hasThreshold = false,
      fill = false,
      selection,
      data,
      computeActivation;
      
  // create the chart
  var chart = function(s) {
    selection = s;
    if (selection == undefined) {
      console.error("selection is undefined");
      return;
    };

    // process titles
    chartTitle = chartTitle || "";
    xTitle = xTitle || "";
    yTitle = yTitle || "";

    // compute component dimensions
    var chartTitleDim = chartTitle == "" ? 0 : dimension.chartTitle;
    var xTitleDim = xTitle == "" ? 0 : dimension.xTitle;
    var yTitleDim = yTitle == "" ? 0 : dimension.yTitle;
    var xAxisDim = !drawXAxis ? 0 : dimension.xAxis;
    var yAxisDim = !drawYAxis ? 0 : dimension.yAxis;

    // compute chart dimension and offset
    var marginTop = margin.top + chartTitleDim;
    var height = svgHeight - marginTop - margin.bottom - chartTitleDim - xTitleDim - xAxisDim + 30;
    var width = svgWidth - margin.left - margin.right;

    let lineCoords = {
      "x1": 0,
      "y1": height/2,
      "x2": width,
      "y2": height/2,
    }

    let svg = selection
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + marginTop + ")");
    
    let main = svg.append("g")
      .attr("transform", "translate (" + margin.left + "," + marginTop + ")");
    
    main.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .style("fill", "#f5f5f5");

    // in main group, add chart title
    main.append("text")
      .attr("class", "chartTitle")
      .attr("x", width / 2)
      .attr("y", -margin.top) // TODO standardize this spacing
      .attr("dy", ".71em")
      .attr("text-anchor", "middle")
      .text(function(d) { 
        var text = chartTitle == undefined ? "" : chartTitle;
        return text; 
      });

    let x = d3.scaleLinear()
    .domain(d3.extent(data, (d) => {
      return d.x;
    }))
    .range([0, width]);

    let y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => {
        return d.y;
      })])
      .range([height, 0]);

    let xAxisG = main.append("g")
      .attr("transform", "translate (0," + height + ")")
      .call(d3.axisBottom(x));

    let yAxisG = main.append("g")
      .call(d3.axisLeft(y));

    // in x axis group, add x axis title
    main.append("text")
      .attr("id", "x-title")
      .attr("class", "title")
      .attr("x", width / 2)
      .attr("y", height + xTitleDim) // TODO standardize this spacing
      .attr("dy", ".71em")
      .attr("text-anchor", "middle")
      .text(function(d) { 
        var text = xTitle == undefined ? "" : xTitle;
        return text; 
      });

    // in y axis group, add y axis title
    main.append("text")
      .attr("id", "y-title")
      .attr("class", "title")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left ) // TODO standardize this spacing
      .attr("dy", ".71em")
      .attr("text-anchor", "middle")
      .text(function(d) { 
        var text = yTitle == undefined ? "" : yTitle;
        return text; 
      });

    // Sort data
    data = data.sort((a, b) => {
      return d3.ascending(a.x, b.x);
    });

    // Add data line
    main.append("path")
      .datum(data)
      .attr("class", "data-line")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { 
          return x(d.x) 
        })
        .y(function(d) { 
          return y(d.y) 
        })
      )

    // Add area fill under line
    if (fill) {
      main.append("path")
        .datum(data)
        .attr("class", "data-area")
        .attr("fill", "lightsteelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.area()
          .x(function(d) { 
            return x(d.x) 
          })
          .y0(height)
          .y1(function(d) { 
            return y(d.y) 
          })
        )
    }

    if (hasThreshold) {
      // For the next three functions we use the function keyword 
      // because "this" gets remapped when using arrow functions
      function dragStart(event, d) {
        d3.select(this)
          .classed('active', true)
          .attr("stroke-width", 8);
      }

      function dragged(event, d) {
        let newY = event.y;
        newY = Math.min(height, Math.max(0, newY))
        d3.select(this)
          .attr("y1", newY)
          .attr("y2", newY);
        lineCoords.y1 = newY;
        lineCoords.y2 = newY;
      }

      function dragEnd(event, d) {
        d3.select(this)
          .classed('active', false)
          .attr("stroke-width", 5);
        
        computeActivation(y, lineCoords);
      }

      let drag = d3.drag()
        .on("start", dragStart)
        .on("drag", dragged)
        .on("end", dragEnd);

      let line = main.append("line")
        .attr("class", "threshold-line")
        .attr("x1", lineCoords.x1)
        .attr("y1", lineCoords.y1)
        .attr("x2", lineCoords.x2)
        .attr("y2", lineCoords.y2)
        .attr("stroke-width", 5)
        .attr("stroke", "red");

      line.call(drag);

      computeActivation(y, lineCoords);
    }

    return chart;
  }

  chart.data = function(_) {
    if (arguments.length == 0) return data;
    data = _;
    return chart;
  }

  chart.hasThreshold = function(_) {
    if (arguments.length == 0) return hasThreshold;
    hasThreshold = _;
    return chart;
  }

  chart.fill = function(_) {
    if (arguments.length == 0) return fill;
    fill = _;
    return chart;
  }

  chart.computeActivation = function(_) {
    if (arguments.length == 0) return computeActivation;
    computeActivation = _;
    return chart;
  }

  // svg width
  chart.width = function(_) {
    if (arguments.length == 0) return svgWidth;
    svgWidth = _;
    return chart;
  }

  // svg height
  chart.height = function(_) {
    if (arguments.length == 0) return svgHeight;
    svgHeight = _;
    return chart;
  }

  // svg border
  chart.border = function(_) {
    if (arguments.length == 0) return border;
    border = _;
    return chart;       
  }

  // chart title
  chart.title = function(_) {
    if (arguments.length == 0) return chartTitle;
    chartTitle = _;
    return chart;   
  }

  // x axis title
  chart.xTitle = function(_) {
    if (arguments.length == 0) return xTitle;
    xTitle = _;
    return chart;       
  }

  // y axis title
  chart.yTitle = function(_) {
    if (arguments.length == 0) return yTitle;
    yTitle = _;
    return chart;       
  }
  
  return chart;
}