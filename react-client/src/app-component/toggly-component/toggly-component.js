import React from 'react'
import ReactDOM from 'react-dom'

import D3Toggly from './d3Toggly'

import './toggly-component.css'

// Toggly is a React component that contains all of the UI elements that display
// and alter fetched stemio system data. One of these UI elements is controlled
// externally by an instance of the D3Toggly class (defined in d3Toggly.js); we
// just create the DOM element whose reference is passed to the instance and
// call update() with the relevant state data, returned by _getState(), whenever
// the component updates (i.e. in componentDidUpdate() ). We also call
// getDispatcher() on the instance to get a reference to an event emitter that
// the instance of D3Toggly uses to communicate back to Toggly.

// We also use react-popup to control the display and styling of an overlay
// component contained in an element located at the highest point on the DOM
// tree in <body>. At appropriate times, we call on this component to display
// and subsequently hide the appropriate UI elements that together function as
// popups asking the user for things like the name of a new stock.

// As a property of this class, the parent passes an instance of the DataService
// class controlled by the MainPage component. This class contains all of the
// methods that allow us to set application-wide variables (i.e. MainPage state
// variables) like data, collectionName, and connectString

export class Toggly extends React.Component {
  constructor(props) {
    super(props);

    // These state variables are not passed to d3Toggly by _getState()
    this.state = { currentViewId: null, // the id of the current view to be
                                        // displayed within the state variable
                                        // data (passed to d3Toggly)
      externalBlobs: [],                // an array containing references to
                                        // the external "trimmed" blobs (i.e.
                                        // with empty gluedlinks property)
                                        // having been most recently added
                                        // when prompting for a new link

      // These state variables are passed to d3Toggly by _getState() (but
      // only a reference to the current view in data is passed, not a
      // reference to the whole array)
      hoveredObjects: [],          // an array containing references to all
                                   // the blobs being hovered over
      tempSourceBlob: null,        // a reference to the source blob for a
                                   // prospective link
      tempTargetBlob: null,        // a reference to the target blob for a
                                   // prospective link
      prospectiveLinkType: null,   // specifies whether the prospective
                                   // link prompted to the user should be
                                   // a "solid" or "dashed" link, or con-
                                   // tains a link to be replaced by a new
                                   // link
      drawExternals: false };      // a boolean specifying whether or not
                                   // we are currently displaying external
                                   // (i.e. source or sink) blobs

    this.d3Toggly = null;          // local variable with the instance of
                                   // the D3Toggly pseudo-class
    this.d3Container = null;       // local variable with the reference to
                                   // the DOM node passed to d3Toggly
    this.dispatcher = null;        // local variable with the reference to
                                   // an event emitter passed back by
                                   // d3toggly


    // The class methods that do not immediately originate with a UI element
    // interaction are denoted by the underscore before their name.
    this._getState = this._getState.bind(this);      // these fetch and set most of
    this._resetState = this._resetState.bind(this);  // the UI state variables

    this._getCurrentView = this._getCurrentView.bind(this);      // these manipulate
    this._getRootViewId = this._getRootViewId.bind(this);        // the setting of the
    this._setCurrentViewId = this._setCurrentViewId.bind(this);  // current view state
                                                                 // variable
                                                                 // currentViewId

    this._findFirstEmptySlot = this._findFirstEmptySlot.bind(this);              // these internal
    this._checkLinkHasChildren = this._checkLinkHasChildren.bind(this);          // functions do not
    this._getConnectingLinksToBlob = this._getConnectingLinksToBlob.bind(this);  // not manipulate the
    this._getExternalLinksToView = this._getExternalLinksToView.bind(this);      // objects referenced
                                                                                 // anywhere in the
                                                                                 // data tree

    this._createAllExternalBlobs = this._createAllExternalBlobs.bind(this);  // these internal
    this._createExternalBlob = this._createExternalBlob.bind(this);          // functions do manipulate
    this._createBlob = this._createBlob.bind(this);                          // objects reference in
    this._createLink = this._createLink.bind(this);                          // the data tree
    this._createView = this._createView.bind(this);
    this._convertBlobToOrphan = this._convertBlobToOrphan.bind(this);
    this._trimBlob = this._trimBlob.bind(this);
    this._deleteBlob = this._deleteBlob.bind(this);
    this._deleteLink = this._deleteLink.bind(this);
    this._deleteView = this._deleteView.bind(this);
    this._cullExternalBlobs = this._cullExternalBlobs.bind(this);


    this.blobMouseOver = this.blobMouseOver.bind(this);  // these process the events
    this.blobMouseOut = this.blobMouseOut.bind(this);    // emitted by d3Toggly through
    this.blobClick = this.blobClick.bind(this);          // dispatcher
    this.blobDblclick = this.blobDblclick.bind(this);
    this.linkMouseOver = this.linkMouseOver.bind(this);
    this.linkMouseOut = this.linkMouseOut.bind(this);
    this.linkClick = this.linkClick.bind(this);
    this.outsideClick = this.outsideClick.bind(this);
    this.keyboardDelete = this.keyboardDelete.bind(this);

    this.handleParentView = this.handleParentView.bind(this);       // these handle what to do
    this.handleNewCircleBlob = this.handleNewCircleBlob.bind(this); // whenever a user interacts
    this.handleNewSquareBlob = this.handleNewSquareBlob.bind(this); // with one of the UI
    this.handleNewSolidLink = this.handleNewSolidLink.bind(this);   // elements contained in the
    this.handleNewDashedLink = this.handleNewDashedLink.bind(this); // component
    this.handleDelete = this.handleDelete.bind(this);
    this.handleNewParent = this.handleNewParent.bind(this);
  }

