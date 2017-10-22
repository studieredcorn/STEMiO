import React from 'react';

import './load-save-component.css'

export class LoadSave extends React.Component {
  constructor(props) {
    super(props);

    this.state = { existingCollections: "",

      collectionName: "",

      successText: "",
      errorText: "",
      recentCollection: "" };

    this.handleGetExistingCollections=this.handleGetExistingCollections.bind(this);
    this.handleCollectionNameChange=this.handleCollectionNameChange.bind(this);
    this.handleGetData=this.handleGetData.bind(this);
    this.handleSendData=this.handleSendData.bind(this);
    this.handleCreateData=this.handleCreateData.bind(this);
  }

  componentWillMount() {
    // Here we get the default configuration from the server. The structure is:
    // { mongoDB:  { defaultCollectionName,
    //               defaultConnectString } }
    var _this = this;

    this.props.dataService.sendGetConfiguration()
      .then( function(configuration) {
          _this.setState({ collectionName: configuration.mongoDB.defaultCollectionName });
          _this.props.dataService.collectionName = configuration.mongoDB.defaultCollectionName;
        },
        function(error) {});
  }

  handleGetExistingCollections() {
    var _this = this;

    this.props.dataService.sendGetExistingCollections()
      .then( function(existingCollections) {
          var newSelectElement;
          var newOptionsElements = [];
          for (var i = 0; i < existingCollections.length; i++) {
            newOptionsElements.push(<option value={existingCollections[i]}
              className="load-save-component__existing-collections-option">
              {existingCollections[i]}
            </option>);
          }
          newSelectElement = <select
              className="load-save-component__existing-collections-select"
              size="5"
              onChange={_this.handleCollectionNameChange}>
              {newOptionsElements}
            </select>;
          _this.setState({ existingCollections: newSelectElement });


          _this.setState({ successText: "There are " + newOptionsElements.length + " existing collections." });
          _this.setState({ errorText: "" });
          _this.setState({ recentCollection: "" });
        },
        function(error) {
          _this.setState({ successText: "" });
          _this.setState({ errorText: error });
          _this.setState({ recentCollection: "" });
        });
  }

  handleCollectionNameChange(event) {
    this.setState({ collectionName: event.target.value });
    this.props.dataService.collectionName = event.target.value;
  }

  handleGetData() {
    // This method handles whenever a user presses the "Get data" button:
    // we ask dataService to send a POST request to the server to fetch
    // our stemio system data

    var _this = this;

    this.props.dataService.sendGetData(this.props.dataService.collectionName)
      .then(function(results){
          _this.props.setClickedObjects([]);
          _this.props.dataService.setData(results);
          _this.setState({ successText: "Retrieved " + results.length + " systems from collection '" + _this.props.dataService.collectionName + "'." });
          _this.setState({ errorText: "" });
          _this.setState({ recentCollection: _this.props.dataService.collectionName });
          _this.props.setResetViewId();
        },
        function(error) {
          _this.props.dataService.setData([]);
          _this.setState({ successText: "" });
          _this.setState({ errorText: error });
          _this.setState({ recentCollection: "" });
        });
  }

  handleSendData() {
    // This method handles whenever a user presses the "Send data" button:
    // we ask dataService to send a POST request to the server to send our
    // stemio system data

    var _this = this;

    this.props.dataService.sendSendData(this.props.dataService.collectionName, this.props.dataService.getData(true))
      .then(function(results) {
          _this.setState({ successText: "Saved " + results.insertedCount + " systems to collection '" + _this.props.dataService.collectionName + "'." });
          _this.setState({ errorText: "" });
          _this.setState({ recentCollection: _this.props.dataService.collectionName });
        }, function(error) {
          _this.setState({ successText: "" });
          _this.setState({ errorText: error });
        });
    
  }

  handleCreateData() {
    // This method handles whenever a user presses the "Create data" button:
    // we call our Main Page component to set a flag to tell Toggly to
    // create a new default view

    this.props.setClickedObjects([]);
    this.props.dataService.setData([]);
    this.props.setResetViewId();
    this.props.setCreateData();
    this.setState({ successText: "Created 1 new system." });
    this.setState({ errorText: "" });
    this.setState({ recentCollection: "" });
  }

  render() {
    return(
      <div className="load-save-component">
        <button onClick={this.handleGetExistingCollections}
          className="load-save-component__get-existing-collections-button">
          Get Existing Systems
        </button>
        {this.state.existingCollections}
        <label className="load-save-component__choose-system-label">
          Choose system:
          <div className="load-save-component__input-area">
            <input className="load-save-component__input-area__input"
              value={this.state.collectionName}
              onChange={this.handleCollectionNameChange}
            />
          </div>
        </label>
        <button onClick={this.handleGetData}
          className={(this.props.getDisableDataActions()) ? ("load-save-component__get-system-button load-save-component__get-system-button_disabled") : ("load-save-component__get-system-button")}
          disabled={this.props.getDisableDataActions()}>
          Get System
        </button>
        <button onClick={this.handleSendData}
          className={(this.props.getDisableDataActions()) ? ("load-save-component__save-system-button load-save-component__save-system-button_disabled") : ("load-save-component__save-system-button")}
          disabled={this.props.getDisableDataActions()}>
          Save System
        </button>
        <button onClick={this.handleCreateData}
          className={(this.props.getDisableDataActions()) ? ("load-save-component__create-system-button load-save-component__create-system-button_disabled") : ("load-save-component__create-system-button")}
          disabled={this.props.getDisableDataActions()}>
          Create System
        </button>
        <div className="load-save-component__success-message">
          {(this.state.successText) ? this.state.successText : ""}
        </div>
        <div className="load-save-component__error-message">
          {(this.state.errorText) ? this.state.errorText : ""}
        </div>
        <div className="load-save-component__spacer"></div>
      </div>
      );
  }
}
