/**
 * @fileoverview VisFlow rendering property mapping module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Property}
 */
visflow.PropertyMapping = function(params) {
  visflow.PropertyMapping.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port({
      node: this,
      id: 'in',
      isInput: true,
      isConstants: false
    }),
    out: new visflow.MultiplePort({
      node: this,
      id: 'out',
      isInput: false,
      isConstants: false
    })
  };

  /**
   * Dimension to be mapped.
   * @protected {number}
   */
  this.dim = 0;

  /** @private {visflow.Select} */
  this.dimSelect_;
  /** @private {visflow.Select} */
  this.mappingSelect_;
  /** @private {visflow.Select} */
  this.panelDimSelect_;
  /** @private {visflow.Select} */
  this.panelMappingSelect_;

  _(this.options).extend({
    // Property to be mapped.
    mapping: 'color',
    // Selected color scale.
    colorScaleId: 'redGreen',
    // Mapping range for number type values.
    numberRange: [0, 1]
  });
};

visflow.utils.inherit(visflow.PropertyMapping, visflow.Property);

/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_CLASS = 'property-mapping';
/** @inheritDoc */
visflow.PropertyMapping.prototype.NODE_NAME = 'Property Mapping';
/** @inheritDoc */
visflow.PropertyMapping.prototype.TEMPLATE =
    './src/property/property-mapping/property-mapping.html';
/** @inheritDoc */
visflow.PropertyMapping.prototype.PANEL_TEMPLATE =
  './src/property/property-mapping/property-mapping-panel.html';

