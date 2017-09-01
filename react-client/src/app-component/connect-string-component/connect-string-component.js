import React from 'react';

import './connect-string-component.css';

export class ConnectString extends React.Component {
  constructor(props) {
    super(props);

    this.state = { connectString: "" };

    this.handleConnectStringChange=this.handleConnectStringChange.bind(this);
  }

  componentDidMount() {
    // Here we get the default connection configuration from the server. The structure is:
    // { mongoDB:     { defaultCollectionName,
    //                  defaultConnectString } }

    var _this = this;

    this.props.dataService.sendGetConfiguration()
      .then(function(configuration) {
          _this.setState({ connectString: configuration.mongoDB.defaultConnectString });
          _this.props.dataService.connectString = configuration.mongoDB.defaultConnectString;
        },
        function(error) {
            console.log("sendGetConfiguration failed: " + error);
        });
  }

  handleConnectStringChange(event) {
    this.setState({ connectString: event.target.value });
    this.props.dataService.connectString = event.target.value;
  }

  render() {
    return (
      <div className="connect-string-component">
        <label className="connect-string-component__label">
          Connect to system database: 
          <div className="connect-string-component__connect-string">
            <input type="text" className="connect-string-component__connect-string__input"
              value={this.state.connectString}
              onChange={this.handleConnectStringChange}
            />
          </div>
        </label>
      </div>
      );
  }
}
