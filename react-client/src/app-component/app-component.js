import React from 'react';
import Draggable from 'react-draggable';

import { DataService } from './data-service';
import { ConnectString } from './connect-string-component/connect-string-component';
import { LoadSave } from './load-save-component/load-save-component';
import { SelectionInfo } from './selection-info-component/selection-info-component';
import { Toggly } from './toggly-component/toggly-component';
import { Search } from './search-component/search-component';

import Popup from './popup-component/popup-component';

import './app-component.css';

class MainPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = { data: [],
      clickedObjects: [],

      resetViewId: false,
      createData: false,
      relink: false,
      newView: false,
      deleteView: false,
      renameView: false,
      disableDataActions: false };

    this.selectionInfoComponent = "";

    this.setData = this.setData.bind(this);
    this.getData = this.getData.bind(this);
    this.setClickedObjects = this.setClickedObjects.bind(this);
    this.getClickedObjects = this.getClickedObjects.bind(this);

    this.setResetViewId = this.setResetViewId.bind(this);
    this.setCreateData = this.setCreateData.bind(this);
    this.setRelink = this.setRelink.bind(this);
    this.setNewView = this.setNewView.bind(this);
    this.setDeleteView = this.setDeleteView.bind(this);
    this.setRenameView = this.setRenameView.bind(this);

    this.setDisableDataActions = this.setDisableDataActions.bind(this);
    this.getDisableDataActions = this.getDisableDataActions.bind(this);

    this.dataService = new DataService("localhost:49152",
      this.setData,
      this.getData);
  }

  componentWillUpdate() {
    this.selectionInfoComponent = <Draggable bounds="parent"
        cancel=".selection-info-component__cancel-draggable">
        <SelectionInfo
          dataService={this.dataService}

          setRelink={this.setRelink}
          setNewView={this.setNewView}
          setDeleteView={this.setDeleteView}
          setRenameView={this.setRenameView}

          getClickedObjects={this.getClickedObjects}
          setClickedObjects={this.setClickedObjects}

          getDisableDataActions={this.getDisableDataActions}
        />
      </Draggable>;
  }

  componentDidUpdate() {
    if (this.state.renameView !== false) {
      this.setState({ renameView: false });
    }
    if (this.state.relink !== false) {
      this.setState({ relink: false });
    }
    if (this.state.newView !== false) {
      this.setState({ newView: false });
    }
    if (this.state.deleteView !== false) {
      this.setState({ deleteView: false });
    }
    if (this.state.resetViewId !== false) {
      this.setState({ resetViewId: false });
    }
    if (this.state.createData !== false) {
      this.setState({ createData: false });
    }
  }

  setData(data) {
    this.setState({ data: data });
  }

  getData(prepareToSend) {
    var result = this.state.data;

    if (prepareToSend === true) {
      var preparedData = [];

      for (var i = 0; i < this.state.data.length; i++) {
        preparedData.push({ id: this.state.data[i].id,
          blobs: [],
          links: [],
          parent: this.state.data[i].parent,
          text: this.state.data[i].text });

        var skip = false;
        for (var j = 0; j < this.state.data[i].blobs.length; j++) {
          if ((this.state.data[i].blobs[j].type === "source") ||
            (this.state.data[i].blobs[j].type === "sink")) {
            if (this.state.data[i].blobs[j].gluedlinks.length === 0) {
              skip = true;
            }
          }
          if (skip === false) {
            preparedData[preparedData.length - 1].blobs.push({ text: this.state.data[i].blobs[j].text,
              wikiref: this.state.data[i].blobs[j].wikiref,
              child: this.state.data[i].blobs[j].child,
              type: this.state.data[i].blobs[j].type,
              x: this.state.data[i].blobs[j].x,
              fx: this.state.data[i].blobs[j].fx,
              y: this.state.data[i].blobs[j].y,
              fy: this.state.data[i].blobs[j].fy,
              r: this.state.data[i].blobs[j].r,
              gluedlinks: this.state.data[i].blobs[j].gluedlinks,
              parentlink: this.state.data[i].blobs[j].parentlink,
              id: this.state.data[i].blobs[j].id });
          }
          skip = false;
        }

        for (j = 0; j < this.state.data[i].links.length; j++) {
          var tempSource, tempTarget;
          if (typeof this.state.data[i].links[j].source === "object") {
            tempSource = this.state.data[i].links[j].source.id;
          } else {
            tempSource = this.state.data[i].links[j].source;
          }
          if (typeof this.state.data[i].links[j].target === "object") {
            tempTarget = this.state.data[i].links[j].target.id;
          } else {
            tempTarget = this.state.data[i].links[j].target;
          }

          preparedData[preparedData.length - 1].links.push({ text: this.state.data[i].links[j].text,
            wikiref: this.state.data[i].links[j].wikiref,
            source: tempSource,
            target: tempTarget,
            type: this.state.data[i].links[j].type,
            id: this.state.data[i].links[j].id,
            glued: this.state.data[i].links[j].glued });
        }
      }

      result = preparedData;
    }

    return result;
  }

  setClickedObjects(clickedObjects) {
    this.setState({ clickedObjects: clickedObjects });
  }

  getClickedObjects() {
    return this.state.clickedObjects;
  }

  setResetViewId(viewId) {
    if (viewId === undefined) {
      this.setState({ resetViewId: true });
    } else {
      this.setState({ resetViewId: viewId });
    }
  }

  setCreateData() {
    this.setState({ createData: true });
  }

  setRelink(link) {
    this.setState({ relink: link });
  }

  setNewView(blob) {
    this.setState({ newView: blob });
  }

  setDeleteView(blob) {
    this.setState({ deleteView: blob });
  }

  setRenameView(viewNamePair) {
    var newRenameView = [];
    var existing = false;

    if (this.state.renameView !== false) {
      for (var i = 0; i < this.state.renameView.length; i++) {
        if (viewNamePair.viewId === this.state.renameView[i].viewId) {
          newRenameView.push(viewNamePair);
          existing = true;
        } else {
          newRenameView.push(this.state.renameView[i]);
        }
      }
    }
    if (existing === false) {
      newRenameView.push(viewNamePair);
    }

    this.setState({ renameView: newRenameView });
  }

  setDisableDataActions(disableDataActions) {
    this.setState({ disableDataActions: disableDataActions });
  }

  getDisableDataActions() {
    return this.state.disableDataActions;
  }

  render() {
    return (
      <div>
        <div className="logo">
          <div className="logo__image">
          </div>
        </div>
        <Toggly
          dataService={this.dataService}
          popup={Popup}

          resetViewId={this.state.resetViewId}
          createData={this.state.createData}
          relink={this.state.relink}
          newView={this.state.newView}
          deleteView={this.state.deleteView}
          renameView={this.state.renameView}

          getClickedObjects={this.getClickedObjects}
          setClickedObjects={this.setClickedObjects}

          getDisableDataActions={this.getDisableDataActions}
          setDisableDataActions={this.setDisableDataActions}

          selectionInfoComponent={this.selectionInfoComponent}
        />
        <ConnectString
          dataService={this.dataService}
        />
        <LoadSave
          dataService={this.dataService}

          setCreateData={this.setCreateData}
          setResetViewId={this.setResetViewId}

          getClickedObjects={this.getClickedObjects}
          setClickedObjects={this.setClickedObjects}

          getDisableDataActions={this.getDisableDataActions}
        />
        <Search
          dataService={this.dataService}

          setResetViewId={this.setResetViewId}

          setClickedObjects={this.setClickedObjects}

          getDisableDataActions={this.getDisableDataActions}
        />
      </div>
    );
  }
}

class App extends React.Component {
  render() {
    return (
        <MainPage />
      );
  }
}

export default App;