  componentDidMount() {
    // Here we initially set up an instance of D3Toggly, store a reference to it, get
    // a reference to the event emitter it will use to communicate with Toggly, and
    // add/handle the appropriate listeners to the events it emits

    this.d3Toggly = new D3Toggly (this.d3Container, this._getState(), 600, 400);
    var dispatcher = this.d3Toggly.getDispatcher();

    dispatcher.on("blob:mouseover", this.blobMouseOver);
    dispatcher.on("blob:mouseout", this.blobMouseOut);
    dispatcher.on("link:mouseover", this.linkMouseOver);
    dispatcher.on("link:mouseout", this.linkMouseOut);
    dispatcher.on("blob:click", this.blobClick);
    dispatcher.on("link:click", this.linkClick);
    dispatcher.on("blob:dblclick", this.blobDblclick);
    dispatcher.on("outsideclick", this.outsideClick);
    dispatcher.on("escapekey", this.outsideClick);
    dispatcher.on("arrowupkey", this.handleParentView);
    dispatcher.on("deletekey", this.keyboardDelete);

    this.dispatcher = dispatcher;

    var data = this.props.dataService.getData();
    this._createView(null, null);
    this.props.dataService.setData(data);
  }

  componentWillUpdate() {
    // Before Toggly gets updated, we make sure that this.state.currentViewId exists
    // within our data. If not, we set this.state.currentViewId to the root view.
    // Then, we check to see if we were told from outside Toggly (in the props, e.g.
    // set by the Selection Info component) to do anything like create a new view in
    // the selected blob, or delete a view in the selected blob, etc.
    var i, data;

    if (this.props.createData !== false) {
      data = this.props.dataService.getData();

      if (data.length === 0) {
        this._createView(null, null);
      }

      this.props.dataService.setData(data);
    }

    if (this.props.resetViewId === true) {
      this.setState({ externalBlobs: [] });
      this._setCurrentViewId();
      this._resetState();
    } else {
      if (this.props.resetViewId === false) {
        i = this.props.dataService.getData().findIndex( (function(d) {
            return d.id === this.state.currentViewId;
          }).bind(this) );
      } else {
        i = this.props.dataService.getData().findIndex( (function(d) {
            return d.id === this.props.resetViewId;
          }).bind(this) );
        if (i >= 0) {
          this._setCurrentViewId(this.props.resetViewId);
        }
      }
      data = this.props.dataService.getData();

      if ((i < 0) && (data[0] !== undefined)) {
        this._setCurrentViewId();
      }
    }

    var view = this._getCurrentView();

    if (view !== null) {
      if (this.props.relink !== false) {
        this._createAllExternalBlobs(view);

        this.setState({ prospectiveLinkType: this.props.relink,
          tempSourceBlob: true,
          drawExternals: true });
      }
      if (this.props.renameView !== false) {
        for (i = 0; i < this.props.renameView.length; i++) {
          var viewToRename = this._getCurrentView(this.props.renameView[i].viewId);
          viewToRename.text = this.props.renameView[i].newText;
        }
      }
      if (this.props.newView !== false) {
        data = this.props.dataService.getData();

        if (this.props.newView.child === null) {
          var newView = this._createView(this.props.newView.text, this.state.currentViewId);

          this.props.newView.child = newView.id;
        }

        this._setCurrentViewId(this.props.newView.child);
        this._cullExternalBlobs(view);
        this._resetState();

        this.props.dataService.setData(data);
      }
      if (this.props.deleteView !== false) {
        data = this.props.dataService.getData();

        this._deleteView(this.props.deleteView.child);
        this.props.deleteView.child = null;

        this.props.dataService.setData(data);
      }
    }
  }

  componentDidUpdate() {
    // Anytime state gets updated, we update d3Toggly (note that we set state to
    // the output of _getState() and external to true, the latter indicating that
    // it was Toggly that called update() and not some method within d3Toggly
    // itself)

    this.d3Toggly.update(this._getState(), true);
  }

  _getState() {
    // This method returns the relevant state data to be sent to d3Toggly

    var view = this._getCurrentView(this.state.currentViewId);
    var clickedObjects = this.props.getClickedObjects();

    return { data: view,
      hoveredObjects: this.state.hoveredObjects,
      clickedObjects: clickedObjects,
      tempSourceBlob: this.state.tempSourceBlob,
      tempTargetBlob: this.state.tempTargetBlob,
      prospectiveLinkType: this.state.prospectiveLinkType,
      drawExternals: this.state.drawExternals };
  }

  _resetState() {
    // This method resets the current component state data

    this.props.setClickedObjects([]);
    this.setState({ hoveredObjects: [],
      tempSourceBlob: null,
      tempTargetBlob: null,
      prospectiveLinkType: null,
      drawExternals: false });
  }

  _getCurrentView(viewId) {
    // This method returns a reference to a view with a particular id property.
    // If no id property is specified, it returns a reference to the current
    // view.

    if (arguments.length === 0) {
      return this._getCurrentView(this.state.currentViewId);
    } else {
      var data = this.props.dataService.getData();

      var i = data.findIndex(function(d) {
          return d.id === viewId;
        });

      if (i >= 0) {
        return data[i];
      } else {
        return null;
      }
    }
  }

