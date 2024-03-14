/* global d3 */
H5P.Chart.LineChart = (() => {
  class LineChart {
    /**
     * Create a line chart from the given data set.
     * @class
     * @param {object} params from semantics, contains data set.
     * @param {H5P.jQuery} $wrapper Wrapper element.
     */
    constructor(params, $wrapper) {
      this.params = params;
      this.wrapper = $wrapper[0];

      const onCircleEnter = (d, i) => {
        const group = this.lineGroup.append('g')
          .attr('class', 'text-group')

        const rect = group.append('rect')
          .attr('x', () => 0)
          .attr('y', () => 0)
          .attr('rx', () => 2)
          .attr('id', `value-${ i }`)
          .attr('class', 'text-rect');

        const text = group.append('text')
          .attr('class', 'text-node')
          .text(() => d.value);

        const textWidth = text[0][0].getBoundingClientRect().width;
        const textHeight = text[0][0].getBoundingClientRect().height;

        const rectWidth = textHeight + textWidth;
        const rectHeight = textHeight * LineChart.TOOLTIP_SIZE_FACTOR;

        rect
          .attr('width', () => rectWidth)
          .attr('height', () => rectHeight)
          .transition().duration(LineChart.TRANSITION_DURATION_MS)

        // Place tooltip above the circle if value below mean value, otherwise place below
        const scaleValuesY = this.dataSet.map((d) => this.yScale(d.value));
        const scaleValuesYMean = (Math.max(...scaleValuesY) - Math.min(...scaleValuesY)) / 2;

        const tooltipOffest =
          LineChart.CIRCLE_SIZE * LineChart.CIRCLE_HOVER_SIZE_FACTOR +
            LineChart.CIRCLE_TOOLTIP_OFFSET;

        const translationY = (this.yScale(d.value) < scaleValuesYMean) ?
          this.yScale(d.value) + tooltipOffest :
          this.yScale(d.value) - rectHeight - tooltipOffest;

        group.attr(
          'transform',
          `translate (${ this.xScale(i) - (rectWidth / 2) }, ${ translationY })`
        );

        text
          .attr('x', () => (rectWidth - textWidth) / 2)
          .attr('y', () => textHeight)
          .attr('id', `value-${ i }`)
          .text(() => d.value);

        isShowingTooltip = true;
      };

      const onCircleExit = () => {
        // Delete extra elements
        d3.selectAll('.text-group').remove();
        isShowingTooltip = false;
      }

      this.dataSet = params.listOfTypes;

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
      let isShowingTooltip = false;

      this.svg = d3.select($wrapper[0])
        .append('svg')
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

      this.yAxisGroup = this.svg.append('g')
        .attr('class', 'y-axis')
        .attr('aria-label', `${this.params.a11y.yAxis}${ this.params.yAxisText ? ': ' + this.params.yAxisText : '' }`);

      this.chartText = this.svg.append('text')
        .style('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(params.chartText);

      this.xAxisTitle = this.svg.append('text')
        .style('text-anchor', 'middle')
        .attr('aria-label', `${params.a11y.xAxis}: ${ params.xAxisText || '' }`)
        .attr('class', 'axis-title')
        .text(params.xAxisText);

      this.yAxisTitle = this.svg.append('text')
        .style('transform', 'rotate(270deg)')
        .attr('aria-label', `${params.a11y.yAxis}: ${ params.yAxisText || '' }`)
        .attr('class', 'axis-title')
        .text(params.yAxisText);

      this.lineGroup = this.svg.append('g'); // Used for creating a container for the lines
      this.path = this.lineGroup.selectAll('path')
        .data([this.dataSet])
        .enter()
        .append('path');

      this.dots = this.lineGroup.selectAll('circle')
        .data(this.dataSet, (d) => this.dataSet.indexOf(d))
        .enter()
        .append('circle')
        .attr('r', LineChart.CIRCLE_SIZE)
        .attr('tabindex', 0)
        .attr('focusable', 'true')
        .attr(
          'aria-label',
          (data) => `${params.a11y.yAxis}: ${ this.params.yAxisText ? this.params.yAxisText + ':' : '' } ${ data.value }, ${params.a11y.xAxis}: ${ this.params.xAxisText ? this.params.xAxisText + ':' : '' } ${ data.text }`
        )
        .style('fill', params.lineColorGroup)
        .on('keyup', (d, i) => {
          if (d3.event.key === 'Tab' && isShowingTooltip ) {
            onCircleExit();
          }
          if (d3.event.key === 'Tab' && !isShowingTooltip) {
            onCircleEnter(d, i);
          }
        })
        .on('mouseover', (d, i) => {
          const dot = this.lineGroup.selectAll('circle')[0][i];
          d3.select(dot)
            .transition().duration(LineChart.TRANSITION_DURATION_MS)
            .attr(
              'r', LineChart.CIRCLE_SIZE * LineChart.CIRCLE_HOVER_SIZE_FACTOR
            );
          if (isShowingTooltip) {
            onCircleExit();
          }
          onCircleEnter(d, i);
        })
        .on('mouseout', (d, i) => { // Animates exit animation for hover exit
          const dot = this.lineGroup.selectAll('circle')[0][i];
          d3.select(dot)
            .transition().duration(LineChart.TRANSITION_DURATION_MS)
            .attr('r', LineChart.CIRCLE_SIZE);
          onCircleExit();
        });

      this.line = d3.svg.line();
    }

    /**
     * Fit current bar chart to the size of the wrapper.
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
      const verticalGap = (LineChart.VERTICAL_GAP_FACTOR * fontSize);
      const horizontalGap = verticalGap;

      const chartTitleTextHeight =
        this.chartText[0][0].getBoundingClientRect().height;

      const xAxisTitleTextHeight =
        this.xAxisTitle[0][0].getBoundingClientRect().height;

      const chartTitleHeight = chartTitleTextHeight ?
        verticalGap + chartTitleTextHeight :
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
      this.svg.attr('canvas', `0 0 ${ canvasWidth } ${ canvasHeight }`);

      // Update y scales
      this.yScale.range([graphHeight, 0]);
      this.y.range([graphHeight, 0]);
      this.yAxisGroup.call(
        this.yAxis
          .tickSize(-canvasWidth, 0, 0)
          .ticks(getSmartTicks(d3.max(this.dataSet).value).count)
      );

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
        (chartTitleTextHeight + verticalGap);

      this.xAxisGroup.attr(
        'transform',
        `translate(${ this.translationX + LineChart.Y_AXIS_GROUP_MARGIN }, ${ verticalGap / 2 })`
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
          'y', chartTitleTextHeight + this.yAxisGroupHeight + 3 * verticalGap
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

      const lineXPos = this.translationX + LineChart.Y_AXIS_GROUP_MARGIN;
      this.lineGroup.attr(
        `transform`, `translate(${ lineXPos }, ${ chartTitleTextHeight + verticalGap })`
      );

      // Apply line positions after the scales have changed on resize
      this.line
        .x((d,i) => this.xScale(i))
        .y((d) => this.yScale(d.value));

      // Apply lines after resize
      this.path.attr('class', 'line-path')
        .attr('d', this.line)
        .style('stroke', this.params.lineColorGroup);

      // Move dots according to scale
      this.dots
        .attr('cx', (d,i) => this.xScale(i))
        .attr('cy', (d) => this.yScale(d.value));

      if (!this.firstResizeDone) {
        // Hide ticks from screen readers, the entire rectangle is already labelled
        this.xAxisGroup.selectAll('text').attr('aria-hidden', true);
      }

      this.firstResizeDone = true;
    }
  }

  /** @constant {number} TRANSITION_DURATION_MS Default transition duration in ms. */
  LineChart.TRANSITION_DURATION_MS = 200;

  /** @constant {number} CIRCLE_SIZE Default circle size. */
  LineChart.CIRCLE_SIZE = 7;

  /** @constant {number} CIRCLE_HOVER_SIZE_FACTOR Default circle hover size factor. */
  LineChart.CIRCLE_HOVER_SIZE_FACTOR = 1.25;

  /** @constant {number} CIRCLE_TOOLTIP_OFFSET Default circle tooltip offset. */
  LineChart.CIRCLE_TOOLTIP_OFFSET = 2;

  /** @constant {number} TOOLTIP_SIZE_FACTOR Default tooltip size factor based on text size. */
  LineChart.TOOLTIP_SIZE_FACTOR = 1.5;

  /** @constant {number} Y_AXIS_GROUP_MARGIN Default y axis group margin. */
  LineChart.Y_AXIS_GROUP_MARGIN = 20; // TODO: Rename

  /** @constant {number} VERTICAL_GAP_FACTOR Default vertical gap factor to be multiplied with wrapper font size. */
  LineChart.VERTICAL_GAP_FACTOR = 1.25;

  return LineChart;
})();
