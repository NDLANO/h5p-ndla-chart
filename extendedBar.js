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
        .range(['#fbb033', '#2f2f2f', '#FFB6C1', '#B0C4DE', '#D3D3D3', '#20B2AA', '#FAFAD2']);

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
    var svg = d3.select($wrapper[0])
        .append('svg');

    svg.append('desc').html('chart');

    // Create x axis
    var xAxisG = svg.append('g')
        .attr('class', 'x-axis');

    var yAxisG = svg.append('g')
        .attr('class', 'y-axis')

    /**
     * @private
     */
    var key = function (d) {
      return dataSet.indexOf(d);
    };

    // Create rectangles for bars
    var rects = svg.selectAll('rect')
        .data(dataSet, key)
        .enter()
        .append('rect')
        .attr('fill', function(d) {
          if (d.color !== undefined) {
            return d.color;
          }
          return defColors(dataSet.indexOf(d) % 7);
        });

    var chartText = svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(params.chartText);

    var xAxisTitle = svg.append('text')
        .style('text-anchor', 'middle')
        .text(params.xAxisText);

    var yAxisTitle = svg.append('text')
        .style('transform', 'rotate(90deg)')
        .text(params.yAxisText);

    // Create inner rect labels
    var xAxisGTexts = svg.selectAll('x-axis text')
        .data(dataSet, key)
        .enter();

    // Create inner rect labels
    var texts = svg.selectAll('text')
        .data(dataSet, key)
        .enter()
        .append('text')
        .text(function(d) {
          return d.value;
        })
        .attr('text-anchor', 'middle')
        .attr('fill', function (d) {
          if (d.fontColor !== undefined) {
            return d.fontColor;
          }
          return '000000';
        })
        .attr('aria-hidden', true);

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
      var chartTitleTextHeight = svg.select('.chart-title')[0][0].getBoundingClientRect().height;
      var chartTitleTextOffset =  chartTitleTextHeight + lineHeight; // Takes the height of the text element and adds line height, so we always have som space under the title
      var height = h - xTickSize - (lineHeight) - (chartTextDefined ? chartTitleTextOffset : 0); // Add space for labels below, and also the chart title
      //if xAxisTitle exists, them make room for it by adding more lineheight
      if(isXAxisTextDefined) {
        height = h - xTickSize - (lineHeight * 2) - (chartTextDefined ? chartTitleTextOffset : 0);
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
      xAxisG.attr('transform', 'translate(0,0)').call(xAxis);
      //A lot of conditional moving here. If Y axis text is defined, we translate 40 px in the X direction. In the Y direction we translate downward the by current chartTitle height and line height
      yAxisG
          .attr('transform', 'translate(' + (isYAxisTextDefined ? 40 : 10) + ',' + (chartTextDefined ? chartTitleTextOffset : 0) + ')');

      yAxisG.call(yAxis
          .tickSize(-width, 0, 0)
          .ticks(getSmartTicks(d3.max(dataSet).value).count));

      //Gets all text element from the Y Axis
      var yAxisTicksText = yAxisG.selectAll('g.tick text')[0];
      //Gets width of last Y Axis tick text element
      var yAxisLastTickWidth = yAxisTicksText[yAxisTicksText.length-1].getBoundingClientRect().width;

      // Move rectangles (bars)
      rects.attr('x', function(d, i) {
        //if Y Axis title is defined lets make space for Y Axis title by adding the lineheight times 2, to each bar position, and the width of the last, and presumably longest, tick text width
        if(isYAxisTextDefined) {
          return xScale(i) + xAxisRectOffset + yAxisLastTickWidth;
        } else {
          return xScale(i) + lineHeight + yAxisLastTickWidth;
        }
      }).attr('y', function(d) {
        //If chart text is defined, add the height of the svg chart text and the lineheight to offsett the rects on the y
        return chartTextDefined ? yScale(d.value) + chartTitleTextOffset : yScale(d.value);
      }).attr('width', xScale.rangeBand())
          .attr('height', function(d) {
            return height - yScale(d.value) ;
          });

      //Sets the axes titles on resize
      chartText
          .attr('x', width/2 )
          .attr('y', lineHeight);

      xAxisTitle
          .attr('x', width/2 )
          .attr('y', h);
      yAxisTitle
          .attr('x', height/2)
          .attr('y', 0);

      var xAxisGTexts = svg.selectAll('g.x-axis g.tick');

      //Used for positioning/translating the X axis ticks to be in the middle of each bar
      xAxisGTexts.attr('transform', function(d, i) {
        var x;
        var y = chartTextDefined ? chartTitleTextOffset: 0;
        if(isYAxisTextDefined) {
          x = xScale(i) + xScale.rangeBand() / 2 + xAxisRectOffset + yAxisLastTickWidth;
          y += height;
          return  'translate (' + x + ', ' + y +')';
        }
        else {
          x =  xScale(i) + xScale.rangeBand() / 2  + lineHeight + yAxisLastTickWidth;
          y += height;
          return  'translate (' + x + ', ' + y +')';
        }
      });


      // Re-locate text value labels
      texts.attr('x', function(d, i) {
        if(isYAxisTextDefined) {
          //Offset a bt more if the Y Axis text is defined
          return xScale(i) + xScale.rangeBand() / 2 + xAxisRectOffset + yAxisLastTickWidth;}
        else {
          return xScale(i) + xScale.rangeBand() / 2  + lineHeight + yAxisLastTickWidth;
        }
      }).attr('y', function(d) {
        //Add more room with a ternary if chart text is defined
        return height - lineHeight + (chartTextDefined ? chartTitleTextOffset : 0);
      });

      // Hide ticks from readspeakers, the entire rectangle is already labelled
      xAxisG.selectAll('text').attr('aria-hidden', true);
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

  return extendedBarChart;
})();
