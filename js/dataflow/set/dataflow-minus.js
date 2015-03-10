
"use strict";

var extObject = {

  initialize: function(para) {
    DataflowSet.initialize.call(this, para);

    this.inPorts = [
      DataflowPort.new(this, "ina", "in-single"),
      DataflowPort.new(this, "inb", "in-single")
    ];
    this.outPorts = [
      DataflowPort.new(this, "out", "out-multiple")
    ];
    this.prepare();
  },

  show: function() {

    DataflowSet.show.call(this); // call parent settings

    this.jqicon = $("<div></div>")
      .addClass("dataflow-minus-icon")
      .appendTo(this.jqview);
  }

};

var DataflowMinus = DataflowSet.extend(extObject);