// create svg element
var svg = d3.select("#defs")
  .append("svg")
  .attr("width", 1000)
  // .attr("height", 0);

var defs = svg.append("svg:defs");

let marker = (color, d, handleMouseOver, handleMouseOut) => {
  defs.append("svg:marker")
      .attr("id", color.replace("#", ""))
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 9)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5")
      .style("fill", d3.color(color).darker(1))
      .data(d)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

  return "url(" + color + ")";
}

let failMarker = defs.append("marker")
  .attr("id", "fail-marker")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 9)
  .attr("markerWidth", 5)
  .attr("markerHeight", 5)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M 10 3 L 2 -5 L 0 -3 L 8 5 M 8 -5 L 0 3 L 2 5 L 10 -3")
  .style("fill", "red");

// create pattern and mask for striped optional jobs
let pattern = defs.append("pattern")
  .attr("id", "pattern-stripe")
  .attr("width", 4)
  .attr("height", 4)
  .attr("patternUnits", "userSpaceOnUse")
  .attr("patternTransform", "rotate(45)")

pattern.append("rect")
  .attr("width", 2)
  .attr("height", 4)
  .attr("transform", "translate(0,0)")
  .style("fill", "white");

let mask = defs.append("mask")
  .attr("id", "mask-stripe")

mask.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", "100%")
  .attr("height", "100%")
  .style("fill", "url(#pattern-stripe)");