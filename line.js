/*global d3*/


H5P.Chart.LineChart = (function () {

  /**
   * Creates a line chart from the given data set.
   *
   * Notice: LineChart uses its own listOfTypes in h5p-chart/semantics.json, its differentiated through the use of "showWhen"-widget
   * @class
   * @param {Object} params from semantics, contains data set
   * @param {H5P.jQuery} $wrapper
   */
  function LineChart(params, $wrapper) {
    var self = this;
    var dataSet = params.listOfTypes;
    //Lets check if the axes titles are defined, used for setting correct offset for title space in the generated svg
    var chartTextDefined = !!params.chartText;
    var isXAxisTextDefined = !!params.xAxisText;
    var isYAxisTextDefined = !!params.yAxisText;

    // Create scales for bars
    var xScale = d3.scale.ordinal()
        .domain(d3.range(dataSet.length));
    var yScale = d3.scale.linear()
        .domain([0, d3.max(dataSet, function (d) {
          return d.value ;
        })]);
    var x = d3.time.scale();
    var y = d3.scale.linear();

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('bottom')
        .tickFormat(function (d) {
          return dataSet[d % dataSet.length].text;
        });

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left');
    // Create SVG element
    var isShowingTooltip = false;

    var svg = d3.select($wrapper[0])
        .append('svg')
    svg.append('desc').html('chart')

    // Create x axis
    var xAxisG = svg.append('g')
        .attr('class', 'x-axis');

    var yAxisG = svg.append('g')
        .attr('class', 'y-axis')
        .attr('aria-label', H5P.t())

    svg.on("mouseleave", function() {
      if(isShowingTooltip) {
        onCircleExit();
      }
    });
    var ariaChartText = chartTextDefined ? params.chartText : "";
    var ariaXaxisText = isXAxisTextDefined ? params.xAxisText : "";
    var ariaYaxisText = isYAxisTextDefined ? params.yAxisText : "";
    /**
     * @private
     */
    var key = function (d) {
      return dataSet.indexOf(d);
    };
    var chartText = svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(params.chartText);

    var xAxisTitle = svg.append('text')
        .style('text-anchor', 'middle')
        .attr('aria-label', 'X axis title: ' + params.xAxisText)
        .attr('class', 'axis-title')
        .text(params.xAxisText);

    var yAxisTitle = svg.append('text')
        .style('transform', 'rotate(90deg)')
        .attr('aria-label', 'Y axis title: ' + params.yAxisText)
        .attr('class', 'axis-title')
        .text(params.yAxisText);

    var lineGroup = svg.append("g"); //Used for creating a container for the lines
    var path =  lineGroup.selectAll("path")
        .data([dataSet])
        .enter()
        .append("path");
    var circeRadius = 7;
    var dots = lineGroup.selectAll("circle")
        .data(dataSet, key)
        .enter()
        .append("circle")
        .attr("r", circeRadius)
        .attr("tabindex", 0)
        .attr('focusable', 'true')
        .attr("aria-label", (data) => "Y axis: " +  ariaYaxisText + ": " + data.value +
            ", X axis: " + ariaXaxisText + ": " + data.text)
        .style("fill", params.lineColorGroup)
        .on("keyup", function(d,i) {
          if(d3.event.keyCode === 9 && isShowingTooltip ){
            onCircleExit(this);
          }
          if(d3.event.keyCode === 9 && !isShowingTooltip){
            onCircleEnter(d,i, this);
          }
        })

        .on("mouseover", function(d, i) {
          d3.select(this).transition().duration(200)
              .attr("r", circeRadius * 1.25);
          if(isShowingTooltip) {
            onCircleExit(this);
            onCircleEnter(d,i, this);
          }  else
          {
            onCircleEnter(d,i, this);
          }
        })

        .on("mouseout", function(d) { // Animates exit animation for hover exit
          d3.select(this).transition().duration(200)
              .attr("r", circeRadius)
              .style("font-size", 12);
        });

    function onCircleEnter(d,i, thisCircle) {

      var rectWidth = 20;
      var rectHeight = 20;
      var group = lineGroup.append("g")
          .attr("class", "text-group")


      var rect = group.append("rect")
          .attr("width", function() { return rectWidth;})
          .attr("height", function() { return rectHeight;})
          .attr("x", function() { return 0;})
          .attr("y", function() { return 0;})

          .attr("rx", function() { return 2;})
          .attr("id", "value-" + i)
          .attr("class", "text-rect");

      var text = group.append("text")
          .attr("class", "text-node")
          .text(function() { return d.value;});
      var textWidth = text[0][0].getBoundingClientRect().width;
      var textHeight = text[0][0].getBoundingClientRect().height;
      rectWidth = rectWidth + textWidth;

      rect.attr("width", function() { return rectWidth;})
          .transition().duration(200)
      group.attr('transform', 'translate (' + (xScale(i) - (rectWidth / 2)) + ',' + (yScale(d.value) - (rectHeight * 1.5)) + ')');

      text
          .attr("x", function() { return (rectWidth - textWidth) / 2  ;})
          .attr("y", function() { return textHeight ;})
          .attr("id", "value-" + i)
          .text(function() { return d.value;});
      isShowingTooltip = true;

    }

    function onCircleExit() {
      // Deleting extra elements
      d3.selectAll(".text-group").remove();
      isShowingTooltip = false;
    }



    var line = d3.svg.line();

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
      var xTickSize = (fontSize * 0.125);
      var xAxisRectOffset = lineHeight * 3;
      //If chart title doesnt exist, we still make an offset
      var chartTitleTextHeight = chartTextDefined ? svg.select('.chart-title')[0][0].getBoundingClientRect().height : 40;
      var chartTitleTextOffset =  chartTitleTextHeight  + lineHeight; // Takes the height of the text element and adds line height, so we always have som space under the title
      var height = h - xTickSize - (lineHeight * 2) - chartTitleTextOffset; // Add space for labels below, and also the chart title
      //if xAxisTitle exists, them make room for it by adding more lineheight
      if(isXAxisTextDefined) {
        height = h - xTickSize - (lineHeight * 4) - chartTitleTextOffset;
      }
      // Update SVG size
      svg.attr('width', width)
          .attr('height', h);


      // Update scales
      xScale.rangeRoundBands([0, width - xAxisRectOffset], 0.05); //In order for the X scale to NOT overlap Y axis ticks, we define and offset, making the X scale start further away from the svg wrapper edge
      yScale.range([height, 0]); //Unlike in 'bar.js', we have 'flipped' the chart, making origo to be in top left corner of chart. This is due to the nature of the Y axis ticks

      x.range([0, width]);
      y.range([height, 0]);

      xAxis.tickSize([0]);
      xAxisG.call(xAxis);
      var firstXaxisTick = xAxisG.select('.tick');
      var firstXaxisTickWidth = firstXaxisTick[0][0].getBoundingClientRect().width;
      yAxisG.call(yAxis
          .tickSize(-width, 0, 0)
          .ticks(getSmartTicks(d3.max(dataSet).value).count));
      //Gets all text element from the Y Axis
      var yAxisTicksText = yAxisG.selectAll('g.tick text')[0];
      //Gets width of last Y Axis tick text element
      var yAxisLastTickWidth = yAxisTicksText[yAxisTicksText.length-1].getBoundingClientRect().width;

      var minYAxisGMargin = 20;
      const xTranslation = (isYAxisTextDefined ? yAxisLastTickWidth  + minYAxisGMargin : yAxisLastTickWidth + lineHeight );
      const yTranslation = chartTitleTextOffset;

      xAxisG.attr('transform', `translate(${xTranslation + minYAxisGMargin}, ${lineHeight/2})`);
      yAxisG
          .attr('transform', `translate(${xTranslation}, ${yTranslation})`);
      //Sets the axes titles on resize
      chartText
          .attr('x', width/2 )
          .attr('y', lineHeight);

      xAxisTitle
          .attr('x', width/2 )
          .attr('y', h-2);
      yAxisTitle
          .attr('x', height/2)
          .attr('y', 0);
      var xAxisGTexts = svg.selectAll('g.x-axis g.tick');

      xAxisGTexts.attr('transform', function(d, i) {
        var x;
        var y = chartTitleTextOffset;
          x =  xScale(i);
          y += height;
          return  'translate (' + x + ', ' + y +')';

      });

      var lineXPos = xTranslation + minYAxisGMargin
      lineGroup.attr('transform', 'translate(' + lineXPos + ',' + chartTitleTextOffset + ')');

      //Apply line positions after the scales have changed on resize
      line.x(function(d,i) {return xScale(i);})
          .y(function(d) { return yScale(d.value); });

      //apply lines after resize
      path.attr("class", "line-path")
          .attr("d", line)
          .style("stroke", params.lineColorGroup);
      //Move dots according to scale
      dots.attr("cx", function(d,i) { return xScale(i);})
          .attr("cy", function(d) { return yScale(d.value); });


      // Hide ticks from screen readers, the entire rectangle is already labelled
      xAxisG.selectAll('text').attr('aria-hidden', true);

      svg.attr("aria-label", "Line chart, title: " + ariaChartText +
          ", X axis title: " + ariaXaxisText + ", Y axis text: " + ariaYaxisText);

    };
  }

  /**
   * Calculates number of ticks based on an array of numbers
   * @param val
   * @returns {{endPoint: number, count: number}}
   */
  function getSmartTicks(val) {

    //base step between nearby two ticks
    var step = Math.pow(10, val.toString().length - 1);

    //modify steps either: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
    if (val / step < 2) {
      step = step / 5;
    } else if (val / step < 5) {
      step = step / 2;
    }

    //add one more step if the last tick value is the same as the max value
    //if you don't want to add, remove '+1'
    var slicesCount = Math.ceil((val + 1) / step);

    return {
      endPoint: slicesCount * step,
      count: Math.min(10, slicesCount) //show max 10 ticks
    };

  }

  return LineChart;
})();
