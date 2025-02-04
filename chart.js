/*global H5P*/

/**
 * Graph Cake module
 * @external {jQuery} $ H5P.jQuery
 * @external {EventDispatcher} EventDispatcher H5P.EventDispatcher
 */
H5P.Chart = (function ($, EventDispatcher) {

  /**
   * Initialize module.
   *
   * @class
   * @param {Object} params Behavior settings
   * @param {Number} id Content identification
   */
  function Chart(params) {
    var self = this;

    // Inheritance
    EventDispatcher.call(self);

    // Set params and filter data set to make sure it's valid
    self.params = params;
    if (self.params.listOfTypes) {
      Chart.filterData(self.params.listOfTypes);
    }
    else {
      self.params.listOfTypes = [];
    }

    // Add example/default behavior
    if (!self.params.listOfTypes.length) {
      self.params.listOfTypes = [
        {
          text: 'Cat',
          value: 4,
          color: '#fbb033',
          fontColor: '#000'
        },
        {
          text: 'Dog',
          value: 2,
          color: '#ADD8E6',
          fontColor: '#000'
        },
        {
          text: 'Mouse',
          value: 3,
          color: '#90EE90',
          fontColor: '#000'
        }
      ];
    }

    const div = document.createElement('div');
    div.innerHTML = self.params.a11y.title;
    text = div.textContent || div.innerText || '';

    /**
     * Decode HTML entities. Not to be used for text that will be inserted into the DOM as HTML, may contain scripts!
     * @param {string} text Text to be decoded.
     * @returns {string} Decoded text.
     */
    const htmlDecode = (text = '') => {
      const div = document.createElement('div');
      div.innerHTML = text;
      return div.textContent || div.innerText || '';
    };

    // Set the figure definition for screen readers if it doesn't exist
    self.params.a11y = self.params.a11y || {};
    self.params.a11y.figureDefinition = self.params.a11y.figureDefinition ?? 'Chart';
    self.params.a11y.lineChart = self.params.a11y.lineChart ?? 'Line chart';
    self.params.a11y.title = self.params.a11y.title ?? 'Title';
    self.params.a11y.xAxis = self.params.a11y.xAxis ?? 'X axis';
    self.params.a11y.yAxis = self.params.a11y.yAxis ?? 'Y axis';

    Object.keys(self.params.a11y).forEach(key => {
      self.params.a11y[key] = htmlDecode(self.params.a11y[key]);
    });

    // Keep track of type.
    self.type = getChartType(self.params.graphMode);
  }

  function getChartType(graphMode) {
    switch (graphMode) {
      case 'pieChart':
        return 'Pie';

      case 'barChart':
        return 'Bar';

      case 'extendedBarChart':
        return 'ExtendedBar';

        case 'lineChart':
        return 'Line';

      default:
        return 'Pie';
    }
  }
  // Inheritance
  Chart.prototype = Object.create(EventDispatcher.prototype);
  Chart.prototype.constructor = Chart;

  /**
   * Make sure the data set has set the required text and value properties.
   *
   * @param {Array} dataSet
   */
  Chart.filterData = function (dataSet) {
    // Cycle through data set
    for (var i = 0; i < dataSet.length; i++) {
      var row = dataSet[i];
      if (row.text === undefined || row.value === undefined) {
        // Remove invalid data
        dataSet.splice(i, 1);
        i--;
        continue;
      }

      row.text = this.htmlDecode(row.text.trim());
      row.value = parseFloat(row.value);
      if (row.text === '' || isNaN(row.value)) {
        // Remove invalid data
        dataSet.splice(i, 1);
        i--;
        continue;
      }
    }
  };

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  Chart.htmlDecode = function (input) {
    const dparser = new DOMParser().parseFromString(input, 'text/html');
    const div = document.createElement('div');
    div.innerHTML = dparser.documentElement.textContent;

    return div.textContent || div.innerText || '';
  }

  /**
   * Append field to wrapper.
   *
   * @param {H5P.jQuery} $container
   */
  Chart.prototype.attach = function ($container) {
    var self = this;

    // Create chart on first attach
    if (self.$wrapper === undefined) {
      self.$wrapper = $('<div/>', {
        'class': 'h5p-chart-chart h5p-chart-' + self.type.toLowerCase()
      });
      self.chart = new H5P.Chart[self.type + 'Chart'](self.params, self.$wrapper);
    }

    // Prepare container
    self.$container = $container.html('').addClass('h5p-chart').append(self.$wrapper);

    const $defgroup = $('<div/>', {
      'class': 'hidden-but-read',
      'html': self.params.a11y.figureDefinition,
    });

    // Add aria-labels for the data
    self.params.listOfTypes.forEach(function(type) {
      var ariaLabel = $('<div/>', {
        'class': 'hidden-but-read',
        'html': type.text + ': ' + type.value + ''
      });
      $defgroup.append(ariaLabel);
    });

    self.$container.append($defgroup);

    // Handle resizing
    self.on('resize', function () {
      if (!self.$container.is(':visible')) {
        return; // Only handle if visible
      }
      // Resize existing chart
      self.chart.resize();
    });
  };

  return Chart;
})(H5P.jQuery, H5P.EventDispatcher);
