import React from 'react'

import './selection-info-component.css'

export class SelectionInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = { display: false };

    this.selectionText = "";
    this.selectionWikiref = "";
    this.selectionActions = "";

    this.changeSelectionWikiref = false;

    this.handleSelectionTextChange = this.handleSelectionTextChange.bind(this);
    this.handleSelectionWikirefChange = this.handleSelectionWikirefChange.bind(this);
    this.handleAddWikiref = this.handleAddWikiref.bind(this);
    this.handleRemoveWikiref = this.handleRemoveWikiref.bind(this);
    this.handleSetWikiref = this.handleSetWikiref.bind(this);
    this.handleChangeWikiref = this.handleChangeWikiref.bind(this);
    this.handleRelink = this.handleRelink.bind(this);
    this.handleNewView = this.handleNewView.bind(this);
    this.handleDeleteView = this.handleDeleteView.bind(this);
    this.handleCopyView = this.handleCopyView.bind(this);
    this.handleToggleLinkType = this.handleToggleLinkType.bind(this);
    this.handleToggleBlobType = this.handleToggleBlobType.bind(this);

    this.prepareBlobSelectionText = this.prepareBlobSelectionText.bind(this);
    this.prepareLinkSelectionText = this.prepareLinkSelectionText.bind(this);
    this.prepareSelectionWikiref = this.prepareSelectionWikiref.bind(this);
    this.prepareBlobSelectionActions = this.prepareBlobSelectionActions.bind(this);
    this.prepareLinkSelectionActions = this.prepareLinkSelectionActions.bind(this);
  }

  handleSelectionTextChange(event) {
    var clickedObjects = this.props.getClickedObjects();

    clickedObjects[0].text = event.target.value;
    if ((clickedObjects[0].child !== null) && (clickedObjects[0].child !== undefined)) {
      this.props.setRenameView({ viewId: clickedObjects[0].child,
        newText: event.target.value });
    }
    else if ((clickedObjects[0].type === "solid") || (clickedObjects[0].type === "dashed")) {
      if ((clickedObjects[0].source.child !== null) && (clickedObjects[0].source.child !== undefined)) {
        this.props.setRenameHidden({ viewId: clickedObjects[0].source.child,
          parentlinkId: clickedObjects[0].id,
          newText: event.target.value });
      }
      else if ((clickedObjects[0].target.child !== null) && (clickedObjects[0].target.child !== undefined)) {
        this.props.setRenameHidden({ viewId: clickedObjects[0].target.child,
          parentlinkId: clickedObjects[0].id,
          newText: event.target.value });
      }
    }

    this.props.setClickedObjects(clickedObjects);
  }

  handleSelectionWikirefChange(event) {
    var clickedObjects = this.props.getClickedObjects();

    clickedObjects[0].wikiref = event.target.value;

    this.props.setClickedObjects(clickedObjects);
  }

  handleAddWikiref(event) {
    var clickedObjects = this.props.getClickedObjects();

    clickedObjects[0].wikiref = clickedObjects[0].id;

    this.props.setClickedObjects(clickedObjects);
  }

  handleRemoveWikiref(event) {
    var clickedObjects = this.props.getClickedObjects();

    clickedObjects[0].wikiref = null;
    this.changeSelectionWikiref = false;

    this.props.setClickedObjects(clickedObjects);
  }

  handleSetWikiref() {
    var clickedObjects = this.props.getClickedObjects();

    this.changeSelectionWikiref = false;

    this.props.setClickedObjects(clickedObjects);
  }

  handleChangeWikiref() {
    var clickedObjects = this.props.getClickedObjects();

    this.changeSelectionWikiref = true;

    this.props.setClickedObjects(clickedObjects);
  }

  handleRelink() {
    var clickedObjects = this.props.getClickedObjects();

    this.props.setRelink(clickedObjects[0]);

    this.props.setClickedObjects(clickedObjects);

    this.props.setDisableDataActions(true);
  }

  handleNewView() {
    var clickedObjects = this.props.getClickedObjects();

    this.props.setNewView(clickedObjects[0]);

    this.props.setClickedObjects(clickedObjects);
  }

  handleDeleteView() {
    var clickedObjects = this.props.getClickedObjects();

    this.props.setDeleteView(clickedObjects[0]);

    this.props.setClickedObjects(clickedObjects);
  }

  handleCopyView() {
    var clickedObjects = this.props.getClickedObjects();

    this.props.setCopyView(clickedObjects[0]);
  }

  handleToggleLinkType() {
    var clickedObjects = this.props.getClickedObjects();

    if (clickedObjects[0].type === "solid") {
      clickedObjects[0].type = "dashed";
    } else if (clickedObjects[0].type === "dashed") {
      clickedObjects[0].type = "solid";
    }

    this.props.setClickedObjects(clickedObjects);
  }

  handleToggleBlobType() {
    var clickedObjects = this.props.getClickedObjects();

    if (clickedObjects[0].type === "circle") {
      clickedObjects[0].type = "square";
      clickedObjects[0].x = clickedObjects[0].x - clickedObjects[0].r;
      clickedObjects[0].y = clickedObjects[0].y - clickedObjects[0].r;
    } else if (clickedObjects[0].type === "square") {
      clickedObjects[0].type = "circle";
      clickedObjects[0].x = clickedObjects[0].x + clickedObjects[0].r;
      clickedObjects[0].y = clickedObjects[0].y + clickedObjects[0].r;
    }

    this.props.setClickedObjects(clickedObjects);
  }

  prepareBlobSelectionText(blob) {
    var blobType;
    if (blob.type === "square") {
      blobType = "Stock:";
    } else if (blob.type === "circle") {
      blobType = "Process:";
    }

    this.selectionText = <div className="selection-info-component__selection-text">
        <label className="selection-info-component__selection-text__label"> {blobType}
          <input className="selection-info-component__selection-text__input selection-info-component__cancel-draggable"
            value = {(blob.text) ? (blob.text) : ""}
            onChange = {this.handleSelectionTextChange}
          />
        </label>
      </div>
  }

  prepareLinkSelectionText(link) {
    this.selectionText = <div className="selection-info-component__selection-text">
        <label className="selection-info-component__selection-text__label"> Flow:
          <input className="selection-info-component__selection-text__input selection-info-component__cancel-draggable"
            value = {(link.text) ? (link.text) : ""}
            onChange = {this.handleSelectionTextChange}
          />
        </label>
      </div>
  }

  prepareSelectionWikiref(clickedObject) {
    if(clickedObject.wikiref !== null) {
      if(this.changeSelectionWikiref === true) {
        this.selectionWikiref = <div className="selection-info-component__selection-wikiref">
            <label className="selection-info-component__selection-wikiref__label">Wiki reference:
              <div className="selection-info-component__selection-wikiref__existing-wikiref">
                <input className="selection-info-component__selection-wikiref__existing-wikiref__input selection-info-component__cancel-draggable"
                  value = {clickedObject.wikiref}
                  onChange = {this.handleSelectionWikirefChange}
                />
              </div>
            </label>
            <button className="selection-info-component__selection-wikiref__set-button selection-info-component__cancel-draggable"
              onClick={this.handleSetWikiref}>
              Set
            </button>
            <button className="selection-info-component__selection-wikiref__remove-button selection-info-component__cancel-draggable"
              onClick={this.handleRemoveWikiref}>
              Remove
            </button>
          </div>
      } else {
        this.selectionWikiref = <div className="selection-info-component__selection-wikiref">
            <div className="selection-info-component__selection-wikiref__text">
              Wiki reference:
            </div>
            <div className="selection-info-component__selection-wikiref__existing-wikiref">
              <a className="selection-info-component__selection-wikiref__existing-wikiref__link selection-info-component__cancel-draggable"
                href={"wiki/" + clickedObject.wikiref}
                target="_blank" 
                rel="noopener noreferrer">
                {clickedObject.wikiref}
              </a>
            </div>
            <button className="selection-info-component__selection-wikiref__change-button selection-info-component__cancel-draggable"
              onClick={this.handleChangeWikiref}>
              Change
            </button>
            <button className="selection-info-component__selection-wikiref__remove-button selection-info-component__cancel-draggable"
              onClick={this.handleRemoveWikiref}>
              Remove
            </button>
          </div>
      }
    } else {
      this.selectionWikiref = <div className="selection-info-component__selection-wikiref">
          <button className="selection-info-component__selection-wikiref__add-button selection-info-component__cancel-draggable"
            onClick={this.handleAddWikiref}>
            Add Wiki Reference
          </button>
        </div>
    }
  }

  prepareBlobSelectionActions(blob) {
    if (blob.child !== null) {
      var blobType;
      if (blob.type === "square") {
        blobType = "stock";
      } else if (blob.type === "circle") {
        blobType = "process";
      }
      this.selectionActions = <div className="selection-info-component__selection-actions">
          <div className="selection-info-component__selection-actions__subview-text">
            This {blobType} has a subsystem.
          </div>
          <button className={(this.props.getDisableDataActions()) ? ("selection-info-component__selection-actions__delete-subview-button selection-info-component__selection-actions__delete-subview-button_disabled selection-info-component__cancel-draggable") : ("selection-info-component__selection-actions__delete-subview-button selection-info-component__cancel-draggable")}
            disabled={this.props.getDisableDataActions()}
            onClick={this.handleDeleteView}>
            Delete Subsystem
          </button>
          <button className={(this.props.getDisableDataActions()) ? ("selection-info-component__selection-actions__copy-view-button selection-info-component__selection-actions__copy-view-button_disabled selection-info-component__cancel-draggable") : ("selection-info-component__selection-actions__copy-view-button selection-info-component__cancel-draggable")}
            disabled={this.props.getDisableDataActions()}
            onClick={this.handleCopyView}>
            Copy Stock/Process
          </button>
          <button className="selection-info-component__selection-actions__change-blob-type-button selection-info-component__cancel-draggable"
            onClick={this.handleToggleBlobType}>
            Toggle Stock/Process
          </button>
        </div>
    } else {
      this.selectionActions = <div className="selection-info-component__selection-actions">
          <button className={(this.props.getDisableDataActions()) ? ("selection-info-component__selection-actions__create-subview-button selection-info-component__selection-actions__create-subview-button_disabled selection-info-component__cancel-draggable") : ("selection-info-component__selection-actions__create-subview-button selection-info-component__cancel-draggable")}
            disabled={this.props.getDisableDataActions()}
            onClick={this.handleNewView}>
            Create Subsystem
          </button>
          <button className={(this.props.getDisableDataActions()) ? ("selection-info-component__selection-actions__copy-view-button selection-info-component__selection-actions__copy-view-button_disabled selection-info-component__cancel-draggable") : ("selection-info-component__selection-actions__copy-view-button selection-info-component__cancel-draggable")}
            disabled={this.props.getDisableDataActions()}
            onClick={this.handleCopyView}>
            Copy Stock/Process
          </button>
          <button className="selection-info-component__selection-actions__change-blob-type-button selection-info-component__cancel-draggable"
            onClick={this.handleToggleBlobType}>
            Toggle Stock/Process
          </button>
        </div>
    }
  }

  prepareLinkSelectionActions(link) {
    this.selectionActions = <div className="selection-info-component__selection-actions">
        <div className="selection-info-component__selection-actions__source-text">
          Source: {link.source.text}
        </div>
        <div className="selection-info-component__selection-actions__target-text">
          Target: {link.target.text}
        </div>
        <button className={(this.props.getDisableDataActions()) ? ("selection-info-component__selection-actions__relink-button selection-info-component__selection-actions__relink-button_disabled selection-info-component__cancel-draggable") : ("selection-info-component__selection-actions__relink-button selection-info-component__cancel-draggable")}
          disabled={this.props.getDisableDataActions()}
          onClick={this.handleRelink}>
          Relink
        </button>
        <button className="selection-info-component__selection-actions__change-link-type-button selection-info-component__cancel-draggable"
          onClick={this.handleToggleLinkType}>
          Toggle Flow Type
        </button>
      </div>
  }

  componentWillUpdate() {
    var clickedObjects = this.props.getClickedObjects();

    if (clickedObjects[0] !== undefined) {
      var clickedObject = clickedObjects[0];

      if ((clickedObject.type === "circle") || (clickedObject.type === "square")) {
        if (this.state.display !== true) {
          this.setState({ display: true });
        }
        this.prepareBlobSelectionText(clickedObject);
        this.prepareSelectionWikiref(clickedObject);
        this.prepareBlobSelectionActions(clickedObject);
      } else if ((clickedObject.type === "solid") || (clickedObject.type === "dashed")) {
        if (this.state.display !== true) {
          this.setState({ display: true });
        }
        this.prepareLinkSelectionText(clickedObject);
        this.prepareSelectionWikiref(clickedObject);
        this.prepareLinkSelectionActions(clickedObject);
      } else {
        if (this.state.display !== false) {
          this.setState({ display: false });
        }
        this.selectionText = "";
        this.selectionWikiref = "";
        this.selectionActions = "";

        this.changeSelectionWikiref = false;
      }
    } else {
      if (this.state.display !== false) {
        this.setState({ display: false });
      }
      this.selectionText = "";
      this.selectionWikiref = "";
      this.selectionActions = "";

      this.changeSelectionWikiref = false;
    }
  }

  render() {
    return (
      <div className={(this.state.display) ? ("selection-info-component")
          : ("selection-info-component_disabled")}
        style={this.props.style}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
        onTouchStart={this.props.onTouchStart}
        onTouchEnd={this.props.onTouchEnd}>
        {this.selectionText}
        {this.selectionWikiref}
        {this.selectionActions}
      </div>
    );
  }
}
