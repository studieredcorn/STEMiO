var EventEmitter = require('events').EventEmitter;
var d3 = require('d3');

// D3Toggly is a pseudo-class used by the Toggly component (toggly.component.js)
// of the stemio React client that serves as a wrapper for all its d3 functionality.
// d3 is used to represent all the stemio system data as SVG elements, as well as to
// attach event listeners to DOM elements and handle events. d3 is also used to
// provide the "force layout", which controls the x and y coordinates of our blobs
// (representing stemio "stocks") based on simulating them as two-dimensional point
// particles subject to various "forces" modeled by the natural world

// The React component Toggly communicates with D3Toggly by invoking update()
// whenever it updates its state. On the other hand, D3Toggly communicates back
// with Toggly by creating an event emitter (called dispatcher), providing Toggly
// with a reference to it (which Toggly, in turn, stores as the local variable
// dispatcher), and dispatching appropriate messages whenever a d3-attached DOM
// event listener sends an event.

function D3Toggly(node, state, width, height) {
  // The pseudo-class is passed a state object from Toggly:
  // state = { data,      (data contained within the current view)
  //   hoveredObjects,    (an array containing references to the "hovered" objects)
  //   clickedObjects,    (an array containing references to the selected objects)
  //   tempSourceBlob,    (a reference to the blob selected as a source to a
  //                        prospective link)
  //   tempTargetBlob,    (a reference to the blob selected as a target to a
  //                        prospective link)
  //   drawExternals }    (a boolean specifying whether to draw external blobs;
  //                        i.e. sources and sinks)


  // It is also passed a width and height for our SVG element that functions as a
  // "window" for all our graphics and contains them. (See below comment.)

  // The width and height here are really only used to establish a particular
  // aspect ratio; CSS styles the SVG element classed "svg-content-responsive",
  // which will contain all other SVG elements, to rescale everything to take up
  // the page's available screen width.
  this.width = width;
  this.height = height;

  this.dispatcher = new EventEmitter();
  this.node = node; // a handle to the DOM element classed "toggly" containing
                    // everything that d3 deals with

  this.blobs = [];  // local arrays containing references to the current view's
  this.links = [];  // blobs and links

  this.properBlobs = []; // local array containing references to the current
                         // view's blobs that are not external blobs (i.e.
                         // sources and sinks) or orphans
  this.circleBlobs = []; // local array containing references to the current
                         // view's circle blobs
  this.squareBlobs = []; // local array containing references to the current
                         // view's square blobs
  this.sourceBlobs = []; // local array containing references to the current
  this.sinkBlobs = [];   // view's "source" blobs, "sink" blobs, and "orphan"
  this.orphanBlobs = []; // blobs, respectively

  this.solidLinks = [];  // local array containing references to the current
  this.dashedLinks = []; // view's solid and dashed links, respectively

  this.headingText = ""; // the text displayed as the current view's heading
                         // (this is the name of a blob's subsystem)

  this.hoveredBlobs = []; // local arrays containing references to the
  this.hoveredLinks = []; // "hovered" blobs, "hovered" links, selected blobs,
  this.clickedBlobs = []; // and selected links, respectively
  this.clickedLinks = [];

  this.drawExternals = false; // Toggly passes this to specify whether or not
                              // sources and sinks get displayed


  this.getDispatcher = togglyGetDispatcher.bind(this);
  this.update = togglyUpdate.bind(this);

  this._drawSVG = togglyDrawSVG.bind(this);

  this._ticked = togglyTicked.bind(this);

  this._parseData = togglyParseData.bind(this);

  this._drawNodesLinks = togglyDrawNodesLinks.bind(this);
  this._drawSelection = togglyDrawSelection.bind(this);
  this._drawText = togglyDrawText.bind(this);
  this._drawExternals = togglyDrawExternals.bind(this);


  // a listener is attached to <body> that listens for keyboard events and
  // sends a message to Toggly whenever certain keys are pressed
  d3.select("body").on("keydown", (function() {
        if (d3.event.target.tagName === "BODY") {
          if (d3.event.key === "Backspace") {
            this.dispatcher.emit("deletekey");
          }
          if (d3.event.key === "Escape") {
            this.dispatcher.emit("escapekey");
          }
          if (d3.event.key === "ArrowUp") {
            this.dispatcher.emit("arrowupkey");
          }
        }
      }).bind(this));

  // this function sets up the SVG element that contains all other SVG elements
  this._drawSVG();

  // the force simulation is created and listened to for changes (it emits a "tick"
  // event whenever blob coordinates are updated by the simulation)
  this.simulation = d3.forceSimulation(this.blobs)
    .force("collision", d3.forceCollide(30).strength(0.1))
    .force("gravity", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(this.width / 2, this.height / 2))
    .on("tick", this._ticked);

  // all our local variables are initialized based on data passed by Toggly
  this.update(state, true);
};

