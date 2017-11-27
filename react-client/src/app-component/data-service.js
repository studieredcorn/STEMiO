export class DataService {
  constructor (defaultURL, setData, getData) {
    this.defaultURL = defaultURL;

    this.collectionName = "";
    this.connectString = ""

    this.setData = setData;
    this.getData = getData;
  }

  sendGetConfiguration() {
    var  _this = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "http://" + _this.defaultURL + "/web/getConfiguration", true);
        xhr.send();
        xhr.addEventListener("readystatechange", processRequest, false);
        xhr.onreadystatechange = processRequest;
        xhr.onerror = processError;
        xhr.onabort = processError;

        function processRequest(e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              resolve(response);
            } else {
              var error = xhr.statusText;
              reject("HTTP error: " + error);
            }
          }
        }

        function processError(error) {
          reject("Network error: " + error.target.status);
        }
      });
  }

  sendGetExistingCollections() {
    var  _this = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', "http://" + _this.defaultURL + "/web/getExistingCollections", true);
        xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({ connectString:  _this.connectString,
          collectionName: _this.collectionName }));
        xhr.addEventListener("readystatechange", processRequest, false);
        xhr.onreadystatechange = processRequest;
        xhr.onerror = processError;
        xhr.onabort = processError;

        function processRequest(e) {
          var errorText = null;

          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              if (response.success) {
                var parsedExistingCollections = [];
                for (var i = 0; i < response.existingCollections.length; i++) {
                  if (response.existingCollections[i].name !== "system.indexes") {
                    parsedExistingCollections.push(response.existingCollections[i].name);
                  }
                }
                return resolve(parsedExistingCollections);
              } else {
                errorText = "sendExistingCollections failed: " + response.error;
              }
            } else {
              errorText = "HTTP error: " + xhr.statusText;
            }
          }

          if (errorText) {
            reject(errorText);
          }
        }

        function processError(error) {
          reject("Network error: " + error.target.status);
        }
      });
  }

  sendGetData() {
    var _this = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', "http://" + _this.defaultURL + "/web/getData", true);
        xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({ connectString:  _this.connectString,
          collectionName: _this.collectionName }));
        xhr.addEventListener("readystatechange", processRequest, false);
        xhr.onreadystatechange = processRequest;
        xhr.onerror = processError;
        xhr.onabort = processError;

        function processRequest(e) {
          var errorText = null;

          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              if (response.success) {
                return resolve(response.objects);
              } else {
                errorText = "sendGetData failed: " + response.error;
              }
            } else {
              errorText = "HTTP error: " + xhr.statusText;
            }
          }

          if (errorText) {
            reject(errorText);
          }
        }

        function processError(error) {
          reject("Network error: " + error.target.status);
        }
      });
  }

  sendDeleteData() {
    var _this = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', "http://" + _this.defaultURL + "/web/deleteData", true);
        xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({ connectString: _this.connectString,
          collectionName: _this.collectionName }));
        xhr.addEventListener("readystatechange", processRequest, false);
        xhr.onreadystatechange = processRequest;
        xhr.onerror = processError;
        xhr.onabort = processError;

        function processRequest(error) {
          var errorText = null;

          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              if (response.success) {
                return resolve(response.result);
              } else {
                errorText = "sendDeleteData failed: " + response.error;
              }
            } else {
              errorText = "HTTP error: " + xhr.statusText;
            }
          }

          if (errorText) {
            reject(errorText);
          }
        }

        function processError(error) {
          reject("Network error: " + error.target.status);
        }
      });
  }

  sendSendData() {
    var _this = this;

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', "http://" + _this.defaultURL + "/web/sendData", true);
        xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        xhr.send(JSON.stringify({ connectString: _this.connectString,
          collectionName: _this.collectionName,
          data: _this.getData(true) }));
        xhr.addEventListener("readystatechange", processRequest, false);
        xhr.onreadystatechange = processRequest;
        xhr.onerror = processError;
        xhr.onabort = processError;

        function processRequest(error) {
          var errorText = null;

          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              if (response.success) {
                return resolve(response.writeOpResult);
              } else {
                errorText = "sendSendData failed: " + response.error;
              }
            } else {
              errorText = "HTTP error: " + xhr.statusText;
            }
          }

          if (errorText) {
            reject(errorText);
          }
        }

        function processError(error) {
          reject("Network error: " + error.target.status);
        }
      });
  }

}
