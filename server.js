const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const path = require('path');
var MongoClient = require('mongodb').MongoClient;  
var urlMongo = "mongodb://viery15:mendol817@cluster0-shard-00-00-aybsr.mongodb.net:27017,cluster0-shard-00-01-aybsr.mongodb.net:27017,cluster0-shard-00-02-aybsr.mongodb.net:27017/travel_planner?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority"; 
MongoClient.connect(urlMongo, function(err, db) {
  if(err) {
    throw err
  }
  else {
      console.log("mantap")
  }
});
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

//routes
var routes = require('./routes');
routes(app);

const port = process.env.PORT || 3000;

app.listen(port, () => console.log("server running on port "+port));