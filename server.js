'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);
var bodyParser = require("body-parser");
var dns = require('dns');
var url = require("url");

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGOLAB_URI);

var Schema = mongoose.Schema;
var urlSchema = new Schema({
  url: String
});

urlSchema.plugin(AutoIncrement, {inc_field: 'id'});

var Url = mongoose.model('Url', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.route("/api/shorturl/new")
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/shorturl.html');
  })
  .post(function (req, res) {
    
    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    
    if (pattern.test(req.body.url)) {
      
      var result = url.parse(req.body.url);
      console.log(result.hostname);

      var w3 = dns.lookup(result.hostname, function (err, addresses, family) {
        if (err) res.json({"error":"invalid URL"});

        var newurl = new Url({ url: req.body.url });
        newurl.save(function (err, doc) {
          if (err) return err;
          // saved!
          res.json({"original_url": doc.url, "short_url":doc.id});
        });
        console.log(addresses);

      });
      
    } else {
      res.json({"error":"invalid URL"});
    }
  
  });

app.get("/api/shorturl/:id", function (req, res) {
  
  Url.findOne({ id: req.params.id }, function (err, doc) {
    
    if (err) return err;
    
    if (doc === null) {
      res.json({"error":"URL not found!"});
    } else {
      res.redirect(doc.url);
    }

  });
  
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});