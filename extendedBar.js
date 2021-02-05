/*global d3*/
H5P.Chart.ExtendedBarChart = (function () {

  /**
   * Creates a bar chart from the given data set.
   *
   * @class
   * @param {array} params from semantics, contains data set
   * @param {H5P.jQuery} $wrapper
   */
  function extendedBarChart(params, $wrapper) {
    var self = this;
    var dataSet = params.listOfTypes;
    var defColors = d3.scale.ordinal()
        .range(["#fbb033", "#2f2f2f", "#FFB6C1", "#B0C4DE", "#D3D3D3", "#20B2AA", "#FAFAD2"]);

    //Lets check if the axes titles are defined, used for setting correct offset for title space in the generated svg
    var isXAxisDefined = !!params.xAxisText;
    var isYAxisDefined = !!params.yAxisText;

    // Create scales for bars
    var xScale = d3.scale.ordinal()
        .domain(d3.range(dataSet.length));

    var yScale = d3.scale.linear()
        .domain([0, d3.max(dataSet, function (d) {
          return d.value;
        })]);

    var x = d3.time.scale();
    var y = d3.scale.linear();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat(function (d) {
          return dataSet[d % dataSet.length].text;
        });

    // Create SVG element
    var svg = d3.select($wrapper[0])
        .append("svg");

    svg.append("desc").html("chart");

    // Create x axis
    var xAxisG = svg.append("g")
        .attr("class", "x-axis");

    /**
     * @private
     */
    var key = function (d) {
      return dataSet.indexOf(d);
    };

    // Create rectangles for bars
    var rects = svg.selectAll("rect")
        .data(dataSet, key)
        .enter()
        .append("rect")
        .attr("fill", function(d) {
          if (d.color !== undefined) {
            return d.color;
          }
          return defColors(dataSet.indexOf(d) % 7);
        });

    var xAxisTitle = svg.append("text")
        .style("text-anchor", "middle")
        .text(params.xAxisText);

    var yAxisTitle = svg.append("text")
        .style("transform", "rotate(90deg)")
        .text(params.AxisText);

    // Create labels
    var texts = svg.selectAll("text")
        .data(dataSet, key)
        .enter()
        .append("text")
        .text(function(d) {
          return d.value;
        })
        .attr("text-anchor", "middle")
        .attr("fill", function (d) {
          if (d.fontColor !== undefined) {
            return d.fontColor;
          }
          return '000000';
        })
        .attr("aria-hidden", true);

    /**
     * Fit the current bar chart to the size of the wrapper.
     */
    self.resize = function () {
      // Always scale to available space
      var style = window.getComputedStyle($wrapper[0]);
      var width = parseFloat(style.width);
      var h = parseFloat(style.height);
      var fontSize = parseFloat(style.fontSize);
      var lineHeight = (1.25 * fontSize);
      var tickSize = (fontSize * 0.125);

      var height = h - tickSize - (lineHeight); // Add space for labels below

      //if xAxisTitle exists, them make room for it by adding more lineheight
      if(isXAxisDefined) {
      height = h - tickSize - (lineHeight * 2);
      }

      // Update SVG size
      svg.attr("width", width)
          .attr("height", h);

      // Update scales
      xScale.rangeRoundBands([0, width], 0.05);
      yScale.range([0, height]);

      x.range([0, width]);
      y.range([height, 0]);

      xAxis.tickSize([tickSize]);
      isYAxisDefined ?
      //Making space for Y Axis title by adding the lineheight to underline
      xAxisG.attr("transform", "translate("+ lineHeight + "," + height + ")").call(xAxis) :
          xAxisG.attr("transform", "translate(0," + height + ")").call(xAxis);


      // Move rectangles (bars)
      rects.attr("x", function(d, i) {
        //if Y Axis title is defined lets make space for Y Axis title by adding the lineheight to each bar position
        if(isYAxisDefined) {
        return xScale(i) + lineHeight;
        } else {
          return xScale(i);
        }
      }).attr("y", function(d) {
        return height - yScale(d.value);
      }).attr("width", xScale.rangeBand())
          .attr("height", function(d) {
            return yScale(d.value);
          });

      //Sets the axes titles on resize
      xAxisTitle
          .attr("x", width/2 )
          .attr("y", h);
      yAxisTitle
          .attr("x", height/2)
          .attr("y", 0);
      console.log(params);
      // Re-locate text value labels
      texts.attr("x", function(d, i) {
        return xScale(i) + xScale.rangeBand() / 2;
      }).attr("y", function(d) {
        return height - yScale(d.value) + lineHeight;
      });


      // Hide ticks from readspeakers, the entire rectangle is already labelled
      xAxisG.selectAll("text").attr("aria-hidden", true);
    };
  }

  return extendedBarChart;
})();
