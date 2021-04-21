'use strict';

d3.csv("data/Meyer_2016.csv")
.then(function(data) {
  // set the dimensions and margins of the graph
  // let margin = {top: 10, right: 30, bottom: 30, left: 60},
  // width = 460 - margin.left - margin.right,
  // height = 400 - margin.top - margin.bottom;
  
  let energyData = [];
  
  let energyEvents = [];
  
  let hCounts = {};
  
  let hN = [];

  for (const [key, value] of Object.entries(data[0])) {
    if (isNumeric(key)) {
      energyData.push({x: parseInt(key)-1, y: parseInt(value)});
    }
  };

  let updateHCounts = (precedingN, onState) => {
    if (precedingN != 0) {
      precedingN = precedingN.toString(10);
      if (!hCounts.hasOwnProperty(precedingN)) hCounts[precedingN] = {"on": 0, "total": 0};
      hCounts[precedingN]["on"] += onState;
      hCounts[precedingN]["total"] += 1;
    }
  }

  let getMean = (array) => array.reduce((a, b) => a + b) / array.length;

  let getStandardDeviation = (array) => {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
  }

  let cdfNormal = (x, mean, sd) => {
    return (1 - math.erf((mean - x ) / (Math.sqrt(2) * sd))) / 2
  }

  function normalcdf(to, mean, sigma) 
  {
    var z = (to-mean)/Math.sqrt(2*sigma*sigma);
    var t = 1/(1+0.3275911*Math.abs(z));
    var a1 =  0.254829592;
    var a2 = -0.284496736;
    var a3 =  1.421413741;
    var a4 = -1.453152027;
    var a5 =  1.061405429;
    var erf = 1-(((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-z*z);
    var sign = 1;
    if(z < 0)
    {
        sign = -1;
    }
    return (1/2)*(1+sign*erf);
  }

  let graphHN = () => {
    d3.select("#hn-chart").selectAll("*").remove();
    
    let hnChart = energyChart()
      .title("h(N) Footsteps")
      .yTitle("h(N)")
      .xTitle("N")
      .border(false)
      .width(460)
      .height(400)
      .data(hN)
      .fill(true)
      ;

    d3.select("#hn-chart").append("div")
      .attr("id", "chart-hn")
      .call(hnChart);  
  }

  let computeActivation = (yScale, lineCoords) => {
    let threshold = yScale.invert(lineCoords.y1);
    energyEvents = energyData.map((entry) => {
      return entry.y >= threshold ? 1 : 0;
    });

    hCounts = {};
    hN = [];
    // compute the data for h(N)
    energyEvents.forEach((entry, i) => {
      let precedingN = 0;
      // check for positive N
      for (let j = i-1; j > 0; j--) {
        if (energyEvents[j] === 0) break;
        precedingN += 1;
      }
      updateHCounts(precedingN, entry);

      precedingN = 0;
      // check for negative N
      for (let j = i-1; j > 0; j--) {
        if (energyEvents[j] === 1) break;
        precedingN -= 1;
      }
      updateHCounts(precedingN, entry);
    });

    let ideal = [];

    // find absolute maximum N in our data
    var max = 0;
    for (var property in hCounts) {
      let absVal = Math.abs(parseInt(property));
      max = (max < absVal) ? absVal : max;
    }

    // add missing values on either side with count and total = 0
    for (let i = -max; i <= max; i++) {
      if (i !== 0 && !hCounts.hasOwnProperty(i)) hCounts[i] = {"on": 0, "total": 0};

      if (i < 0) ideal.push(0);
      else if (i > 0) ideal.push(1);
    }

    let hNCompare = [];

    // calculate probabilities and format data to pass to d3
    for (const [key, value] of Object.entries(hCounts)) {
      let p = parseInt(value["total"]) > 0 ? parseInt(value["on"])/parseInt(value["total"]) : 0;
      hN.push({
        x: parseInt(key),
        y: p,
      });
      hNCompare.push(p);
    }

    console.log(ideal);
    console.log(hNCompare);

    let sumIdeal = ideal.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue
    }, 0);

    let sumHN = hNCompare.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue
    }, 0);

    for (let i = 0; i < ideal.length ; i++) {
      ideal[i] /= sumIdeal;
      hNCompare[i] /= sumHN;
    }

    ideal[ideal.length-1] += 1 - ideal.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue
    }, 0);

    hNCompare[hNCompare.length-1] += 1 - hNCompare.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue
    }, 0);

    console.log(ideal);
    console.log(hNCompare);

    // let meanIdeal = getMean(ideal);
    // let meanHN = getMean(hNCompare);

    // let sdIdeal = getStandardDeviation(ideal);
    // let sdHN = getStandardDeviation(hNCompare);

    // let cdfIdeal = [];
    // let cdfHN = [];

    // for (let i = 0; i < ideal.length ; i++) {
    //   cdfIdeal.push(cdfNormal(ideal[i], meanIdeal, sdIdeal));
    //   cdfHN.push(cdfNormal(hNCompare[i], meanHN, sdHN));
    // }

    // console.log(cdfIdeal);
    // console.log(cdfHN);

    // let pdfIdeal = [];
    // let pdfHN = [];

    // for (let i = cdfIdeal.length-1; i > 0 ; i--) {
    //   pdfIdeal.push(cdfIdeal[i] - cdfIdeal[i-1]);
    //   pdfHN.push(cdfHN[i] - cdfHN[i-1]);
    // }

    // pdfIdeal.push(cdfIdeal[0]);
    // pdfHN.push(cdfHN[0]);

    // console.log(pdfIdeal.reduce(function (accumulator, currentValue) {
    //   return accumulator + currentValue
    // }, 0));
    // console.log(pdfHN.reduce(function (accumulator, currentValue) {
    //   return accumulator + currentValue
    // }, 0));

    console.log(math.kldivergence(ideal, hNCompare));

    graphHN();
  }

  let thresholdChart = energyChart()
    .title("Footstep Energy")
    .yTitle("mJ")
    .xTitle("Time")
    .border(false)
    .width(460)
    .height(400)
    .hasThreshold(true)
    .data(energyData)
    .computeActivation(computeActivation)
    ;

  d3.select("#energy-chart").append("div")
    .attr("id", "chart-energy-threshold")
    .call(thresholdChart);  
})
.catch(function(error){
 // handle error   
})