  _getRootViewId(viewId) {
    // This recursive method traverses the view tree until it reaches the
    // view at the root of the view tree containing the view with id
    // viewId. (Programmatically, the method, when passed some view's
    // viewId, either calls itself with the view's parent id, or returns
    // with the view's id if its parent id is null.)

    var view = this._getCurrentView(viewId);

    if (view !== null) {
      var parentview = this._getCurrentView(view.parent);
      if (parentview !== null) {
        return this._getRootViewId(parentview.id);
      } else {
        return view.id;
      }
    } else {
      return null;
    }
  }

  _setCurrentViewId(viewId) {
    // If passed nothing, this method sets currentViewId to the root view id.
    // If passed a viewId, it sets currentViewId to viewId.

    if (arguments.length === 0) {
      var data = this.props.dataService.getData()

      this._setCurrentViewId(this._getRootViewId(data[0].id));
    } else {
      if (viewId !== null) {
        this.setState({ currentViewId: viewId });
      }
    }
  }

  _findFirstEmptySlot(array) {
    // This method finds the first unused id ordinal for whatever array
    // is passed to it.
    //
    // The data persistence principle is that the nodes, links, and data
    // arrays only have elements whose numerical part of the id is at least
    // that element's index within the array: they start out as exactly the
    // element's index, but through deleting elements, the index may be
    // lower than the numerical part of the id. (For example, "v4" may have
    // index 4 within data, or "l7" may have index 2 within links, but
    // "l2" cannot have index higher than 2 within links, or "b0" cannot
    // be anything but the first element within blobs.)
    //
    // The way we ensure this is that we only push things onto the end of
    // an array if no other position has a "missing" element; i.e. if no
    // element has a strictly smaller index than the numerical part of its
    // id. This function is what checks for such a condition.


    var location = array.length;
    for (var i = 0; i < array.length; i++) {
      if (parseInt(array[i].id.slice(1), 10) > i) {
        location = i;
        break;
      }
    }
    return location;
  }

  _getConnectingLinksToBlob(view, blobId) {
    // This method returns an object containing two arrays: one that
    // contains references to all links in the specified view
    // originating with the blob whose id is specified, and another
    // that contains references to all links in the same view
    // pointing with the blob whose id is specified.

    var result = { connectsTo: [],
      connectsFrom: [] };

    for (var i = 0; i < view.links.length; i++) {
      if (view.links[i].source.id === blobId) {
        result.connectsTo.push(view.links[i].id);
      }
      if (view.links[i].target.id === blobId) {
        result.connectsFrom.push(view.links[i].id);
      }
    }

    return result;
  }

  _checkLinkHasChildren(link) {
    // This method checks whether or not a link has links associated to
    // it in the view that the source or target blobs may possibly have

    var i;
    var existing = false;
    var sourceview = this._getCurrentView(link.source.child);
    var targetview = this._getCurrentView(link.target.child);

    if (sourceview !== null) {
      i = sourceview.blobs.findIndex(function(d) {
          return d.parentlink === link.id;
        });
      if (i >= 0) {
        existing = true;
      }
    }
    if (targetview !== null) {
      i = targetview.blobs.findIndex(function(d) {
          return d.parentlink === link.id;
        });
      if (i >= 0) {
        existing = true;
      }
    }

    return existing;
  }

  _getExternalLinksToView(view) {
    // This method returns any possible links originating from or pointing to
    // a possible parent blob that the current view may have

    var result = { connectsTo: [],
      connectsFrom: [] };

    if (view.parent !== null) {
      var parentview = this._getCurrentView(view.parent);
      var i = parentview.blobs.findIndex(function(d) {
          return d.child === view.id;
        });
      if (i >= 0) {
        for (var j = 0; j < parentview.links.length; j++) {
          if (parentview.links[j].source.id === parentview.blobs[i].id) {
            result.connectsFrom.push(parentview.links[j]);
          } else if (parentview.links[j].target.id === parentview.blobs[i].id) {
            result.connectsTo.push(parentview.links[j]);
          }
        }
      }
    }

    return result;
  }

  _createAllExternalBlobs(view) {
    // This method is invoked whenever we prompt a user for prospective new
    // links: it pushes all possible external blobs, if they do not already
    // exist, corresponding to all possible external links that originate
    // from or point to the blob which may possibly be the parent to the
    // current view

    var externalLinks = this._getExternalLinksToView(view);

    var i,j;
    var existing;
    for (i = 0; i < externalLinks.connectsFrom.length; i++) {
      existing = false;

      for (j = 0; j < view.blobs.length; j++) {
        if (view.blobs[j].parentlink === externalLinks.connectsFrom[i].id) {
          existing = true;
          break;
        }
      }

      if (!existing) {
        this._createExternalBlob(view.blobs, externalLinks.connectsFrom[i].text,
          "sink", externalLinks.connectsFrom[i].id);
      }
    }
    for (i = 0; i < externalLinks.connectsTo.length; i++) {
      existing = false;

      for (j = 0; j < view.blobs.length; j++) {
        if (view.blobs[j].parentlink === externalLinks.connectsTo[i].id) {
          existing = true;
          break;
        }
      }

      if (!existing) {
        this._createExternalBlob(view.blobs, externalLinks.connectsTo[i].text,
          "source", externalLinks.connectsTo[i].id);
      }
    }
  }

