import React from 'react';

import './search-component.css';

export class Search extends React.Component {
  constructor(props) {
    super(props);

    this.searchResults = [];
    this.state = { searchSelection: "",
      searchString: "" };

    this.handleSearchStringChange = this.handleSearchStringChange.bind(this);
    this.handleSearchResultsChange = this.handleSearchResultsChange.bind(this);
    this.populateSearchSelection = this.populateSearchSelection.bind(this);

    this.searchData = this.searchData.bind(this);
  }

  handleSearchStringChange(event) {
    this.setState({ searchString: event.target.value });

    if (event.target.value !== "") {
      this.searchResults = this.searchData(event.target.value);
      this.populateSearchSelection();
    } else {
      this.searchResults = [];
      this.setState({ searchSelection: "" });
    }
  }

  handleSearchResultsChange(event) {
    if (this.props.getDisableDataActions() === false) {
      this.props.setResetViewId(this.searchResults[event.target.value].viewId);
      this.props.setClickedObjects([ this.searchResults[event.target.value].object ]);
    }
  }

  populateSearchSelection() {
    var newSelectElement;
    var newOptionsElements = [];
    for (var i = 0; i < this.searchResults.length; i++) {
      newOptionsElements.push(<option value={i}
        className="search-component__search-results-option">
        {this.searchResults[i].object.text}
      </option>);
    }
    newSelectElement = <select
        className="search-component__search-results-select"
        size="5"
        onChange={this.handleSearchResultsChange}>
        {newOptionsElements}
      </select>;
    this.setState({ searchSelection: newSelectElement });
  }

  searchData(searchString) {
    var searchResults = [];
    var data = this.props.dataService.getData();
    var i, j;

    for (i = 0; i < data.length; i++) {
      for (j = 0; j < data[i].blobs.length; j++) {
        if (data[i].blobs[j].text.indexOf(searchString) !== -1) {
          if ((data[i].blobs[j].type !== "source") && (data[i].blobs[j].type !== "sink")) {
            searchResults.push({ viewId: data[i].id,
              object: data[i].blobs[j] });
          }
        }
      }
      for (j = 0; j < data[i].links.length; j++) {
        if (data[i].links[j].text.indexOf(searchString) !== -1) {
          searchResults.push({ viewId: data[i].id,
            object: data[i].links[j] });
        }
      }
    }

    return searchResults;
  }

  render() {
    return(
      <div className="search-component">
        <label className="search-component__search-text-label">
          Search in existing system:
          <div className="search-component__input-area">
            <input className="search-component__input-area__input"
              value={this.state.searchString}
              onChange={this.handleSearchStringChange}
            />
          </div>
        </label>
        {this.state.searchSelection}
      </div>
      );
  }
}
