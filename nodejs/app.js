"use strict";
var express = require("express"); //import express, because I want easier management of get and post requests.
var bodyParser = require("body-parser"); //import body-parser, because I can't manage post data without it..
var MySql = require("sync-mysql"); //sync-mysql is used to create a synchronous database connection
const { type } = require("os");

//Database Connectivity
const options = {
  user: "p14",
  password: "39F8LY",
  database: "p14venus",
  host: "dataanalytics.temple.edu",
};

// create the connection
const connection = new MySql(options);

var app = express(); //the express method returns an instance of a app object
app.use(bodyParser.urlencoded({ extended: false })); //use this because incoming data is urlencoded

// CORS Headers
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  next(); //go process the next matching condition
});

//supporting functions go here

//terminalWrite is the last supporting function to run.  It sends
// output to the API consumer and ends the response.
// This is hard-coded to always send a json response.
var terminalWrite = function (res, Output, responseStatus) {
  res.writeHead(responseStatus, { "Content-Type": "application/json" });
  res.write(JSON.stringify(Output));
  res.end();
};

// ERROR TRAPPING FOR EVENT HANDLERS GO HERE //

app.put("/addlike", function (req, res, next) {
  let tip_id = req.body.tip_id;
  let tip_likes = req.body.tip_likes;

  if (tip_id == undefined) {
    terminalWrite(res, "Request failed. No tip id provided.", 400);
    return;
  }
  if (tip_likes == undefined) {
    terminalWrite(res, "Request failed. No tip like provided.", 400);
    return;
  }
  if (isNaN(tip_id)) {
    terminalWrite(res, "Request failed. Non-numeric tip_id provided.", 400);
    return;
  }
  if (isNaN(tip_likes)) {
    terminalWrite(res, "Request failed. Non-numeric tip_like provided.", 400);
    return;
  }
  // no errors move on
  next();
});


app.post("/sendtip", function (req, res, next) {
  //hand new tips that are sent
  let tip_message = req.body.tip_message;
  let user_id = req.body.userid;

  if (tip_message == undefined) {
    terminalWrite(res, "Request failed. No tip message provided.", 400);
    return;
  }
  if (user_id == undefined) {
    terminalWrite(res, "Request failed. No user_id provided.", 400);
    return;
  }
  if (isNaN(user_id)) {
    //400 error!
    terminalWrite(res, "Request failed. Non-numeric user_id provided.", 400);
    return;
  }

  // no errors move on
  next();
});

app.post("/total", function (req, res, next) {
  let user_id = req.body.userid;
  let display_name = req.body.display_name;
  let totalScore = req.body.totalScore;

  if (user_id == undefined) {
    terminalWrite(res, "Request failed. No user_id provided.", 400);
    return;
  }
  if (isNaN(user_id)) {
    //400 error!
    terminalWrite(res, "Request failed. Non-numeric user_id provided.", 400);
    return;
  }
  if (display_name == undefined) {
    //400 error!
    terminalWrite(res, "Request failed. No display name provided.", 400);
    return;
  }
  if (totalScore == undefined) {
    //400 error!
    terminalWrite(res, "Request failed. No total score provided.", 400);
    return;
  }
  if (isNaN(totalScore)) {
    //400 error!
    terminalWrite(res, "Request failed. Non-numeric total score provided.", 400);
    return;
  }

  // no errors move on
  next();
});

//app event handlers go here

app.get("/", function (req, res) {
  //what to do if request has no route ... show instructions
  var message = [];
  message[0] =
    "POST to /total with home,home2,food,shopping,travel,travel2,travel3." +
    "You will get back a total score";
  message[1] = "GET to /leaderboard to get back the top 5 users and scores";
  message[2] = "Get to /loadtips to get tip_id, tip_message, tip_likes information";
  message[3] = "POST to /sendtip and provide tip_message, tip_likes, user_id";
  terminalWrite(res, message, 200);
  return;
});

app.get("/leaderboard", function (req, res) {
  //return top 10 users and scores
  try {
    let results = connection.query(
      "select display_name,total_score from leaderboard order by total_score desc limit 5;"
    );
    terminalWrite(res, results, 200);
    return;
  } catch (e) {
    console.log(e);
    terminalWrite(res, "Internal server error", 500);
    return;
  }
});

app.post("/total", function (req, res) {
  // handle post requests to total route
  var user_id = req.body.userid;
  var display_name = req.body.display_name;
  var totalScore = req.body.totalScore;
  console.log("User:", user_id, "logged score of:", totalScore);

  try {
    let sqlTxtDelete = "delete from leaderboard where user_id = ?;";
    let sqlTxtInsert =
      "insert into leaderboard (user_id,display_name,total_score) values (?, ?, ?);";
    //Delete current record and insert new one every time
    var x = connection.query(sqlTxtDelete, [user_id]);
    var results = connection.query(sqlTxtInsert, [
      user_id,
      display_name,
      totalScore,
    ]);
    terminalWrite(res, results, 200);
    return;
  } catch (e) {
    console.log("Internal server error", e);
    terminalWrite(res, e, 500);
    return;
  }
});

app.post("/sendtip", function (req, res) {
  //hand new tips that are sent
  var tip_likes = 0;
  var tip_message = req.body.tip_message;
  var user_id = req.body.userid;
  var sqlTxt =
    "insert into tips (tip_message, tip_likes, user_id) values (?, ?, ?);";

  try {
    let results = connection.query(sqlTxt, [tip_message, tip_likes, user_id]);
    console.log("User", user_id, "logged tip:", tip_message);
    terminalWrite(res, results, 200);
    return;
  } catch (e) {
    console.log(e);
    terminalWrite(res, "An internal server error has occurred...", 500);
    return;
  }
});

app.get("/loadtips", function (req, res) {
  // get tips for tipboard
  let sqlTxt =
    "select tip_id, tip_message, tip_likes, date_created from tips order by date_created;";

  try {
    let results = connection.query(sqlTxt);
    terminalWrite(res, results, 200);
    return;
  } catch (e) {
    console.log(e);
    terminalWrite(res, "An internal server error has occurred...", 500);
    return;
  }
});

app.put("/addlike", function (req, res) {
  // add a like to the tip
  let tip_likes = req.body.tip_likes;
  let tip_id = req.body.tip_id;
  let sqlTxt = `update tips set tip_likes = ${tip_likes} where tip_id = ${tip_id};`;

  try {
    let results = connection.query(sqlTxt);
    terminalWrite(res, results, 200);
    console.log("Someone liked a post");
    return;
  } catch (e) {
    console.log(e);
    terminalWrite(res, "An internal server error has occurred...", 500);
    return;
  }

});

//This piece of code creates the server
//and listens for a request on a port
//we are also generating a console message once the
//server is created
var server = app.listen(8220, function () {
  var port = server.address().port;
  console.log("The server is listening on port:" + port);
});
