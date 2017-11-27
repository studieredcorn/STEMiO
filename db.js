var MongoClient = require('mongodb').MongoClient;

function DB() {
  this.db = null;
}

DB.prototype.connect = function(connectString) {
  var _this = this;

  return new Promise(function(resolve, reject) {
      if (_this.db) {
        resolve();
      } else {
        MongoClient.connect(connectString).then(function(database) {
            _this.db = database;
            console.log("Connected to database using URI: " + connectString);
            resolve();
          },
          function(err) {
            console.log("Error connecting to database: " + err.message);
            reject(err.message);
          })
      }
    });
}

DB.prototype.close = function() {
  if (this.db) {
    this.db.close().then(function() {
      },
      function(error) {
        console.log("Failed to close the database connection: " + error.message);
      });
  }
}

DB.prototype.getExistingCollections = function(collectionName) {
  var _this = this;

  return new Promise(function(resolve, reject) {
      var collections = _this.db.listCollections({}).toArray(function (error, items) {
          if (error) {
            console.log("DB.sendData failed: Could not list collections: " + error.message);
            reject(error.message);
          } else {
            resolve(items);
          }
        });
    });
}

DB.prototype.getData = function(collectionName) {
  var _this = this;

  return new Promise(function(resolve, reject) {
      _this.db.collection(collectionName, {strict:true}, function(error, collection) {
          if (collectionName === "system.indexes") {
            var message = "DB.getData failed: cannot fetch data from system.indexes";
            console.log(message);
            reject(message);
          } else if (error) {
            console.log("DB.getData failed: Could not access the database collection: " + error.message);
            reject(error.message);
          } else {
            collection.find({}).toArray(function (error, documents) {
                if (error) {
                  console.log("DB.getData fetching failed: " + error.message);
                  reject(error.message);
                } else {
                  resolve(documents);
                }
              });
          }
        });
    });
}

DB.prototype.deleteData = function(collectionName) {
  var _this = this;

  return new Promise(function(resolve, reject) {
      if (collectionName === "system.indexes") {
        var message = "DB.deleteData failed: cannot delete system.indexes";
        console.log(message);
        reject(message);
      } else {
        _this.db.dropCollection(collectionName, function(error, result) {
            if (error) {
              console.log("DB.deleteData failed: " + error.message);
              reject(error.message);
            } else {
              resolve(result);
            }
          });
      }
    });
}

DB.prototype.sendData = function(collectionName, data) {
  var _this = this;

  return new Promise(function(resolve, reject) {
      var collections = _this.db.listCollections({ name: collectionName }).toArray(function (error, items) {
        if (error) {
          console.log("DB.sendData failed: Could not list collections: " + error.message);
          reject(error.message);
        } else {
          if (items.length === 0) {
            _this.db.createCollection(collectionName, {}, function (error, collection) {
                if (error) {
                  console.log("DB.sendData failed: Could not create the database collection: " + error.message);
                  reject(error.message);
                } else {
                  collection.insertMany(data, function(error, result) {
                      if (error) {
                        console.log("DB.sendData writing failed: " + error.message);
                        reject(error.message);
                      } else {
                        resolve(result);
                      }
                    });
                }
              });
          } else {
            _this.db.collection(collectionName, { strict: true }, function(error, collection) {
                if (error) {
                  console.log("DB.sendData failed: Could not access the database collection: " + error.message);
                  reject(error.message);
                } else {
                  collection.deleteMany({}, null, function (error, result) {
                      if (error) {
                        console.log("DB.sendData deleting failed: " + error.message);
                        reject(error.message);
                      } else {
                        collection.insertMany(data, function(error, result) {
                            if (error) {
                              console.log("DB.sendData writing failed: " + error.message);
                              reject(error.message);
                            } else {
                              resolve(result);
                            }
                          });
                      }
                    });
                }
              });
          }
        }
      });
    });
}

module.exports = DB;
