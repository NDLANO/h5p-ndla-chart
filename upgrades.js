var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.Chart'] = (function () {
  return {
    1: {

      /**
       * Upgrades old background selector values to work with new
       * background selector
       *
       * @params {Object} parameters
       * @params {function} finished
       */
      1: function (parameters, finished) {
        parameters.listOfTypes.forEach(function (type) {
          type.color = '#' + type.color;
          type.fontColor = '#' + type.fontColor;
        });

        finished(null, parameters);
      },
      /**
       * Move `figureDefinition` to new a11y object.
       * @param {object} parameters Content parameters.
       * @param {function} finished Callback when finished.
       * @param {object} extras Extra parameters such as metadata, etc.
       */
      3: function (parameters, finished, extras) {
        if (parameters) {
          parameters.a11y = {
            figureDefinition: parameters.figureDefinition || 'Chart'
          };

          delete parameters.figureDefinition;
        }

        finished(null, parameters, extras);
      }
    }
  };
})();
