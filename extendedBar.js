/*global d3*/
H5P.Chart.ExtendedBarChart = (() => {
  class ExtendedBarChart {

    /**
     * Creates a bar chart from the given data set.
     * @class
     * @param {object} params from semantics, contains data set.
     * @param {H5P.jQuery} $wrapper Wrapper element.
     */
    constructor(params, $wrapper) {
      this.params = params;
      this.wrapper = $wrapper[0];

      this.dataSet = params.listOfTypes;

      const defColors = d3.scale.ordinal()
        .range(
          ['#fbb033', '#2f2f2f', '#FFB6C1', '#B0C4DE', '#D3D3D3',
          '#20B2AA', '#FAFAD2']
        );

      // Create scales for bars
      this.xScale = d3.scale.ordinal()
        .domain(d3.range(this.dataSet.length));

      this.yScale = d3.scale.linear()
        .domain([0, d3.max(this.dataSet, (d) => d.value)]);

      this.x = d3.time.scale();
      this.y = d3.scale.linear();

      this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient('bottom')
        .tickFormat((d) => this.dataSet[d % this.dataSet.length].text);

      this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient('left');

      // Create SVG element
      this.svg = d3.select($wrapper[0])
        .append('svg');
      this.svg.append('desc').html('chart');

      const ariaLabelSegments = [this.params.a11y.lineChart];
      if (this.params.chartText) {
        ariaLabelSegments.push(
          `${this.params.a11y.title}: ${ this.params.chartText }
        `);
      }
      if (this.params.xAxisText) {
        ariaLabelSegments.push(
          `${this.params.a11y.xAxis}: ${ this.params.xAxisText }`
        );
      }
      if (this.params.yAxisText) {
        ariaLabelSegments.push(
          `${this.params.a11y.yAxis}: ${ this.params.yAxisText }`
        );
      }

      this.svg.attr('aria-label', ariaLabelSegments.join(', '));

      // Create x axis
      this.xAxisGroup = this.svg.append('g')
        .attr('class', 'x-axis')
        .attr('aria-label', `${this.params.a11y.xAxis}${ this.params.xAxisText ? ': ' + this.params.xAxisText : '' }`);

      // Create y axis
      this.yAxisGroup = this.svg.append('g')
        .attr('class', 'y-axis')
        .attr('aria-label', `${this.params.a11y.yAxis}${ this.params.yAxisText ? ': ' + this.params.yAxisText : '' }`);

      const key = (d) => this.dataSet.indexOf(d);

      // rectGroup is for grouping the bars in
      this.rectGroup = this.svg.append('g').attr('class', 'rect-group');

      // Create rectangles for bars
      this.rects = this.rectGroup.selectAll('rect')
        .data(this.dataSet, key)
        .enter()
        .append('rect')
        .attr('tabindex', 0)
        .attr('focusable', 'true')
        .attr('class', 'bar')
        .attr(
          'aria-label',
          (data) => `${this.params.a11y.yAxis}: ${data.value}, ${this.params.a11y.xAxis}: ${data.text}`)
        .attr('fill', (d) => {
          if (params.overrideColorGroup && params.overrideColorGroup.overrideChartColorsTick) {
            return params.overrideColorGroup.overrideChartColor;
          }

          if (d.color !== undefined) {
            return d.color;
          }

          return defColors(dataSet.indexOf(d) % 7);
        });

      this.chartText = this.svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(params.chartText);

      this.xAxisTitle = this.svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'axis-title')
        .attr('aria-label', `${params.a11y.xAxis}: ${ params.xAxisText || '' }`)
        .text(params.xAxisText);

      this.yAxisTitle = this.svg.append('text')
        .style('transform', 'rotate(270deg)')
        .attr('class', 'axis-title')
        .attr('aria-label', `${params.a11y.yAxis}: ${ params.yAxisText || '' }`)
        .text(params.yAxisText);

      // Create inner rect labels
      this.barTexts = this.rectGroup
        .selectAll('text')
        .data(this.dataSet, key)
        .enter()
        .append('text')
        .attr('text-anchor', 'middless')
        .text((d) => d.value)
        .attr('text-anchor', 'middless')
        .attr('fill', (d) => {
          if (params.overrideColorGroup?.overrideChartColorsTick) {
            return params.overrideColorGroup.overrideChartColorText;
          }

          if (d.fontColor !== undefined) {
            return d.fontColor;
          }

          return '000000';
        })
        .attr('aria-hidden', true);
    }

    /**
     * Fit the current bar chart to the size of the wrapper.
     */
    resize() {
      /**
       * Calculate number of ticks.
       * @param {number} value Number of ticks.
       * @returns {{ endPoint: number, count: number }} Number of ticks and the end point.
       */
      const getSmartTicks = (value) => {
        // base step between nearby two ticks
        let step = Math.pow(10, value.toString().length - 1);

        // modify steps either: 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000...
        if (value / step < 2) {
          step = step / 5;
        }
        else if (value / step < 5) {
          step = step / 2;
        }

        // add one more step if the last tick value is the same as the max value
        // if you don't want to add, remove '+1'
        const slicesCount = Math.ceil((value + 1) / step);

        return {
          endPoint: slicesCount * step,
          count: Math.min(10, slicesCount) //show max 10 ticks
        };
      };

      // Always scale to available space
      const style = window.getComputedStyle(this.wrapper);

      const canvasWidth = parseFloat(style.width);
      const canvasHeight = parseFloat(style.height);

      const fontSize = parseFloat(style.fontSize);
      const verticalGap = (ExtendedBarChart.VERTICAL_GAP_FACTOR * fontSize);
      const horizontalGap = verticalGap;

      const chartTitleTextHeight =
        this.chartText[0][0].getBoundingClientRect().height;

      const xAxisTitleTextHeight =
        this.xAxisTitle[0][0].getBoundingClientRect().height;

      const chartTitleHeight = chartTitleTextHeight ?
        2 * verticalGap + chartTitleTextHeight :
        0;

      const xAxisTitleHeight = xAxisTitleTextHeight ?
        verticalGap + xAxisTitleTextHeight :
        0;

        let graphHeight = canvasHeight -
        2 * verticalGap - // Padding top and bottom
        chartTitleHeight -
        xAxisTitleHeight;

      if (!chartTitleHeight && !xAxisTitleHeight) {
        graphHeight -= verticalGap;
      }
      else if (chartTitleHeight && xAxisTitleHeight) {
        graphHeight += verticalGap;
      }

      // Update SVG size
      this.svg.attr('viewBox', `0 0 ${ canvasWidth } ${ canvasHeight }`);

      // Update y scales
      // Unlike in 'bar.js', we have 'flipped' the chart, making origo to be in top left corner of chart. This is due to the nature of the Y axis ticks
      this.yScale.range([graphHeight, 0]);
      this.y.range([graphHeight, 0]);
      this.yAxisGroup.call(
        this.yAxis
          .tickSize(-canvasWidth, 0, 0)
          .ticks(getSmartTicks(d3.max(this.dataSet).value).count));

      this.translationX = this.translationX ?? (
        horizontalGap +
        this.yAxisTitle[0][0].getBoundingClientRect().width +
        this.yAxisGroup
          .selectAll('g.tick text')[0]
          .reduce((max, current) => {
            const width = current.getBoundingClientRect().width;
            return width > max ? width : max;
          }, 0)
      );

      // Update x scales
      this.xScale.rangeRoundBands([0, canvasWidth - this.translationX], 0.05);
      this.x.range([0, canvasWidth]);
      this.xAxis.tickSize([0]);
      this.xAxisGroup.call(this.xAxis);

      this.translationY = this.translationY ??
        (chartTitleTextHeight + verticalGap + (chartTitleTextHeight ? verticalGap : 0));

      this.xAxisGroup.attr(
        'transform',
        `translate(${ this.translationX + ExtendedBarChart.Y_AXIS_GROUP_MARGIN }, ${ (chartTitleTextHeight ? verticalGap : 0) + verticalGap / 2 })`
      );

      this.yAxisGroup.attr(
        'transform',
        `translate(${ this.translationX }, ${ this.translationY })`
      );

      this.yAxisGroupHeight = this.yAxisGroupHeight ??
        this.yAxisGroup[0][0].getBoundingClientRect().height;

      // Set the axes titles on resize
      this.chartText
        .attr('x', canvasWidth / 2 )
        .attr('y', chartTitleTextHeight );

      this.xAxisTitle
        .attr(
          'x', canvasWidth / 2
        )
        .attr(
          'y', chartTitleTextHeight + this.yAxisGroupHeight + 3 * verticalGap + (chartTitleTextHeight ? verticalGap : 0)
        );

      this.yAxisTitle
        .attr('x', - verticalGap - chartTitleHeight - graphHeight / 2)
        .attr('y', verticalGap);

      const yAxisTicksXPos =
        chartTitleTextHeight + this.yAxisGroupHeight + 0.5 * verticalGap;

      this.svg
        .selectAll('g.x-axis g.tick')
        .attr('transform', (d, i) => {
          return `translate(${ this.xScale(i) }, ${ yAxisTicksXPos })`;
        });

      // position the rectgroup
      this.rectGroup.attr(
        'transform',
        `translate(${ this.translationX }, ${ this.translationY })`
      );

      // rects are already inside the rectGroup, so we need to position them
      this.rects
        .attr('x', (d, i) => this.xScale(i))
        .attr('y', (d) => this.yScale(d.value))
        .attr('width', this.xScale.rangeBand())
        .attr('height', (d) => graphHeight - this.yScale(d.value));

      const offsetFromBar = 5;

      // Re-locate text value labels
      this.barTexts
        .attr('x', (d, i) => {
          const barText = this.barTexts[0][i];
          const barTextWidth = barText.getBoundingClientRect().width;
          return this.xScale(i) + this.xScale.rangeBand() / 2 - barTextWidth / 2;
        })
        .attr('y', (d) => {
          return this.yScale(d.value) - offsetFromBar;
        });

      if (!this.firstResizeDone) {
        // Hide ticks from screen readers, the entire rectangle is already labelled
        this.xAxisGroup.selectAll('text').attr('aria-hidden', true);
      }

      this.firstResizeDone = true;
    }
  }

  /** @constant {number} Y_AXIS_GROUP_MARGIN Default y axis group margin. */
  ExtendedBarChart.Y_AXIS_GROUP_MARGIN = 20;

  /** @constant {number} VERTICAL_GAP_FACTOR Default vertical gap factor to be multiplied with wrapper font size. */
  ExtendedBarChart.VERTICAL_GAP_FACTOR = 1.25;

  return ExtendedBarChart;
})();