/** @inheritDoc */
visflow.PropertyMapping.prototype.serialize = function() {
  var result = visflow.PropertyMapping.base.serialize.call(this);

  result.dim = this.dim;
  result.mapping = this.mapping;
  result.colorScaleId = this.colorScaleId;
  return result;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.deserialize = function(save) {
  visflow.PropertyMapping.base.deserialize.call(this, save);

  this.dim = save.dim;

  if (this.dim == null) {
    visflow.warning('dim not saved in', this.label);
    this.dim = 0;
  }
  if (this.options.mapping == null) {
    visflow.warning('mapping not saved in', this.label);
    this.options.mapping = 'color';
  }
  if (this.options.colorScaleId == null) {
    visflow.warning('colorScaleId not saved in', this.label);
    this.options.colorScaleId = 'redGreen';
  }
};

/**
 * Shows a user editable scale for color or number.
 * @param {!jQuery} scaleDiv
 * @param {string} source 'panel' or 'node'.
 * @private
 */
visflow.PropertyMapping.prototype.showEditableScale_ = function(scaleDiv,
                                                                source) {
  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];
  scaleDiv.children('*').hide();
  if (mappingType == 'color') {
    var colorDiv = scaleDiv.children('#color').show();
    var colorScaleSelect = new visflow.ColorScaleSelect({
      container: colorDiv,
      selected: this.options.colorScaleId,
      listTitle: scaleDiv.hasClass('source-panel') ? 'Color Scale' : null
    });
    $(colorScaleSelect).on('visflow.change', function(event, scaleId) {
      this.options.colorScaleId = scaleId;
      this.inputChanged(source);
    }.bind(this));
  } else if (mappingType == 'number'){
    var numberDiv = scaleDiv.children('#number').show();
    var min = numberDiv.children('#min');
    var max = numberDiv.children('#max');

    [
      {selector: '#min', index: 0},
      {selector: '#max', index: 1}
    ].forEach(function(info) {
        var input = new visflow.Input({
          container: numberDiv.find(info.selector),
          accept: 'float',
          range: visflow.property.MAPPING_RANGES[this.options.mapping],
          scrollDelta: visflow.property.SCROLL_DELTAS[this.options.mapping],
          value: this.options.numberRange[info.index]
        });
        $(input).on('visflow.change', function(event, value) {
          this.options.numberRange[info.index] = value;
          this.inputChanged(source);
        }.bind(this));
      }, this);
  }
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.initPanel = function(container) {
  this.panelDimSelect_ = new visflow.Select({
    container: container.find('#dim'),
    list: this.getDimensionList(),
    selected: this.dim,
    listTitle: 'Dimension',
    selectTitle: this.ports['in'].pack.data.isEmpty() ?
        this.NO_DATA_STRING : null
  });
  $(this.panelDimSelect_).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged('panel');
  }.bind(this));

  this.panelMappingSelect_ = new visflow.Select({
    container: container.find('#mapping'),
    list: visflow.property.MAPPINGS,
    selected: this.options.mapping,
    listTitle: 'Mapping'
  });
  $(this.panelMappingSelect_).on('visflow.change', function(event, mapping) {
    this.options.mapping = mapping;
    this.showEditableScale_(container.find('#scale'), 'panel');
    this.inputChanged('panel');
  }.bind(this));

  this.showEditableScale_(container.find('#scale'), 'panel');
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.showDetails = function() {
  visflow.PropertyMapping.base.showDetails.call(this); // call parent settings

  this.dimSelect_ = new visflow.Select({
    container: this.content.find('#dim'),
    list: this.getDimensionList(),
    selected: this.dim,
    selectTitle: this.ports['in'].pack.data.isEmpty() ?
      this.NO_DATA_STRING : null
  });
  $(this.dimSelect_).on('visflow.change', function(event, dim) {
    this.dim = dim;
    this.inputChanged('node');
  }.bind(this));

  this.mappingSelect_ = new visflow.Select({
    container: this.content.find('#mapping'),
    list: visflow.property.MAPPINGS,
    selected: this.options.mapping
  });
  $(this.mappingSelect_).on('visflow.change', function(event, mapping) {
    this.options.mapping = mapping;
    this.showEditableScale_(this.content.find('#scale'), 'node');
    this.inputChanged('node');
  }.bind(this));

  this.showEditableScale_(this.content.find('#scale'), 'node');
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.process = function() {
  var inpack = this.ports['in'].pack;
  var outpack = this.ports['out'].pack;
  var items = inpack.items;
  var data = inpack.data;
  outpack.copy(inpack);

  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];

  var dataScale = visflow.utils.getScale(data, this.dim, items, [0, 1]).scale;
  var propScale;
  if (mappingType == 'color') {
    propScale = visflow.scales[this.options.colorScaleId].scale;
  } else if (mappingType == 'number') {
    propScale = d3.scale.linear()
      .domain([0, 1])
      .range(this.options.numberRange);
  }

  var newitems = {};
  for (var index in inpack.items) {
    var value = data.values[index][this.dim];
    var prop = {};
    prop[this.options.mapping] = propScale(dataScale(value));
    newitems[index] = {
      properties: _.extend({}, inpack.items[index].properties, prop)
    };
  }
  // Cannot reuse old items.
  outpack.items = newitems;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.adjustNumbers = function() {
  var adjusted = false;
  var mappingType = visflow.property.MAPPING_TYPES[this.options.mapping];
  if (mappingType == 'number') {
    //
    var range = visflow.property.MAPPING_RANGES[this.options.mapping];
    if (this.options.numberRange[0] < range[0]) {
      this.options.numberRange[0] = range[0];
      adjusted = true;
    }
    if (this.options.numberRange[1] > range[1]) {
      this.options.numberRange[1] = range[1];
      adjusted = true;
    }
  }
  return adjusted;
};

/** @inheritDoc */
visflow.PropertyMapping.prototype.inputChanged = function(source) {
  var adjusted = this.adjustNumbers();
  this.process();
  this.pushflow();
  // If number range is adjusted, we need to redraw both node and panel as the
  // inputs may be out-of-date.
  if (adjusted || source == 'panel') {
    this.show();
  }
  if (adjusted || source == 'node') {
    this.updatePanel(visflow.optionPanel.contentContainer());
  }
};