  _createExternalBlob(blobs, text, type, parentlink) {
    var location = this._findFirstEmptySlot(blobs);

    blobs.splice(location, 0, { text: text,
      wikiref: null,
      child: null,
      type: type,
      x: null,
      y: null,
      r: null,
      gluedlinks: [],
      parentlink: parentlink,
      id: "b" + location });
    this.state.externalBlobs.push(blobs[location]);
  }

  _createBlob(view, text, type, child) {
    var location = this._findFirstEmptySlot(view.blobs);

    view.blobs.splice(location, 0, { text: text,
      wikiref: null,
      child: child,
      type: type,
      x: 300,
      y: 200,
      r: 15,
      gluedlinks: null,
      parentlink: null,
      id: "b" + location });
  }

  _createLink(view, text, sourceBlob, targetBlob, type) {
    // This method creates a new link and pushes its id to any external blobs
    // it may be originating from or pointing to

    var location = this._findFirstEmptySlot(view.links);

    view.links.splice(location, 0, { text: text,
      wikiref: null,
      source: sourceBlob.id,
      target: targetBlob.id,
      type: type,
      id: "l" + location,
      glued: false });

    if ((sourceBlob.type === "source") || (sourceBlob.type === "sink")) {
      view.links[location].glued = true;
      sourceBlob.gluedlinks.push(view.links[location].id);
    }
    if ((targetBlob.type === "source") || (targetBlob.type === "sink")) {
      view.links[location].glued = true;
      targetBlob.gluedlinks.push(view.links[location].id)
    }

    // This is done to force an "external" update in d3Toggly, so that linknum
    // is correctly updated (for displaying multiple links between the same
    // two nodes)
    this.d3Toggly.update(this._getState(), true);
  }

  _createView(text, parent) {
    var data = this.props.dataService.getData();
    var location = this._findFirstEmptySlot(data);

    data.splice(location, 0, { id: "v" + location,
      blobs: [],
      links: [],
      parent: parent,
      text: text });

    return data[location];
  }

  _convertBlobToOrphan(view, blobId) {
    // This method is invoked whenever we delete a blob with links
    // originating from or pointing to it. It converts the blob to an
    // "orphan" blob type, which contains none of the data of the
    // deleted blob, but which allows the user to later reconnect the
    // link to another blob (as opposed to, e.g. deleting the link)

    var i = view.blobs.findIndex(function(d) {
        return d.id === blobId;
      });
    if (i >= 0) {
      view.blobs[i].text = null;
      view.blobs[i].wikiref = null;
      view.blobs[i].type = "orphan";
      view.blobs[i].fx = view.blobs[i].x;
      view.blobs[i].fy = view.blobs[i].y;
      view.blobs[i].r = null;
    }
  }

  _trimBlob(view, blobId, linkId) {
    // This method is invoked whenever a link is deleted, with blobId set
    // to the id of the source or target blobs. It "trims" (i.e. pops off)
    // the linkId, corresponding to the link having been deleted, from the
    // gluedlinks array of the blob with id blobId in a given view

    var i = view.blobs.findIndex(function(d) {
        return d.id === blobId;
      });
    if (i >= 0) {
      var blob = view.blobs[i];
      if ((blob.type === "source") || (blob.type === "sink") || (blob.type === "orphan")) {
        var j = blob.gluedlinks.findIndex(function(d) {
            return d === linkId;
          });
        if (j >= 0) {
          blob.gluedlinks.splice(j, 1);
        }
        if (blob.gluedlinks.length === 0) {
          this._deleteBlob(view, blobId)
        }
      }
    }
  }

  _deleteBlob(view, blobId) {
    var i = view.blobs.findIndex(function(d) {
        return d.id === blobId;
      });
    if (i >= 0) {
      view.blobs.splice(i, 1);
    }
  }

  _deleteLink(view, linkId) {
    var i = view.links.findIndex(function(d) {
        return d.id === linkId;
      });
    if (i >= 0) {
      view.links.splice(i, 1);
    }
  }

  _deleteView(viewId) {
    // This recursive method determines whether a view with the given
    // viewId contains any children views in its blobs, and either calls
    // itself passing the child's viewId, or deletes the view from data
    // if it does not.

    var view = this._getCurrentView(viewId);

    if (view !== null) {
      var data = this.props.dataService.getData();

      for (var i = 0; i < view.blobs.length; i++) {
        this._deleteView(view.blobs[i].child);
        view.blobs[i].child = null;
      }

      i = data.findIndex(function(d) {
          return d.id === viewId;
        });
      if (i >= 0) {
        data.splice(i, 1);
      }
    }
  }

  _cullExternalBlobs(view) {
    // This method traverses the state variable array externalBlobs and
    // deletes any blobs with ids matching the ids of the references
    // contained in externalBlobs

    for (var i = 0; i < this.state.externalBlobs.length; i++) {
      if (this.state.externalBlobs[i].gluedlinks.length === 0) {
        this._deleteBlob(view, this.state.externalBlobs[i].id);
      }
    }

    this.setState({ externalBlobs: [] });
  }

