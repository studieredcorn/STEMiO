var express = require('express');
var router = express.Router();

var configuration = require('../configuration.js');


router.get('*', function (req, res, next) {
    res.redirect(configuration.wikiHostname + req.path);
  });

module.exports = router;