function togglyDrawSVG() {
  // Here we set up our SVG "window" element that contains all our SVG elements.
  var svg = d3.select(this.node)
    .classed("toggly-component__display__d3-display", true)
    .append("svg")
    .attr("viewBox", "0 0 " + this.width + " " + this.height)
    .classed("toggly-component__display__d3-display__svg-window", true);

  // This defines the arrowhead used by "link" SVG elements
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("markerWidth", 5)
    .attr("markerHeight", 3.5)
    .attr("refX", 4)
    .attr("refY", 1.75)
    .attr("orient", "auto")
    .append("polygon")
    .attr("points", "0 0, 5 1.75, 0 3.5")
    .attr("fill", "gray");

  // Creating an element to contain blob elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs", true);

  // Creating an element to contain link elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-links", true);

  // Creating an element to contain blob caption elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-blob-texts", true);

  // Creating an element to contain link caption elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-link-texts", true);

  // Creating an element to contain heading text elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-heading-texts", true);

  // Creating an element to contain external blob elements
  svg.append("g")
    .classed("toggly-component__display__d3-display__svg-window__d3-externals", true);

  // This listener listens for clicks and determines where the most recent
  // one originated. If with the container "window" SVG element, then we
  // know the user clicked outside of any other element, so we send that
  // information to Toggly (e.g. to deselect whatever was selected, etc.)
  svg.on("click", (function(d) {
        var content = d3.select(this.node).select("svg");
        var inside = content.filter(function(d, i, nodes) {
            return (this === d3.event.target);
          }).empty();

        if (!inside) {
          this.dispatcher.emit("outsideclick", d);
        }
      }).bind(this) );
};

function togglyGetDispatcher() {
  return this.dispatcher;
};

function togglyTicked(e) {
  // This is the callback function given to our "tick" force layout event
  // listener. It calls togglyUpdate() to redraw all of our SVG elements.
  this.update(null, false);
};

