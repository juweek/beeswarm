/*
------------------------------
METHOD: set the size of the canvas
------------------------------
*/
let height = 600;
let width = 1000;
let margin = ({top: 0, right: 40, bottom: 34, left: 40});
let forceCollision = 30;
let radiusRange = 15;

// Data structure describing volume of displayed data
let Count = {
  total: "total",
  perCap: "perCapita",
  population: "population"
};

// Data structure describing legend fields value
let Legend = {
    total: "% with medical debt ",
    perCap: "Per Capita Deaths"
};

let chartState = {};

chartState.measure = Count.total;
chartState.radius = 5
chartState.scale = "scaleLinear";
chartState.legend = Legend.total;

/*
------------------------------
METHOD: select the d3 div and set the width and height
------------------------------
*/

let svg = d3.select("#svganchor")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

/*
------------------------------
METHOD: add in the x-axis
------------------------------
*/
let xScale = d3.scaleLinear()
    .range([margin.left, width - margin.right]);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")");

// Create line that connects circle and X axis
let xLine = svg.append("line")
    .attr("stroke", "rgb(96,125,139)")
    .attr("stroke-dasharray", "1,2");

// Create tooltip div and make it invisible
let tooltip = d3.select("#svganchor").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

/*
------------------------------
METHOD: load in and process data
------------------------------
*/
d3.csv("https://raw.githubusercontent.com/juweek/beeswarm/main/lower_chronic_illnesses.csv").then(function (data) {

    let dataSet = data;

    let listOfValues = [];

      data.forEach((element) => {
        listOfValues.push(element.collection_debt_state_avg);
      });

    // Set chart domain max value to the highest total value in data set. this will affect the key
    xScale.domain(d3.extent(data, function (d) {
        return +d.total;
    }));

     // Listen to click on "total" and "per capita" buttons and trigger redraw when they are clicked
     d3.selectAll(".measure").on("click", function() {
        let thisClicked = this.value;
        //chartState.measure = thisClicked;
        if (thisClicked == "nonSize") {
            chartState.radius = 5
        } else {
            chartState.radius = 0
        }
        redraw()
    })

    redraw()

    function redraw() {
        svg.selectAll(".countries").remove();

        //set the scale based off the range from the dataset
        xScale = d3.scaleLinear().range([margin.left, width - margin.right]);

        xScale.domain(
          d3.extent(dataSet, function (d) {
            return +d[chartState.measure];
          })
        );

        /*
        var rscale = d3.scaleLinear().domain(d3.extent(dataSet, function(d) {
            return +d[chartState.radiusSize];
        })).range([3, 9])
        */

        var rscale = d3
          .scaleLinear()
          .domain([300, d3.max(listOfValues)])
          .range([4, radiusRange]);

        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point
        let xAxis;
        if (chartState.measure === Count.perCap) {
          xAxis = d3.axisBottom(xScale)
          // .ticks(7, ".1f")
            .ticks(7)
            .tickSizeOuter(0)
            .tickFormat(function(d) {
              return d.toFixed(0) + "%";
            });
        } else {
          xAxis = d3.axisBottom(xScale)
          // .ticks(7, ".1s")
            .ticks(7)
            .tickSizeOuter(0)
            .tickFormat(function(d) {
              return d.toFixed(0) + "%";
            });
        }

        //include a transition for the x axis if you change the scale
        d3.transition(svg)
          .select(".x.axis")
          .transition()
          .duration(1000)
          .call(xAxis);

        // Create simulation with specified dataset
        let simulation = d3
          .forceSimulation(dataSet)
          // Apply positioning force to push nodes towards desired position along X axis
          .force(
            "x",
            d3
              .forceX(function (d) {
                // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                return xScale(+d[chartState.measure]); // This is the desired position
              })
              .strength(10)
          ) // Increase velocity
          .force("y", d3.forceY(height / 2 - margin.bottom / 2)) // // Apply positioning force to push nodes towards center along Y axis
          .force("collide", d3.forceCollide(forceCollision)) // Apply collision force with radius of 9 - keeps nodes centers 9 pixels apart
          .stop(); // Stop simulation from starting automatically

        // Manually run simulation
        for (let i = 0; i < dataSet.length; ++i) {
          simulation.tick(10);
        }

        // Create country circles
        let countriesCircles = svg
          .selectAll(".countries")
          .data(dataSet, function (d) {
            return d.FIPS;
          });

        countriesCircles
          .exit()
          .transition()
          .duration(1000)
          .attr("cx", 0)
          .attr("cy", height / 2 - margin.bottom / 2)
          .remove();

        //for every FIPS in the dataset, create a circle, set the r, and set the circles. NOTE: check on radius; it gets wonky when trying to assign it dynamically
        countriesCircles
          .enter()
          .append("circle")
          .attr("class", "countries")
          .attr("cx", 0)
          .attr("cy", height / 2 - margin.bottom / 2)
          .attr("r", function (d) {
            console.log(chartState.radius)
            console.log('///////')
            console.log(chartState)
            console.log('=============')
            if (chartState.radius == 5) {
              return 10;
            } else {
              return parseInt(rscale(d.collection_debt_state_avg));
            }
            //else 	{ return parseInt(d.collection_debt_state_avg)/80}
          })
          //else 	{ return parseInt(d.collection_debt_state_avg)/80}
          .attr("fill", function (d) {
              if (d.State == "New York") {
                return "#EBE2AA";
              } else if (d.State == "California") {
                return "#EBE2AA";
              } else if (d.State == "Texas") {
                return "#D64833";
              } else {
                return "#E18D39";
              }
            })
          .attr("fill-opacity", 0.75)
          .attr("stroke", "#dfdfdf")
          .attr("stroke-width", 1)
          .merge(countriesCircles)
          .transition()
          .duration(2000)
          .attr("cx", function (d) {
            return d.x;
          })
          .attr("cy", function (d) {
            return d.y;
          });

        countriesCircles
          .enter()
          .append("text")
          .attr("class", "textGraph")
          .attr("x", function (d) {
            if (d.County == "Miami-Dade") {
              return d.x + 10;
            }
            if (d.County == "Santa Clara") {
              return d.x - 10;
            }
            if (d.County == "Maricopa") {
              return d.x + 10;
            }
            if (d.County == "Tarrant") {
              return d.x - 40;
            }
            if (d.County == "Dallas") {
              return d.x + 20;
            }
            if (d.County == "Broward") {
              return d.x + 18;
            }
            return d.x + 12;
          })
          .attr("y", function (d) {
            if (d.County == "Maricopa") {
              return d.y + 12;
            }
            if (d.County == "San Bernardino") {
              return d.y - 3;
            }
            if (d.County == "Miami-Dade") {
              return d.y + 14;
            }
            if (d.County == "Riverside") {
              return d.y + 14;
            }
            return d.y + 6;
          })
          .text(function (d) {
            return d.County;
          });

        // Show tooltip when hovering over circle (data for respective country)
        d3.selectAll(".countries")
          .on("mousemove", function (d) {
            tooltip
              .html(
                `<strong>${d.target.__data__.County} County, ${
                  d.target.__data__.State
                }</strong><br>
                          <strong>${chartState.legend.slice(
                            0,
                            chartState.legend.indexOf(",")
                          )}</strong>:
                          ${d.target.__data__.medical_debt_collections_pct}%<br>
                          <strong>Median amount of debt: </strong>$${
                            d.target.__data__.collection_debt_state_avg
                          }`
              )
              .style("left", function () {
                // Get calculated tooltip coordinates and size
                let boundingBox = document.querySelector("body");
                var tooltip_rect = boundingBox.getBoundingClientRect();
                if (d.pageX + 170 > tooltip_rect.width) {
                  return d.pageX - 170 + "px";
                } else {
                  return d.pageX + "px";
                }
              })
              .style("top", function () {
                // Get calculated tooltip coordinates and size
                let boundingBox = document.querySelector("body");
                var tooltip_rect = boundingBox.getBoundingClientRect();
                if (d.pageY + 60 > tooltip_rect.height) {
                  return d.pageY + "px";
                } else {
                  return d.pageY - 200 + "px";
                }
              })
              .style("opacity", 0.9);

            xLine
              .attr("x1", d3.select(this).attr("cx"))
              .attr("y1", d3.select(this).attr("cy"))
              .attr("y2", height - margin.bottom)
              .attr("x2", d3.select(this).attr("cx"))
              .attr("opacity", 1);
          })
          .on("mouseout", function (_) {
            tooltip.style("opacity", 0);
            xLine.attr("opacity", 0);
          });
      }
}).catch(function (error) {
    if (error) throw error;
});