  blobMouseOver(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user hovers over a blob.

    var view = this._getCurrentView();

    if (view !== null) {
      this.setState({ hoveredObjects: [d] });

      // if a user is adding a link, we set either the source blob or the target
      // blob of the prospective link
      if ((this.state.tempSourceBlob !== null)  && (this.state.tempSourceBlob !== true)
        && (d.type !== "source") && (this.state.tempSourceBlob.id !== d.id)) {
        if (!((this.state.tempSourceBlob.type === "source") && (d.type === "sink"))) {
          this.setState({ tempTargetBlob: d });
        }
      }
    }
  }

  blobMouseOut(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user exits a blob.

    var view = this._getCurrentView();

    if (view !== null) {
      this.setState({ hoveredObjects: [] });
    }
  }

  blobClick(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user clicks on a blob.

    var view = this._getCurrentView();

    if (view !== null) {
      this.props.setClickedObjects([d]);

      // if a user is adding a link, we either move on to setting a target blob
      // of the prospective link, or move on to creating the actual link
      if (this.state.tempSourceBlob !== null) {
        var data = this.props.dataService.getData();

        if (this.state.tempSourceBlob === true) {
          if (d.type !== "sink") {
            this.setState({ tempSourceBlob: d,
              tempTargetBlob: true });
          } else {
            this._resetState();
            this._cullExternalBlobs(view);
            this.props.setDisableDataActions(false);
          }
        } else {
          if ((this.state.tempSourceBlob.id !== d.id) && (d.type !== "source")) {
            if (!((this.state.tempSourceBlob.type === "source") && (d.type === "sink"))) {
              if (typeof this.state.prospectiveLinkType === "object") {
                var existingLink = this.state.prospectiveLinkType;
                var haschildren = this._checkLinkHasChildren(existingLink);

                if (haschildren === false) {
                  var oldSource = existingLink.source;
                  var oldTarget = existingLink.target;

                  existingLink.source = this.state.tempSourceBlob;
                  existingLink.target = d;
                  this._trimBlob(view, oldSource.id, existingLink.id);
                  this._trimBlob(view, oldTarget.id, existingLink.id);

                  this._resetState();
                  this._cullExternalBlobs(view);
                  this.props.setDisableDataActions(false);
                  this.props.dataService.setData(data);
                } else {
                  this._resetState();
                  this._cullExternalBlobs(view);
                  this.props.setDisableDataActions(false);

                  ReactDOM.render(<this.props.popup
                    closeBtn={false}
                    closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
                  this.props.popup.plugins().noticeCancel("Flow has children",
                    "The flow " + existingLink.text
                    + " has child flows in a subsystem and cannot be relinked.",
                    function() {} );
                }
              } else {
                var _this = this;

                ReactDOM.render(<this.props.popup
                  closeBtn={false}
                  closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
                this.props.popup.plugins().promptLink("New Flow", "Name of the new flow", function (input) {
                    _this._createLink(_this._getCurrentView(), input, _this.state.tempSourceBlob, d,
                      _this.state.prospectiveLinkType);
                    _this._resetState();
                    _this._cullExternalBlobs(view);
                    _this.props.setDisableDataActions(false);
                    _this.props.dataService.setData(data);
                  });
              }
            } else {
              this._resetState();
              this._cullExternalBlobs(view);
              this.props.setDisableDataActions(false);
            }
          } else {
            this._resetState();
            this._cullExternalBlobs(view);
            this.props.setDisableDataActions(false);
          }
        }

        this.props.dataService.setData(data);
      }
    }
  }

  blobDblclick(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user double clicks on a blob. This enters the view that the
    // blob may possibly have as a child.

    var view = this._getCurrentView()

    if (view !== null) {
      this._cullExternalBlobs(view);
      this._setCurrentViewId(d.child);
      this.props.setDisableDataActions(false);
      this._resetState();
    }
  }

  linkMouseOver(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user hovers over a link.

    var view = this._getCurrentView();

    if (view !== null) {
      this.setState({ hoveredObjects: [d] });
    }
  }

  linkMouseOut(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user exits a link.

    var view = this._getCurrentView();

    if (view !== null) {
      this.setState({ hoveredObjects: [] });
    }
  }

  linkClick(d) {
    // This method handles the event emitted by d3toggly whenever a
    // user clicks on a link.

    var view = this._getCurrentView();

    if (view !== null) {
      this.props.setClickedObjects([d]);
    }
  }

  outsideClick() {
    // This method handles the event emitted by d3toggly whenever a
    // user clicks outside of every element (e.g. link or blob).

    var view = this._getCurrentView()

    if (view !== null) {
      this._resetState();
      this._cullExternalBlobs(view);
      this.props.setDisableDataActions(false);
    }
  }

  keyboardDelete() {
    // This method handles the event emitted by d3toggly whenever a
    // user presses the "delete" key on the keyboard; this is the
    // same as pressing the "Delete" UI button

    this.handleDelete();
  }

  handleParentView() {
    // This method handles when a user presses the "Go Back" button:
    // we then go up one view level if the current view has a parent

    var view = this._getCurrentView();

    if (view !== null) {
      var parentview = view.parent;

      this._cullExternalBlobs(view);
      this.props.setDisableDataActions(false);
      this._setCurrentViewId(parentview);
      this._resetState();
    }
  }

  handleNewCircleBlob() {
    // This method handles when a user presses the "New Circle Blob" button:
    // we prompt the user for the new blob's name and proceed in
    // creating it.

    var view = this._getCurrentView();

    if (view !== null) {
      var data = this.props.dataService.getData();
      var _this = this;

      ReactDOM.render(<this.props.popup
        closeBtn={false}
        closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
      this.props.popup.plugins().promptProcess("New Process", "Name of the new process", function (input) {
          _this._createBlob(view, input, "circle", null);

          _this._resetState();
          _this.props.dataService.setData(data);
        } );

      this.props.dataService.setData(data);
    }
  }

  handleNewSquareBlob() {
    // This method handles when a user presses the "New Square Blob" button:
    // we prompt the user for the new blob's name and proceed in
    // creating it.

    var view = this._getCurrentView();

    if (view !== null) {
      var data = this.props.dataService.getData();
      var _this = this;

      ReactDOM.render(<this.props.popup
        closeBtn={false}
        closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
      this.props.popup.plugins().promptStock("New Stock", "Name of the new stock", function (input) {
          _this._createBlob(view, input, "square", null);

          _this._resetState();
          _this.props.dataService.setData(data);
        } );

      this.props.dataService.setData(data);
    }
  }

  handleNewSolidLink() {
    // This method handles whenever a user presses the "New Solid Link" button:
    // we then set the state variables to indicate prospective link mode,
    // such as setting drawExternals to "true" (so as to let d3Toggly to
    // know that it should draw external blobs, to which we may connect a
    // prospective link).

    var view = this._getCurrentView();

    if (view !== null) {
      this._createAllExternalBlobs(view);

      this.setState({ prospectiveLinkType: "solid",
        tempSourceBlob: true,
        drawExternals: true });
      this.props.setDisableDataActions(true);
    }
  }

  handleNewDashedLink() {
    // This method handles whenever a user presses the "New Dashed Link" button:
    // we then set the state variables to indicate prospective link mode,
    // such as setting drawExternals to "true" (so as to let d3Toggly to
    // know that it should draw external blobs, to which we may connect a
    // prospective link).

    var view = this._getCurrentView();

    if (view !== null) {
      this._createAllExternalBlobs(view);

      this.setState({ prospectiveLinkType: "dashed",
        tempSourceBlob: true,
        drawExternals: true });
      this.props.setDisableDataActions(true);
    }
  }

  handleDelete() {
    // This method handles whenever a user presses the "Delete" button:
    // we go through clickedLinks and clickedBlobs, respectively, delete
    // the necessary links, trim the blobs as necessary whose links we
    // deleted, and then delete the necessary blobs, converting them to
    // orphans if they have links originating from or pointing to them.

    var view = this._getCurrentView();

    if (view !== null) {
      var i, clickedObject;

      var clickedBlobs = [];
      var clickedLinks = [];
      var clickedObjects = this.props.getClickedObjects();
      for (i = 0; i < clickedObjects.length; i++) {
        if ((clickedObjects[i].type === "dashed") || (clickedObjects[i].type === "solid")) {
          clickedLinks.push(clickedObjects[i]);
        } else {
          clickedBlobs.push(clickedObjects[i]);
        }
      }

      var data = this.props.dataService.getData();
      var _this = this;

      var promptCallback = (function(clickedBlob) {
          return (function() {
              this._deleteView(clickedBlob.child);

              var connectedInfo = _this._getConnectingLinksToBlob(view, clickedBlob.id);

              if ((connectedInfo.connectsTo !== []) || (connectedInfo.connectsFrom !== [])) {
                this._convertBlobToOrphan(view, clickedBlob.id);
              }

              this._deleteBlob(view, clickedBlob.id);
              this.props.dataService.setData(data);
            }).bind(this);
        }).bind(this);

      for (i = 0; i < clickedLinks.length; i++) {
        clickedObject = clickedLinks[i];

        var haschildren = this._checkLinkHasChildren(clickedObject);

        if (haschildren === false) {
          this._trimBlob(view, clickedObject.source.id, clickedObject.id);
          this._trimBlob(view, clickedObject.target.id, clickedObject.id);

          this._deleteLink(view, clickedObject.id);
        } else {
          ReactDOM.render(<this.props.popup
            closeBtn={false}
            closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
          this.props.popup.plugins().noticeCancel("Flow has children",
            "The flow " + clickedObject.text + " has child flows in a subsystem and cannot be deleted.",
            function() {} );
        }
      }

      for (i = 0; i < clickedBlobs.length; i++) {
        clickedObject = clickedBlobs[i];

        if (clickedBlobs[i].child === null) {
          (promptCallback(clickedObject))();
        } else {
          var objectType;
          if (clickedObject.type === "square") {
            objectType = "stock";
          } else if (clickedObject.type === "circle") {
            objectType = "process";
          }

          ReactDOM.render(<this.props.popup
            closeBtn={false}
            closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
          this.props.popup.plugins().noticeOkCancel("Delete subsystem?",
            "The " + objectType + " " + clickedBlobs[i].text + " contains a subsystem. Would you like to delete it?",
            "Delete", promptCallback(clickedObject));
        }
      }

      this._cullExternalBlobs(view);
      this._resetState();
      this.props.dataService.setData(data);
    }
  }

  handleNewParent() {
    // This method  handles whenever a user presses the "New Parent" button:
    // we create a new view, create a new blob inside that view, prompt the
    // user for its name, name the current view that, and set the current
    // view to have the new view as parent.

    var view = this._getCurrentView();

    if (view !== null) {
      var data = this.props.dataService.getData();

      if (view.parent === null) {
        var _this = this;

        ReactDOM.render(<this.props.popup
          closeBtn={false}
          closeOnOutsideClick={false} />, document.getElementById("popupContainer") );
        this.props.popup.plugins().promptProcess("New Process", "Name the current system", function (input) {
            var newView = _this._createView(null, null);

            _this._createBlob(newView, input, "circle", view.id);
            view.parent = newView.id;
            view.text = input;

            _this._setCurrentViewId(view.parent);
            _this.props.dataService.setData(data);
          } );
      } else {
        this._setCurrentViewId(view.parent);
      }

      this._cullExternalBlobs(view);
      this.props.setDisableDataActions(false);
      this._resetState();
      this.props.dataService.setData(data);
    }
  }


  render() {
    return (
      <div className="toggly-component">
        <div className="toggly-component__status-message">
          {((this.state.tempSourceBlob !== null) && (this.state.tempSourceBlob === true)) ? ("Select source")
            : (((this.state.tempSourceBlob !== null) & (this.state.tempSourceBlob !== true)) ? ("Select target") : "") }
        </div>
        <div className="toggly-component__parent-buttons">
          <button onClick={this.handleParentView}
            className="toggly-component__parent-buttons__go-back-button"
            title="Go to Parent System">
            <svg id="go-back-svg"
              className="toggly-component__go-back-svg"
              viewBox="0 0 425 250">
              <path stroke="#ffffff" transform="rotate(-90 212.5 125)" id="go-back-svg-1" d="m297.548035,173.332596c-16.905457,28.837784 -48.403,48.290909 -84.561295,48.347c-54.067825,-0.083588 -97.752304,-43.286102 -97.867188,-96.665886c0.114883,-53.435188 43.799362,-96.608166 97.867188,-96.72089c36.158295,0.05488 67.629288,19.508869 84.561295,48.345669l37.135254,21.147728l1.34436,0.764435c-12.301819,-56.036484 -62.680847,-98.050652 -123.040909,-98.050652c-69.602127,0 -125.98674,55.726433 -125.98674,124.51371c0.02681,68.730522 56.415253,124.458748 125.98674,124.48629c60.390701,-0.027542 110.765823,-42.041733 123.040909,-98.107025l-1.317505,0.734879l-37.162109,21.204742zm40.451965,-48.318886l-67.027557,-38.252686l0,21.261566l-102.869293,0l0,33.926643l102.869293,0l0,21.290512l67.027557,-38.226036z" fill="#ffffff"/>
            </svg>
          </button>
          <button onClick={this.handleNewParent}
            className="toggly-component__parent-buttons__create-parent-view-button"
            title="Create New Parent System">
            <svg id="create-parent-view-svg"
              className="toggly-component__create-parent-view-svg"
              viewBox="0 0 425 250">
              <path stroke="#ffffff" transform="rotate(-90 275.5 125)" id="create-parent-view-svg-1" d="m360.548035,173.332596c-16.905457,28.837784 -48.403015,48.290909 -84.561279,48.347c-54.067841,-0.083588 -97.752319,-43.286102 -97.867203,-96.665886c0.114883,-53.435188 43.799362,-96.608166 97.867203,-96.72089c36.158264,0.05488 67.629272,19.508869 84.561279,48.345669l37.135254,21.147728l1.34436,0.764435c-12.301819,-56.036484 -62.680847,-98.050652 -123.040894,-98.050652c-69.602142,0 -125.986755,55.726433 -125.986755,124.51371c0.02681,68.730522 56.415253,124.458748 125.986755,124.48629c60.390686,-0.027542 110.765808,-42.041733 123.040894,-98.107025l-1.317505,0.734879l-37.162109,21.204742zm40.451965,-48.318886l-67.027557,-38.252686l0,21.261566l-102.869293,0l0,33.926643l102.869293,0l0,21.290512l67.027557,-38.226036z" fill="#ffffff"/>
              <rect stroke="#ffffff" id="create-parent-view-svg-2" height="125" width="40" y="10" x="66" fill="#ffffff"/>
              <rect transform="rotate(90 86 72.5)" stroke="#ffffff" id="create-parent-view-svg-3" height="125" width="40" y="10" x="66" fill="#ffffff"/>
            </svg>
          </button>
        </div>
        <div className="toggly-component__object-buttons">
          <button onClick={this.handleDelete}
            className={(this.props.getDisableDataActions()) ? ("toggly-component__object-buttons__delete-button toggly-component__object-buttons__delete-button_disabled") : ("toggly-component__object-buttons__delete-button")}
            disabled={this.props.getDisableDataActions()}
            title="Delete">
            <svg id="delete-svg"
              className="toggly-component__delete-svg"
              viewBox="0 0 425 250">
              <path stroke="#ffffff" id="delete-svg_1" d="M300 66l-30 180h-120l-30-180h20.28l26.67 160h86.11l26.67-160h20.28zm-47.11-40c-9 0-16.31-11-16.31-20h-53.16c0 9.01-7.3 20-16.31 20h-57.11v20h200v-20h-57.11z" fill="#ffffff"/>
            </svg>
          </button>
          <button onClick={this.handleNewCircleBlob}
            className={(this.props.getDisableDataActions()) ? ("toggly-component__object-buttons__new-circle-blob-button toggly-component__object-buttons__new-circle-blob-button_disabled") : ("toggly-component__object-buttons__new-circle-blob-button")}
            disabled={this.props.getDisableDataActions()}
            title="Create Process">
            <svg id="new-circle-blob-svg"
              className="toggly-component__new-circle-blob-svg"
              viewBox="0 0 425 250">
              <path stroke="#ffffff" id="new-circle-blob-svg_1" d="m88.999992,124.999969l0,0c0,-68.482269 55.293846,-123.999977 123.50164,-123.999977l0,0c32.754028,0 64.164536,13.06488 87.325699,36.318665c23.161438,23.253784 36.172668,54.794991 36.172668,87.681313l0,0c0,68.484238 -55.293579,124.000031 -123.498367,124.000031l0,0c-68.207794,0 -123.50164,-55.515793 -123.50164,-124.000031zm61.750008,0l0,0c0,34.243042 27.647339,62.000015 61.751633,62.000015c34.101822,0 61.748398,-27.756973 61.748398,-62.000015c0,-34.241066 -27.646576,-61.998085 -61.748398,-61.998085l0,0c-34.104294,0 -61.751633,27.757019 -61.751633,61.998085z" fill="#ffffff"/>
            </svg>
          </button>
          <button onClick={this.handleNewSquareBlob}
            className={(this.props.getDisableDataActions()) ? ("toggly-component__object-buttons__new-square-blob-button toggly-component__object-buttons__new-square-blob-button_disabled") : ("toggly-component__object-buttons__new-square-blob-button")}
            disabled={this.props.getDisableDataActions()}
            title="Create Stock">
            <svg id="new-square-blob-svg"
              className="toggly-component__new-square-blob-svg"
              viewBox="0 0 425 250">
              <rect stroke="#ffffff" id="new-square-blob-svg-1" height="50" width="200" y="175" x="112.5" fill="#ffffff"/>
              <rect transform="rotate(90 137.5 125)" stroke="#ffffff" id="new-square-blob-svg-2" height="50" width="200" y="100" x="37.5" fill="#ffffff"/>
              <rect transform="rotate(90 287.5 125)" stroke="#ffffff" id="new-square-blob-svg-3" height="50" width="200" y="100" x="187.5" fill="#ffffff"/>
              <rect stroke="#ffffff" id="new-square-blob-svg-4" height="50" width="200" y="24" x="112.5" fill="#ffffff"/>
            </svg>
          </button>
          <button onClick={this.handleNewSolidLink}
            className={(this.props.getDisableDataActions()) ? ("toggly-component__object-buttons__new-solid-link-button toggly-component__object-buttons__new-solid-link-button_disabled") : ("toggly-component__object-buttons__new-solid-link-button")}
            disabled={this.props.getDisableDataActions()}
            title="Create Physical Flow">
            <svg id="new-solid-link-svg"
              className="toggly-component__new-solid-link-svg"
              viewBox="0 0 425 250">
              <rect transform="rotate(45 80.2995 80.2995)" stroke="#c7d1dc" id="new-solid-link-svg-1" height="175" width="50" y="-7.200521" x="55.299522" fill="#ffffff"/>
              <rect transform="rotate(-45 80.2995 169.299)" stroke="#c7d1dc" id="new-solid-link-svg-2" height="175" width="50" y="81.799479" x="55.299522" fill="#ffffff"/>
              <rect stroke="#ffffff" id="new-solid-link-svg-3" height="50" width="355" y="100" x="70" fill="#ffffff"/>
            </svg>
          </button>
          <button onClick={this.handleNewDashedLink}
            className={(this.props.getDisableDataActions()) ? ("toggly-component__object-buttons__new-dashed-link-button toggly-component__object-buttons__new-dashed-link-button_disabled") : ("toggly-component__object-buttons__new-dashed-link-button")}
            disabled={this.props.getDisableDataActions()}
            title="Create Informational Flow">
            <svg id="new-dashed-link-svg"
              className="toggly-component__new-dashed-link-svg"
              viewBox="0 0 425 250">
              <rect stroke="#ffffff" id="new-dashed-link-svg-1" height="50" width="50" y="100" x="70" fill="#ffffff"/>
              <rect transform="rotate(45 80.2995 80.2995)" stroke="#ffffff" id="new-dashed-link-svg-2" height="175" width="50" y="-7.200521" x="55.299522" fill="#ffffff"/>
              <rect transform="rotate(-45 80.2995 169.299)" stroke="#ffffff" id="new-dashed-link-svg-3" height="175" width="50" y="81.799479" x="55.299522" fill="#ffffff"/>
              <rect stroke="#ffffff" id="new-dashed-link-svg-4" height="50" width="50" y="100" x="170" fill="#ffffff"/>
              <rect stroke="#ffffff" id="new-dashed-link-svg-5" height="50" width="50" y="100" x="270" fill="#ffffff"/>
              <rect stroke="#ffffff" id="new-dashed-link-svg-6" height="50" width="50" y="100" x="370" fill="#ffffff"/>
            </svg>
          </button>
        </div>
        <div className="toggly-component__display">
          <div ref={ (d) => { this.d3Container = d }}></div>
          {this.props.selectionInfoComponent}
        </div>
      </div>
    );
  }
}
