'use strict';

function realTimeChart() {

  var version = "0.1.0",
      datum, data,
      svgWidth = 700, svgHeight = 300,
      margin = { top: 20, bottom: 20, left: 50, right: 30, topNav: 10, bottomNav: 20 },
      dimension = { chartTitle: 20, xAxis: 20, yAxis: 20, xTitle: 20, yTitle: 20, navChart: 70 },
      categories = ["jobs", "power"],
      tasks = [
        {
          color: '#69a3f2',
          period: 5,
          deadline: 4,
          mandatoryTime: 1,
          optionalTime: 1,
          optionalCredit: 1,
        },
      ],
      duration = 10,
      powerOptions = {
        mode: 'periodic',
        onTime: 1,
        offTime: 1,
        startState: true,
      },
      scheduleOptions = {
        mode: 'edf',
        preemptive: false,
      },
      maxY = 100, minY = 0,
      chartTitle, yTitle, xTitle,
      drawXAxis = true, drawYAxis = true, drawNavChart = true,
      border,
      selection,
      powerId = 0,
      jobId = 0,
      releaseId = 0,
      deadlineId = 0;

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
    var navChartDim = !drawNavChart ? 0 : dimension.navChart;

    // compute chart dimension and offset
    var marginTop = margin.top + chartTitleDim;
    var height = svgHeight - marginTop - margin.bottom - chartTitleDim - xTitleDim - xAxisDim - navChartDim + 30;
    var heightNav = navChartDim - margin.topNav - margin.bottomNav;
    var marginTopNav = svgHeight - margin.bottom - heightNav - margin.topNav;
    var width = svgWidth - margin.left - margin.right;
    var widthNav = width;

    // append the svg
    var svg = selection.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .style("border", function(d) { 
          if (border) return "1px solid lightgray"; 
          else return null;
        });

    // create main group and translate
    var main = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTop + ")");

    // define clip-path
    main.append("defs").append("clipPath")
        .attr("id", "myClip")
      .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    // create chart background
    main.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "#f5f5f5");

    // note that two groups are created here, the latter assigned to jobsG;
    // the former will contain a clip path to constrain objects to the chart area; 
    // no equivalent clip path is created for the nav chart as the data itself
    // is clipped to the full time domain
    var jobsG = main.append("g")
        .attr("class", "jobsGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip)")
      .append("g");

    var powerG = main.append("g")
        .attr("class", "jobsGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip)")
      .append("g");

    var releasesG = main.append("g")
        .attr("class", "releasesGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip)")
      .append("g");

    var deadlinesG = main.append("g")
        .attr("class", "deadlinesGroup")
        .attr("transform", "translate(0, 0)")
        .attr("clip-path", "url(#myClip)")
      .append("g");

    // add group for x axis
    var xAxisG = main.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    // add group for y axis
    var yAxisG = main.append("g")
        .attr("class", "y axis");

    // in x axis group, add x axis title
    xAxisG.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("dy", ".71em")
        .text(function(d) { 
          var text = xTitle == undefined ? "" : xTitle;
          return text; 
        });

    // in y axis group, add y axis title
    yAxisG.append("text")
        .attr("class", "title")
        .attr("transform", "rotate(-90)")
        .attr("x", - height / 2)
        .attr("y", -35)
        .attr("dy", ".71em")
        .text(function(d) { 
          var text = yTitle == undefined ? "" : yTitle;
          return text; 
        });

    // in main group, add chart title
    main.append("text")
        .attr("class", "chartTitle")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("dy", ".71em")
        .attr("text-anchor", "middle")
        .text(function(d) { 
          var text = chartTitle == undefined ? "" : chartTitle;
          return text; 
        });

    // define main chart scales
    var x = d3.scaleLinear().domain([0, duration]).range([0, width]);
    // var y = d3.scaleLinear().domain([minY, maxY]).range([height, 0]);
    var y = d3.scaleBand().domain(categories).range([height, 0]);

    let xAxisTicks = x.ticks().filter(Number.isInteger);

    // define main chart axis
    var xAxis = d3.axisBottom(x)
                  .tickValues(xAxisTicks)
                  .tickFormat(d3.format("d"));
    var yAxis = d3.axisLeft(y);

    // add nav chart
    var nav = svg.append("g")
        .attr("transform", "translate (" + margin.left + "," + marginTopNav + ")");

    // add nav background
    nav.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", heightNav)
        .style("fill", "#F5F5F5")
        .style("shape-rendering", "crispEdges")
        .attr("transform", "translate(0, 0)");

    // add group to hold line and area paths
    var navG = nav.append("g")
        .attr("class", "nav");

    // add group to hold nav x axis
    var xAxisGNav = nav.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + heightNav + ")");

    // define nav scales
    var xNav = d3.scaleLinear().range([0, widthNav]);
    var yNav = d3.scaleLinear().domain([minY, maxY]).range([heightNav, 0]);

    // define nav axis
    var xAxisNav = d3.axisBottom(xNav);

    // define function that will draw the nav area chart
    var navArea = d3.area()
        .x(function (d) { return xNav(d.time); })
        .y1(function (d) { return yNav(d.value); })
        .y0(heightNav);

    // define function that will draw the nav line chart
    var navLine = d3.line()
        .x(function (d) { return xNav(d.time); })
        .y(function (d) { return yNav(d.value); });

    // first, the full time domain
    var endTime = duration;
    var startTime = 0;
    var interval = endTime - startTime;

    // then the viewport time domain (what's visible in the main chart 
    // and the viewport in the nav chart)
    var endTimeViewport = duration;
    var startTimeViewport = 0;
    var intervalViewport = endTimeViewport - startTimeViewport;
    var offsetViewport = startTimeViewport - startTime;

    // set the scale domains for main and nav charts
    x.domain([startTimeViewport, endTimeViewport]);
    xNav.domain([startTime, endTime]); 

    // update axis with modified scale
    xAxis.scale(x)(xAxisG);
    yAxis.scale(y)(yAxisG);
    xAxisNav.scale(xNav)(xAxisGNav);

    // create brush (moveable, changable rectangle that determines 
    // the time domain of main chart)
    var sel;
    var viewport = d3.brushX()
        .extent([ [0,0], [widthNav,heightNav] ])
        .on("brush end", function (event) {
          // get the current time extent of viewport
          var extent = event.selection || xNav.range();

          startTimeViewport = xNav.invert(extent[0]);
          endTimeViewport = xNav.invert(extent[1]);

          intervalViewport = endTimeViewport - startTimeViewport;
          offsetViewport = startTimeViewport - startTime;

          // handle invisible viewport
          if (intervalViewport === 0) {
            intervalViewport = duration * 1000;
            offsetViewport = 0;
          }

          extent = [startTimeViewport, endTimeViewport]

          // update the x domain of the main chart
          x.domain((extent === null) ? xNav.domain() : extent);

          // update ticks
          let xAxisTicks = x.ticks().filter(Number.isInteger);
          xAxis.tickValues(xAxisTicks);
          // update the x axis of the main chart
          xAxis.scale(x)(xAxisG);/**/          

          sel = event.selection || xNav.range();
          x.domain(sel.map(xNav.invert, xNav));

          // update display
          refresh();
        });

      window.viewport = viewport;

    // create group and assign to brush
    var viewportG = nav.append("g")
        .attr("class", "viewport")
        .call(viewport)
        .selectAll("rect")
        .attr("height", heightNav);

    let powerSchedule = null;
    // generating data
    if (powerOptions.mode === 'periodic') {
      powerSchedule = generatePowerSchedulePeriodic(duration, powerOptions.onTime, powerOptions.offTime, powerOptions.startState);
    } else if (powerOptions.mode === 'random') {
      powerSchedule = generatePowerScheduleRandom(duration, powerOptions.startState);
    } else {
      powerSchedule = generatePowerScheduleConstant(duration);
    }

    let schedule = null;
    if (scheduleOptions.mode === 'edf') {
      schedule = calculateScheduleEdf(tasks, duration, powerSchedule, scheduleOptions.preemptive);
    } else if (scheduleOptions.mode === 'optimal') {
      schedule = calculateScheduleOptimal(tasks, duration, powerSchedule);
    }

    let taskSchedule = schedule.tasks;
    let releases = schedule.releases;
    let deadlines = schedule.deadlines;

    let data = taskSchedule;

    
    // update display
    refresh();
    refresh();

    // function to refresh the viz upon changes of the time domain 
    // (which happens constantly), or after arrival of new data,
    // or at init
    function refresh() {
      // here we bind the new data to the main chart
      // note: no key function is used here; therefore the data binding is
      // by index, which effectivly means that available DOM elements
      // are associated with each item in the available data array, from 
      // first to last index; if the new data array contains fewer elements
      // than the existing DOM elements, the LAST DOM elements are removed;
      // basically, for each step, the data items "walks" leftward (each data 
      // item occupying the next DOM element to the left);
      // This data binding is very different from one that is done with a key 
      // function; in such a case, a data item stays "resident" in the DOM
      // element, and such DOM element (with data) would be moved left, until
      // the x position is to the left of the chart, where the item would be 
      // exited
      var jobsSel = jobsG.selectAll(".job")
                          .data(data);

      // remove items
      jobsSel.exit().remove();

      // append items
      jobsSel.enter().append("rect")
          .attr("class", function(d) {
            if (d.hasOwnProperty('type') && d.type === 'optional') return "striped job";
            return "job";
          })
          .attr("id", function() { 
            return "job-" + jobId++; 
          })
          .attr("shape-rendering", "crispEdges");
          
      // update items
      jobsSel
          .attr("x", function(d) { return x(d.start); })
          .attr("y", height - height/categories.length + 20)
          .attr("width", function(d) { return x(d.start + d.executionTime - d.start); })
          .attr("height", height/categories.length)
          .attr("stroke", 'black')
          .style("fill", function(d) { 
            // if (d.hasOwnProperty('type') && d.type === 'optional') return d3.color(tasks[d.id].color).darker(1); 
            return tasks[d.id].color;
          })
          .style("stroke", function(d) { 
            return tasks[d.id].color;
          })
          // .style("stroke-width", "1px")
          // .style("stroke-opacity", 0.5)
          .style("fill-opacity", 1);

      var powerSel = powerG.selectAll(".power")
                          .data(powerSchedule);

      // remove items
      powerSel.exit().remove();

      // append items
      powerSel.enter().append("rect")
        .attr("class", "power")
        .attr("id", function() { 
        return "power-" + powerId++; 
        })
        .attr("shape-rendering", "crispEdges");

      // update items
      powerSel
        .attr("x", function(d) { return x(d.start); })
        .attr("y", 20)
        .attr("width", function(d) { return x(d.end - d.start); })
        .attr("height", height/categories.length-20)
        .style("fill", "orange")
        .style("fill-opacity", function(d) { return d.state ? 1 : 0; })
        .style("stroke", "none");
          
      var releasesSel = releasesG.selectAll(".release")
                              .data(releases)
      
      // remove items
      releasesSel.exit().remove();

      // append items
      releasesSel.enter().append("line")
          .attr("class", "release")
          .attr("id", function() { 
            return "release-" + releaseId++; 
          })
          .attr("shape-rendering", "crispEdges");
      
      releasesSel
          .attr("x1", function(d) { return x(d.time); })
          .attr("y1", height)
          .attr("x2", function(d) { return x(d.time); })
          .attr("y2", height - height/categories.length + 10)          
          .attr("stroke-width", 2)
          .attr("stroke", function(d) { return d3.color(tasks[d.id].color).darker(1) })
          .attr("marker-end", function(d) { return marker(tasks[d.id].color) });

      var deadlinesSel = deadlinesG.selectAll(".deadline")
                              .data(deadlines)

      // remove items
      deadlinesSel.exit().remove();

      // append items
      deadlinesSel.enter().append("line")
          .attr("class", "deadline")
          .attr("id", function() { 
          return "deadline-" + deadlineId++; 
          })
          .attr("shape-rendering", "crispEdges");

      deadlinesSel
          .attr("x1", function(d) { return x(d.time); })
          .attr("y1", height - height/categories.length + 10)
          .attr("x2", function(d) { return x(d.time); })
          .attr("y2", height)
          .attr("stroke-width", 2)
          .attr("stroke", function(d) { return d3.color(tasks[d.id].color).darker(1) })
          .attr("marker-mid", "url(#fail-marker)"
          // function(d) {
          //   if (d.status === deadlineStatus[1]) {
          //     return "url(#fail-marker)";
          //   }
          //   return "";
          // }
          )
          .attr("marker-end",
            function(d) {
              if (d.status === deadlineStatus[1]) {
                return "url(#fail-marker)";
              }
              return marker(tasks[d.id].color);
            }
          );

      // // also, bind data to nav chart
      // // first remove current paths
      // navG.selectAll("path").remove();

      // // then append area path...
      // navG.append('path')
      //     .attr('class', 'area')
      //     .attr('d', navArea(data));

      // // ...and line path
      // navG.append('path')
      //     .attr('class', 'line')
      //     .attr('d', navLine(data)); 
    
    } // end refreshChart function

    return chart;

  } // end chart function

  // chart getter/setters
  chart.duration = function(_) {
    if (arguments.length == 0) return duration;
    duration = _;
    return chart;
  }

  chart.tasks = function(_) {
    if (arguments.length == 0) return tasks;
    tasks = _;
    return chart;
  }

  chart.powerOptions = function(_) {
    if (arguments.length == 0) return powerOptions;
    powerOptions = _;
    return chart;
  }

  chart.scheduleOptions = function(_) {
    if (arguments.length == 0) return scheduleOptions;
    scheduleOptions = _;
    return chart;
  }

  // new data item (this most recent item will appear 
  // on the right side of the chart, and begin moving left)
  chart.datum = function(_) {
    if (arguments.length == 0) return datum;
    datum = _;
    data.push(datum);
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

  // version
  chart.version = version;
  
  return chart;

} // end realTimeChart function