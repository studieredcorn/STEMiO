var express = require('express');
var router = express.Router();

var configuration = require('../configuration.js');
var DB = require('../db.js');


router.get('/getConfiguration', function(req, res, next) {
    res.json(configuration.client);
  });

router.post('/getExistingCollections', function(req, res, next) {
  var database = new DB;

  database.connect(req.body.connectString).then(function() {
      return database.getExistingCollections();
    })
    .then(function(existingCollections) {
        return { "success": true,
          "existingCollections": existingCollections,
          "error": "" };
      },
      function(err) {
        console.log("Failed to retrieve existing collections: " + err);
        return { "success": false,
          "existingCollections": null,
          "error": "Failed to retrieve existing collections: " + err };
      })
      .then(function(resultObject) {
          database.close();
          res.json(resultObject);
        });
  });

router.post('/getData', function(req, res, next) {
    var database = new DB;

    database.connect(req.body.connectString).then(function() {
        return database.getData(req.body.collectionName);
      })
      .then(function(objects) {
          return {
            "success": true,
            "objects": objects,
            "error": "" };
        },
        function(err) {
          console.log("Failed to retrieve objects: " + err);
          return {
            "success": false,
            "objects": null,
            "error": "Failed to retrieve objects: " + err };
        })
      .then(function(resultObject) {
          database.close();
          res.json(resultObject);
        });
  });


router.post('/sendData', function(req, res, next) {
  var database = new DB;

  database.connect(req.body.connectString).then(function() {
      return database.sendData(req.body.collectionName, req.body.data);
    })
    .then(function(writeOpResult) {
        return {
          "success": true,
          "writeOpResult": writeOpResult,
          "error": "" };
      },
      function(error) {
        console.log("Failed to send data: " + error);
        return {
          "success": false,
          "writeOpResult": null,
          "error": "Failed to send data: " + error };
      })
    .then(function(resultObject) {
        database.close();
        res.json(resultObject);
      });
  });


module.exports = router;