function togglyDrawNodesLinks() {
  // This is a function that uses d3 to bind our node and link arrays to SVG
  // elements, and to attach event handlers to them and process them.

  // Event handler for whenever our SVG element has the "dragged" event (this
  // event is calculated/emitted by d3, and not by the DOM element itself.)
  function blobDragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
  };

  var d3_circleBlobs = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blobs").selectAll(".toggly-component__display__d3-display__svg-window__d3-blobs__d3-circle-blob")
    .data(this.circleBlobs);
  d3_circleBlobs.attr("id", function(d) {
      return d.id;
    })
    .attr("r", function(d) {
        return d.r;
      })
    .attr("cx", (function(d) {
        return d.x = Math.max(d.r, Math.min(this.width - d.r, d.x));  // making sure our
                                                                      // blob elements
                                                                      // cannot leave the
                                                                      // window
      }).bind(this))
    .attr("cy", (function(d) {
        return d.y = Math.max(d.r, Math.min(this.height - d.r, d.y)); // see above comment
      }).bind(this))
    .attr("stroke", null)
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs_clicked", false);
  d3_circleBlobs.enter()
    .append("circle")
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs__d3-circle-blob", true)
    .attr("id", function(d) {
        return d.id;
      } )
    .attr("r", function(d) {
        return d.r;
      } )
    .attr("cx", function(d) {
        return d.x;
      })
    .attr("cy", function(d) {
        return d.y;
      })
    .call(d3.drag()
      .on("drag", blobDragged))
    .on("mouseover", (function(d) {
        this.dispatcher.emit("blob:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("blob:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("blob:click", d);
      }).bind(this) )
    .on("dblclick", (function(d) {
        this.dispatcher.emit("blob:dblclick", d);
      }).bind(this) );
  d3_circleBlobs.exit().remove();

  var d3_squareBlobs = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blobs").selectAll(".toggly-component__display__d3-display__svg-window__d3-blobs__d3-square-blob")
    .data(this.squareBlobs);
  d3_squareBlobs.attr("id", function(d) {
      return d.id;
    })
    .attr("width", function(d) {
        return (d.r * 2);
      })
    .attr("height", function(d) {
        return (d.r * 2);
      })
    .attr("x", (function(d) {
        return d.x = Math.max(0, Math.min(this.width - (2 * d.r), d.x));  // making sure our
                                                                      // blob elements
                                                                      // cannot leave the
                                                                      // window
      }).bind(this))
    .attr("y", (function(d) {
        return d.y = Math.max(0, Math.min(this.height - (2 * d.r), d.y)); // see above comment
      }).bind(this))
    .attr("rx", function(d) {
        return 3;
      })
    .attr("ry", function(d) {
        return 3;
      })
    .attr("stroke", null)
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs_clicked", false);
  d3_squareBlobs.enter()
    .append("rect")
    .classed("toggly-component__display__d3-display__svg-window__d3-blobs__d3-square-blob", true)
    .attr("id", function(d) {
        return d.id;
      } )
    .attr("width", function(d) {
        return (d.r * 2);
      } )
    .attr("height", function(d) {
        return (d.r * 2);
      } )
    .attr("x", function(d) {
        return d.x;
      })
    .attr("y", function(d) {
        return d.y;
      })
    .attr("rx", function(d) {
        return 3;
      })
    .attr("ry", function(d) {
        return 3;
      })
    .call(d3.drag()
      .on("drag", blobDragged))
    .on("mouseover", (function(d) {
        this.dispatcher.emit("blob:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("blob:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("blob:click", d);
      }).bind(this) )
    .on("dblclick", (function(d) {
        this.dispatcher.emit("blob:dblclick", d);
      }).bind(this) );
  d3_squareBlobs.exit().remove();


  var d3_solidLinks = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-links").selectAll(".toggly-component__display__d3-display__svg-window__d3-links__d3-solid-link")
    .data(this.solidLinks);
  d3_solidLinks.attr("id", function(d) {
        return d.id;
      })
    .attr("d", function(d) {
        // All this "adjusted" stuff is because the center of our square DOM elements does
        // not correspond to the d3 simulation node coordinates (instead, the top left
        // corner does)
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        // The complicated math is to build the links' curves
        var radius = (4*Math.sqrt(Math.pow((d.target.x - d.source.x), 2) + Math.pow((d.target.y - d.source.y), 2)))/(d.linknum + 4);
        return ("M" + xAdjustedSource + "," + yAdjustedSource
          + "A" + radius + "," + radius + " 0 0,1 "  + (xAdjustedTarget) + "," + (yAdjustedTarget));
      })
    .classed("toggly-component__display__d3-display__svg-window__d3-links_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-links_clicked", false);
  d3_solidLinks.enter()
    .append("path")
    .classed("toggly-component__display__d3-display__svg-window__d3-links__d3-solid-link", true)
    .attr("id", function(d) {
        return d.id;
      } )
    .attr("d", function(d) {
        // All this "adjusted" stuff is because the center of our square DOM elements does
        // not correspond to the d3 simulation node coordinates (instead, the top left
        // corner does)
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        // The complicated math is to build the links' curves
        var radius = (4*Math.sqrt(Math.pow((d.target.x - d.source.x), 2) + Math.pow((d.target.y - d.source.y), 2)))/(d.linknum + 4);
        return ("M" + xAdjustedSource + "," + yAdjustedSource
          + "A" + radius + "," + radius + " 0 0,1 "  + (xAdjustedTarget) + "," + (yAdjustedTarget));
      })
    .attr("marker-end", "url(#arrowhead)")
    .on("mouseover", (function(d) {
        this.dispatcher.emit("link:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("link:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("link:click", d);
      }).bind(this) );
  d3_solidLinks.exit().remove();

  var d3_dashedLinks = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-links").selectAll(".toggly-component__display__d3-display__svg-window__d3-links__d3-dashed-link")
    .data(this.dashedLinks);
  d3_dashedLinks.attr("id", function(d) {
        return d.id;
      })
    .attr("d", function(d) {
        // All this "adjusted" stuff is because the center of our square DOM elements does
        // not correspond to the d3 simulation node coordinates (instead, the top left
        // corner does)
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        var radius = (4*Math.sqrt(Math.pow((d.target.x - d.source.x), 2) + Math.pow((d.target.y - d.source.y), 2)))/(d.linknum + 4);
        return ("M" + xAdjustedSource + "," + yAdjustedSource
          + "A" + radius + "," + radius + " 0 0,1 "  + (xAdjustedTarget) + "," + (yAdjustedTarget));
      })
    .classed("toggly-component__display__d3-display__svg-window__d3-links_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-links_clicked", false);
  d3_dashedLinks.enter()
    .append("path")
    .classed("toggly-component__display__d3-display__svg-window__d3-links__d3-dashed-link", true)
    .attr("id", function(d) {
        return d.id;
      })
    .attr("d", function(d) {
        // All this "adjusted" stuff is because the center of our square DOM elements does
        // not correspond to the d3 simulation node coordinates (instead, the top left
        // corner does)
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        var radius = (4*Math.sqrt(Math.pow((d.target.x - d.source.x), 2) + Math.pow((d.target.y - d.source.y), 2)))/(d.linknum + 4);
        return ("M" + xAdjustedSource + "," + yAdjustedSource
          + "A" + radius + "," + radius + " 0 0,1 "  + (xAdjustedTarget) + "," + (yAdjustedTarget));
      })
    .attr("marker-end", "url(#arrowhead)")
    .on("mouseover", (function(d) {
        this.dispatcher.emit("link:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("link:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("link:click", d);
      }).bind(this) );
  d3_dashedLinks.exit().remove();
};

function togglyDrawSelection() {
  // Selects SVG elements based on the id of the elements in clickedBlobs
  // and clickedLinks, and alters them appropriately to be displayed as
  // selected.

  var g1 = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blobs");
  var g2 = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-externals");
  for(var i = 0; i < this.hoveredBlobs.length; i++) {
    g1.select("#" + this.hoveredBlobs[i].id)
      .classed("toggly-component__display__d3-display__svg-window__d3-blobs_hovered", true);
    g2.select("#" + this.hoveredBlobs[i].id + "h")
      .classed("toggly-component__display__d3-display__svg-window__d3-externals_hovered", true);
  }
  for(i = 0; i < this.clickedBlobs.length; i++) {
    g1.select("#" + this.clickedBlobs[i].id)
      .classed("toggly-component__display__d3-display__svg-window__d3-blobs_clicked", true);
    g2.select("#" + this.clickedBlobs[i].id + "h")
      .classed("toggly-component__display__d3-display__svg-window__d3-externals_clicked", true);
  }

  var g = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-links");
  for(i = 0; i < this.hoveredLinks.length; i++) {
    g.select("#" + this.hoveredLinks[i].id)
      .classed("toggly-component__display__d3-display__svg-window__d3-links_hovered", true);
  }
  for(i = 0; i < this.clickedLinks.length; i++) {
    g.select("#" + this.clickedLinks[i].id)
      .classed("toggly-component__display__d3-display__svg-window__d3-links_clicked", true);
  }
};

function togglyDrawText() {
  // This is a function that uses d3 to bind our node and link arrays to SVG
  // text elements to display the captions (stored in the bound data's "text"
  // property). Note that here we use the "ordinal" property to determine an
  // element's position in the array. (This was set when the object was pushed
  // in togglyParseData(), but that is ok because we never directly splice or
  // pop the arrays.)

  var d3_heading = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-heading-texts").selectAll(".toggly-component__display__d3-display__svg-window__d3-heading-texts__d3-heading")
    .data([this.headingText]);
  d3_heading.text([this.headingText]);
  d3_heading.enter()
    .append("text")
    .classed("toggly-component__display__d3-display__svg-window__d3-heading-texts__d3-heading", true)
    .attr("x", 0)
    .attr("y", 20)
    .text([this.headingText]);
  d3_heading.exit().remove();

  var d3_sourceTexts = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts").selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-source-text")
    .data(this.sourceBlobs);
  d3_sourceTexts.text( function(d) {
      return d.text;
    })
    .attr("x", (function(d) {
        return ((this.width / (this.sourceBlobs.length + 1)) * (d.ordinal + 1));
      }).bind(this) );
  d3_sourceTexts.enter()
    .append("text")
    .classed("toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-source-text", true)
    .attr("x", (function (d) {
        return ((this.width / (this.sourceBlobs.length + 1)) * (d.ordinal + 1));
      }).bind(this) )
    .attr("y", this.height - 2)
    .text( function(d) {
        return d.text;
      });
  d3_sourceTexts.exit().remove();

  var d3_sinkTexts = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts").selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-sink-text")
    .data(this.sinkBlobs);
  d3_sinkTexts.text( function(d) {
      return d.text;
    })
    .attr("x", (function(d) {
        return ((this.width / (this.sinkBlobs.length + 1)) * (d.ordinal + 1));
      }).bind(this) );
  d3_sinkTexts.enter()
    .append("text")
    .classed("toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-sink-text", true)
    .attr("x", (function (d) {
        return ((this.width / (this.sinkBlobs.length + 1)) * (d.ordinal + 1));
      }).bind(this) )
    .attr("y", 9)
    .text( function(d) {
        return d.text;
      });
  d3_sinkTexts.exit().remove();


  var d3_linkTexts = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-link-texts").selectAll(".toggly-component__display__d3-display__svg-window__d3-link-texts__d3-link-text")
    .data(this.links);
  d3_linkTexts.classed("toggly-component__display__d3-display__svg-window__d3-link-texts__d3-link-text_haslink", function(d) {
        return (d.wikiref !== null);
      })
    // The following impossible-to-follow shenanigans exist because of our links' curves
    // Again, all this "adjusted" stuff is because the center of our square DOM elements does
    // not correspond to the d3 simulation node coordinates (instead, the top left
    // corner does)
    .attr("x", function(d) {
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        if (yAdjustedSource > yAdjustedTarget) {
          return (xAdjustedSource + xAdjustedTarget)/2 - ((xAdjustedTarget - xAdjustedSource)/(Math.max((-d.linknum + 6), 2)))*Math.tan(Math.PI/2 + Math.atan((xAdjustedTarget - xAdjustedSource)/(yAdjustedTarget - yAdjustedSource))) - (d.linknum - 1)*(24)*(-Math.PI/4 + Math.abs(Math.atan((xAdjustedTarget - xAdjustedSource)/(yAdjustedTarget - yAdjustedSource))))*(2/Math.PI);
        } else {
          return (xAdjustedSource + xAdjustedTarget)/2 - ((xAdjustedTarget - xAdjustedSource)/(Math.max((-d.linknum + 6), 2)))*Math.tan(Math.PI/2 + Math.atan((xAdjustedTarget - xAdjustedSource)/(yAdjustedTarget - yAdjustedSource))) - (d.linknum - 1)*(24)*(Math.PI/4 - Math.abs(Math.atan((xAdjustedTarget - xAdjustedSource)/(yAdjustedTarget - yAdjustedSource))))*(2/Math.PI);
        }
      })
    .attr("y", function(d) {
        var xAdjustedSource, xAdjustedTarget, yAdjustedSource, yAdjustedTarget = 0;

        if ((d.source.type === "circle") || (d.source.type === "source") || (d.source.type === "orphan")) {
          xAdjustedSource = d.source.x;
          yAdjustedSource = d.source.y;
        } else if (d.source.type === "square") {
          xAdjustedSource = d.source.x + d.source.r;
          yAdjustedSource = d.source.y + d.source.r;
        }

        if ((d.target.type === "circle") || (d.target.type === "sink") || (d.target.type === "orphan")) {
          xAdjustedTarget = d.target.x;
          yAdjustedTarget = d.target.y;
        } else if (d.target.type === "square") {
          xAdjustedTarget = d.target.x + d.target.r;
          yAdjustedTarget = d.target.y + d.target.r;
        }

        var finalAdjustment = 0;
        if (xAdjustedSource > xAdjustedTarget) {
          finalAdjustment = -Math.abs(xAdjustedTarget - xAdjustedSource)/18;
        } else {
          finalAdjustment = Math.abs(xAdjustedTarget - xAdjustedSource)/20;
        }

        if (yAdjustedSource > yAdjustedTarget) {
          return (yAdjustedSource + yAdjustedTarget)/2 + ((yAdjustedTarget - yAdjustedSource)/(Math.max((-d.linknum + 6), 2)))*Math.tan(Math.PI/2 + Math.atan((yAdjustedTarget - yAdjustedSource)/(xAdjustedTarget - xAdjustedSource))) + (d.linknum)*(8)*(-Math.PI/2 + Math.atan((yAdjustedTarget - yAdjustedSource)/(xAdjustedTarget - xAdjustedSource)))*(2/Math.PI) + (d.linknum * 8) + finalAdjustment;
        } else {
          return (yAdjustedSource + yAdjustedTarget)/2 + ((yAdjustedTarget - yAdjustedSource)/(Math.max((-d.linknum + 6), 2)))*Math.tan(Math.PI/2 + Math.atan((yAdjustedTarget - yAdjustedSource)/(xAdjustedTarget - xAdjustedSource))) + (d.linknum)*(8)*(+Math.PI/2 - Math.atan((yAdjustedTarget - yAdjustedSource)/(xAdjustedTarget - xAdjustedSource)))*(2/Math.PI) - (d.linknum * 8) + finalAdjustment;
        }
      })
    .text(function(d) {
        return d.text;
      })
    .on("click", function(d) {
        if (d.wikiref !== null) {
          window.open("/wiki/" + d.wikiref, "_blank");
        }
      });
  d3_linkTexts.enter()
    .append("text")
    .classed("toggly-component__display__d3-display__svg-window__d3-link-texts__d3-link-text", true)
    .classed("toggly-component__display__d3-display__svg-window__d3-link-texts__d3-link-text_haslink", function(d) {
        return (d.wikiref !== null);
      })
    .attr("x", function(d) {
        return (d.source.x + d.target.x)/2 + (d.target.x - d.source.x)/4 - (d.target.x - d.source.x)/(d.linknum + 4);
      })
    .attr("y", function(d) {
        return (d.source.y + d.target.y)/2 - (d.target.y - d.source.y)/4 + (d.target.y - d.source.y)/(d.linknum + 4);
      })
    .text(function(d) {
        return d.text;
      })
    .on("click", function(d) {
        if (d.wikiref !== null) {
          window.open("/wiki/" + d.wikiref, "_blank");
        }
      });
  d3_linkTexts.exit().remove();


  var d3_blobTexts = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts").selectAll(".toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-blob-text")
    .data(this.properBlobs);
  d3_blobTexts.classed("toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-blob-text_haslink", function(d) {
        return (d.wikiref !== null);
      })
    .attr("x", function(d) {
        if (d.type === "circle") {
          return d.x;
        } else if (d.type === "square") {
          return d.x + d.r;
        } else {
          return 0;
        }
      })
    .attr("y", function(d) {
        if (d.type === "circle") {
          return d.y - d.r - 2;
        } else if (d.type === "square") {
          return d.y - 2;
        } else {
          return 0;
        }
      })
    .text(function(d) {
        return d.text;
      })
    .on("click", function(d) {
        if (d.wikiref !== null) {
          window.open("/wiki/" + d.wikiref, "_blank");
        }
      });
  d3_blobTexts.enter()
    .append("text")
    .classed("toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-blob-text", true)
    .classed("toggly-component__display__d3-display__svg-window__d3-blob-texts__d3-blob-text_haslink", function(d) {
        return (d.wikiref !== null);
      })
    .attr("x", function(d) {
        if (d.type === "circle") {
          return d.x;
        } else if (d.type === "square") {
          return d.x + d.r;
        } else {
          return 0;
        }
      })
    .attr("y", function(d) {
        if (d.type === "circle") {
          return d.y - d.r - 2;
        } else if (d.type === "square") {
          return d.y - 2;
        } else {
          return 0;
        }
      })
    .text(function(d) {
        return d.text;
      })
    .on("click", function(d) {
        if (d.wikiref !== null) {
          window.open("/wiki/" + d.wikiref, "_blank");
        }
      });
  d3_blobTexts.exit().remove();

};

function togglyDrawExternals() {
  // This is a function that uses d3 to bind our sourceBlob and targetBlob
  // arrays to SVG elements, and to attach event handlers to them and
  // process them. Note that here we use the "ordinal" property to determine an
  // element's position in the array. (This was set when the object was pushed
  // in togglyParseData(), but that is ok because we never directly splice or
  // pop the arrays.)


  var sourceBlobs = [];
  var sinkBlobs = [];
  if (this.drawExternals === true) {
    sourceBlobs = this.sourceBlobs;
    sinkBlobs = this.sinkBlobs;
  }

  var d3_sourceBlobs = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-externals").selectAll(".toggly-component__display__d3-display__svg-window__d3-externals__d3-source-blob")
    .data(sourceBlobs);
  d3_sourceBlobs.classed("toggly-component__display__d3-display__svg-window__d3-externals_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-externals_clicked", false);
  d3_sourceBlobs.enter()
    .append("rect")
    .classed("toggly-component__display__d3-display__svg-window__d3-externals__d3-source-blob", true)
    .attr("id", function(d) {
        return d.id + "h";
      })
    .attr("x", (function(d) {
        return (this.width / this.sourceBlobs.length) * d.ordinal;
      }).bind(this) )
    .attr("width", (function(d) {
        return (this.width / this.sourceBlobs.length);
      }).bind(this) )
    .attr("y", this.height - 10)
    .attr("height", 10)
    .on("mouseover", (function(d) {
        this.dispatcher.emit("blob:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("blob:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("blob:click", d);
      }).bind(this) )
  d3_sourceBlobs.exit().remove();

  var d3_sinkBlobs = d3.select(this.node).selectAll(".toggly-component__display__d3-display__svg-window__d3-externals").selectAll(".toggly-component__display__d3-display__svg-window__d3-externals__d3-sink-blob")
    .data(sinkBlobs);
  d3_sinkBlobs.classed("toggly-component__display__d3-display__svg-window__d3-externals_hovered", false)
    .classed("toggly-component__display__d3-display__svg-window__d3-externals_clicked", false);
  d3_sinkBlobs.enter()
    .append("rect")
    .classed("toggly-component__display__d3-display__svg-window__d3-externals__d3-sink-blob", true)
    .attr("id", function(d) {
        return d.id + "h";
      })
    .attr("x", (function(d) {
        return (this.width / this.sinkBlobs.length) * d.ordinal;
      }).bind(this) )
    .attr("width", (function(d) {
        return (this.width / this.sinkBlobs.length);
      }).bind(this) )
    .attr("y", 0)
    .attr("height", 10)
    .on("mouseover", (function(d) {
        this.dispatcher.emit("blob:mouseover", d);
      }).bind(this) )
    .on("mouseout", (function(d) {
        this.dispatcher.emit("blob:mouseout", d);
      }).bind(this) )
    .on("click", (function(d) {
        this.dispatcher.emit("blob:click", d);
      }).bind(this) )
  d3_sinkBlobs.exit().remove();
};

function togglyParseData(state) {
  // Here we set our local data based on data passed to us from Toggly in
  // state. (See comment on the class constuctor for structure of the state
  // object.) We first initialize some local arrays and populate them as
  // necessary.

  var newBlobs = [];
  var newLinks = [];

  var newHoveredBlobs = [];
  var newHoveredLinks = [];
  var newClickedBlobs = [];
  var newClickedLinks = [];

  var newProperBlobs = [];
  var newCircleBlobs = [];
  var newSquareBlobs = [];
  var newSourceBlobs = [];
  var newSinkBlobs = [];
  var newOrphanBlobs = [];

  var newSolidLinks = [];
  var newDashedLinks = [];

  var newHeadingText = "";

  var newDrawExternals = false;

  var i;
  if (state.hoveredObjects !== undefined) {
    for (i = 0; i < state.hoveredObjects.length; i++) {
      if ((state.hoveredObjects[i].type === "solid") || (state.hoveredObjects[i].type === "dashed")) {
        newHoveredLinks.push(state.hoveredObjects[i]);
      } else {
        newHoveredBlobs.push(state.hoveredObjects[i]);
      }
    }
  }
  if (state.clickedObjects !== undefined) {
    for (i = 0; i < state.clickedObjects.length; i++) {
      if ((state.clickedObjects[i].type === "solid") || (state.clickedObjects[i].type === "dashed")) {
        newClickedLinks.push(state.clickedObjects[i]);
      } else {
        newClickedBlobs.push(state.clickedObjects[i]);
      }
    }
  }

  if (state.drawExternals !== undefined) {
    newDrawExternals = state.drawExternals;
  }

  if ((state.data !== null) && (state.data !== undefined)) {
    if ((state.data.text !== undefined) && (state.data.text !== null)) {
      newHeadingText = state.data.text;
    }
    if ((state.data.blobs !== undefined) && (state.data.blobs !== null)) {
      if (state.data.blobs.length !== undefined) {
        for (i = 0; i < state.data.blobs.length; i++) {
          newBlobs.push(state.data.blobs[i]);
        }
      }
    }
    if ((state.data.links !== undefined) && (state.data.links !== null)) {
      if (state.data.links.length !== undefined) {
        for (i = 0; i < state.data.links.length; i++) {
          newLinks.push(state.data.links[i]);
        }

        // Here we count the number of times that a duplicate link exists, and assign each
        // such link an ordinal so that the corresponding DOM elements may have
        // distinguishing information (in our case, we build duplicate links with different
        // curve radii)
        var sameLinks = [];
        var existing, j;
        for (i = 0; i < newLinks.length; i++) {
          existing = false;
          for (j = 0; j < sameLinks.length; j++) {
            if (((sameLinks[j])[0].source === newLinks[i].source) && ((sameLinks[j])[0].target === newLinks[i].target)) {
              (sameLinks[j]).push(newLinks[i]);
              existing = true;
            }
          }
          if (!existing) {
            var newArray = [];
            newArray.push(newLinks[i]);
            sameLinks.push(newArray);
          }
        }
        for (i = 0; i < sameLinks.length; i++) {
          for (j = 0; j < (sameLinks[i]).length; j++) {
            (sameLinks[i])[j].linknum = (j + 1);
          }
        }
      }
    }
  }

  // if a prospective link is to be displayed, we add it to the array of links
  // passed down to us from Toggly
  if ((state.tempTargetBlob !== undefined) && (state.tempTargetBlob !== null)
    && (state.tempTargetBlob !== true)) {
    var newType;
    if (typeof state.prospectiveLinkType === "object") {
      newType = state.prospectiveLinkType.type;
    } else {
      newType = state.prospectiveLinkType;
    }

    newLinks.push({ "text": "",
        "wikiref": null,
        "source": state.tempSourceBlob.id,
        "target": state.tempTargetBlob.id,
        "type": newType,
        "id": "temp",
        "glued": false,
        "linknum": 0.125 });
  }

  // We determine which blobs/links are which and push them to the appropriate local
  // arrays. The "ordinal" property is set for ease of calculating where to draw the
  // external blobs. (See togglyDrawNodesLinks() and togglyDrawExternals().)
  for (i = 0; i < newBlobs.length; i++) {
    if (newBlobs[i].type === "source") {
      newSourceBlobs.push(newBlobs[i]);
      newSourceBlobs[newSourceBlobs.length - 1].ordinal = newSourceBlobs.length - 1;
    } else if (newBlobs[i].type === "sink") {
      newSinkBlobs.push(newBlobs[i]);
      newSinkBlobs[newSinkBlobs.length - 1].ordinal = newSinkBlobs.length - 1;
    } else if (newBlobs[i].type === "orphan") {
      newOrphanBlobs.push(newBlobs[i]);
      newOrphanBlobs[newOrphanBlobs.length - 1].ordinal = newOrphanBlobs.length - 1;
    } else if (newBlobs[i].type === "circle") {
      newProperBlobs.push(newBlobs[i]);
      newCircleBlobs.push(newBlobs[i]);
      newCircleBlobs[newCircleBlobs.length - 1].ordinal = newCircleBlobs.length - 1;
    } else if (newBlobs[i].type === "square") {
      newProperBlobs.push(newBlobs[i]);
      newSquareBlobs.push(newBlobs[i]);
      newSquareBlobs[newSquareBlobs.length - 1].ordinal = newSquareBlobs.length - 1;
    }
  }

  for (i = 0; i < newLinks.length; i++) {
    if (newLinks[i].type === "solid") {
      newSolidLinks.push(newLinks[i]);
    }
    else if (newLinks[i].type === "dashed") {
      newDashedLinks.push(newLinks[i]);
    }
  }

  // External blobs and orphans are set up to not be displayed as proper blobs (they
  // are handled differently), but nevertheless to have links going to them. Hence,
  // they need x and y positions to be known to/handled by our force simulation
  // layout.
  for (i = 0; i < newSourceBlobs.length; i++) {
    newSourceBlobs[i].fx = (this.width / (newSourceBlobs.length + 1)) * (i + 1);
    newSourceBlobs[i].fy = this.height;
    newSourceBlobs[i].r = 0;
  }
  for (i = 0; i < newSinkBlobs.length; i++) {
    newSinkBlobs[i].fx = (this.width / (newSinkBlobs.length + 1)) * (i + 1);
    newSinkBlobs[i].fy = 0;
    newSinkBlobs[i].r = 0;
  }
  for (i = 0; i < newOrphanBlobs.length; i++) {
    newOrphanBlobs[i].r = 0;
  }

  this.blobs = newBlobs;
  this.links = newLinks;

  this.hoveredBlobs = newHoveredBlobs;
  this.hoveredLinks = newHoveredLinks;
  this.clickedBlobs = newClickedBlobs;
  this.clickedLinks = newClickedLinks;

  this.properBlobs = newProperBlobs;
  this.circleBlobs = newCircleBlobs;
  this.squareBlobs = newSquareBlobs;
  this.sourceBlobs = newSourceBlobs;
  this.sinkBlobs = newSinkBlobs;
  this.orphanBlobs = newOrphanBlobs;

  this.solidLinks = newSolidLinks;
  this.dashedLinks = newDashedLinks;

  this.headingText = newHeadingText;

  this.drawExternals = newDrawExternals;
};

function togglyUpdate(state, external) {
  // This function is invoked in one of three ways:
  //
  // 1. By Toggly, whenever it updates its state (state pased by Toggly,
  // external set to true). In this case, we both recalculate our local data
  // based on data passed to us in state and redraw the SVG elements.
  // 2. When the class is first created (state ultimately passed by Toggly),
  // external set to true). This is basically the same as #1 above.
  // 3. By _ticked(), whenever simulation emits a "tick" event (i.e. whenever
  // it updates any blob positions; external set to true). In this case, we
  // simply redraw the SVG elements based on our local data.

  if (external === true) {
    // We recalculate our local data
    this._parseData(state);

    // We tell our simulation that our links and nodes possibly changed, and we
    // also tell it to run itself again
    var forceLink = d3.forceLink(this.links).distance(60).strength(0.1).id(function(d) {
        return d.id
      });
    this.simulation = this.simulation.nodes(this.blobs)
      .force("link", forceLink)
      .alpha(1).restart();
  }

  // We redraw everything
  this._drawNodesLinks();
  this._drawExternals();
  this._drawSelection();
  this._drawText();
};

module.exports = D3Toggly;
