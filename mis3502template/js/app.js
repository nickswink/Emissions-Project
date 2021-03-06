"use strict";

/* SOME CONSTANTS */
var endpoint01 = "http://misdemo.temple.edu/auth";
var endpoint02 = "http://18.211.85.199:8220";
localStorage.usertoken = 0;
localStorage.lastnavlink = "";

/* SUPPORTING FUNCTIONS */

var navigationControl = function (the_link) {
  /* manage the content that is displayed */
  var idToShow = $(the_link).attr("href");
  localStorage.lastnavlink = idToShow;

  // console.log(idToShow);

  if (idToShow == "#div-login") {
    /* what happens if the login/logout link is clicked? */
    localStorage.usertoken = 0;
    $(".secured").addClass("locked");
    $(".secured").removeClass("unlocked");
  }

  $(".content-wrapper").hide(); /* hide all content-wrappers */
  $(idToShow).show(); /* show the chosen content wrapper */
  $("html, body").animate({ scrollTop: "0px" }); /* scroll to top of page */
  $(".navbar-collapse").collapse(
    "hide"
  ); /* explicitly collapse the navigation menu */
};
/* end navigation control */

var getScores = function () {
  let home1 = $("#calc-home").val();
  let home2 = $("#calc-home2").val();
  let food = $("#calc-food").val();
  let shopping = $("#calc-shopping").val();
  let travel1 = $("#calc-travel").val();
  let travel2 = $("#calc-travel2").val();
  let travel3 = $("#calc-travel3").val();
  // Convert to numbers and add sums
  let home = Number(home1) + Number(home2);
  let travel = Number(travel1) + Number(travel2) + Number(travel3);
  food = Number(food);
  shopping = Number(shopping);
  let totalScore = home + travel + food + shopping;
  var scores = {
    totalScore: totalScore,
    homeScore: home,
    travelScore: travel,
    foodScore: food,
    shoppingScore: shopping,
  };
  return scores;
};

// chart loading function
var getChart = function () {
  let scores = getScores();
  let { travelScore, homeScore, foodScore, shoppingScore, totalScore } = scores;  //deconstruct

  var object = {
    header: ["Name", "score"],
    rows: [
      ["Travel", travelScore],
      ["Home", homeScore],
      ["Food", foodScore],
      ["Shopping", shoppingScore],
      ["Total", totalScore],
    ],
  };
  // create the chart
  var chart = anychart.bar();
  // add data
  chart.data(object);
  //set thick no spaces
  chart.barGroupsPadding(0);
  // draw
  chart.container("chart");
  chart.draw();
};
// end of getChart

var loadLeaderboard = function () {
  $("#leaderboard").html("");
  $.ajax({
    url: endpoint02 + "/leaderboard",
    type: "GET",
    success: function (result) {
      for (let i = 0; i < result.length; i++) {
        let { display_name, total_score } = result[i];  //deconstruct  
        $("#leaderboard").append(
          `<li><i class='fa fa-user'></i>&nbsp&nbsp ${display_name} ${total_score} points</li><br>`
        );
      }
    },
    error: function (result) {
      console.log(result);
      $("#leaderboard-error").addClass("alert alert-danger");
      $("#leaderboard-error").html("Hmm... Something went wrong. Check to see if the API is running");
    },
  });
};

var submitNewTotal = function (display_name, totalScore) {
  let the_serialized_data =
    $("#calculator").serialize() +
    "&userid=" +
    localStorage.usertoken +
    "&display_name=" +
    display_name +
    "&totalScore=" +
    totalScore;

  // console.log(the_serialized_data);

  $("#message").html("");

  // send all the scores to total and receieve back a final score
  $.ajax({
    url: endpoint02 + "/total",
    data: the_serialized_data,
    type: "POST",
    success: function (result) {
      // console.log(result);
      $("#message").addClass("alert alert-success");
      $("#message").html(
        "You logged a waste score of " +
        totalScore +
        ". Check the breakdown on the dashboard!"
      );
    },
    error: function (result) {
      console.log(result);
      $("#message").addClass("alert alert-danger");
      $("#message").html("Hmm... Something went wrong. Check to see if the API is running");
    },
  });
};

var sendTip = function () {
  // send tip to database with user specific id
  let the_serialized_data =
    $("#tip-form").serialize() + "&userid=" + localStorage.usertoken;
  // console.log(the_serialized_data);

  if ($("#tip_message").val() == "") {
    $("#tip-message").addClass("alert alert-danger");
    $("#tip-message").html("Tips can't be blank");
  } else {
    $.ajax({
      url: endpoint02 + "/sendtip",
      data: the_serialized_data,
      type: "POST",
      success: function (result) {
        // console.log(result);
        $("#tip-message").addClass("alert alert-success");
        $("#tip-message").html("Thanks for that!");
        $("#btnTip").hide();                                //
        document.getElementById("btnTip").disabled = true;  //prevent user from sending multiple tips
      },
      error: function (result) {
        console.log(result);
        $("#tip-message").addClass("alert alert-danger");
        $("#tip-message").html("An error occurred...");
      },
    });
  }
};

var loadTipBoard = function () {
  $.ajax({
    url: endpoint02 + "/loadtips",
    type: "GET",
    success: function (result) {
      for (let tip = 0; tip < result.length; tip++) {
        let { tip_message, tip_id, tip_likes } = result[tip];  //deconstruct
        $("#tipboard").append(`<li>${tip_message}<button class='btnLike' id=${tip_id} onClick='addLike(this, ${tip_likes})'></button><span>${tip_likes}</span></li>`); // some crazy thing with parents forced me to put the onClick event inside the button tag
      }
    },
    error: function (result) {
      console.log(result);
      $("#tipboard").addClass("alert alert-danger");
      $("#tipboard").html("Hmm... Something went wrong. Check to see if the API is running");
    },
  });
};

var addLike = function (likeButton, tip_likes) {
  let tip_id = $(likeButton).attr("id");
  let new_likes = tip_likes + 1;         // add one like
  let the_serialized_data = `tip_id=${tip_id}&tip_likes=${new_likes}`;

  $(likeButton).addClass("liked");  // liked turns blue
  $(likeButton).next().html(new_likes);   //displays the tip adding one
  document.getElementById(tip_id).disabled = true;  //disable button to prevent multiple requests

  $.ajax({
    url: endpoint02 + "/addlike",
    data: the_serialized_data,
    type: "PUT",
    success: function (result) {
      console.log(result);
    },
    error: function (result) {
      console.log(result);
    }
  });
};

var getRandomTip = function (phoneNumber) {

  //error checking
  if (isNaN(phoneNumber)) {
    $("#phoneNumberMessage").addClass("alert alert-danger");
    $("#phoneNumberMessage").html("Invalid phone number");
    return;
  }
  if (phoneNumber == '') {
    $("#phoneNumberMessage").addClass("alert alert-danger");
    $("#phoneNumberMessage").html("Phone number can't be blank");
    return;
  }

  $.ajax({
    url: endpoint02 + "/random",
    type: "GET",
    success: function (result) {
      let tip_message = (result[0].tip_message);
      textFriend(phoneNumber, tip_message);    // called here so that the tip message is received first!!!
    },
    error: function (result) {
      $("#phoneNumberMessage").addClass("alert alert-danger");
      $("#phoneNumberMessage").html("Hmm... Something went wrong. Check to see if the API is running");
      console.log(result);
    }
  });
};

var textFriend = function (phoneNumber, tip_message) {
  // get a random tip for the text
  var the_serialized_data = `message=Environmental Tip Of the Day: ${tip_message}&phone=${phoneNumber}&key=64ae32fcd02cd89ccdbeeb466bb4ffd82089d3bcuQcxhMzb2VARlDmmc2SYkemyk`;  //thank u prof Shafer!

  $("#phoneNumberMessage").html(''); // clear out the span
  $("#phoneNumberMessage").removeClass();
  document.getElementById("textTip").disabled = true; //disable user from sending multiple requests

  // sending the text 
  $.ajax({
    url: "https://textbelt.com/text",
    data: the_serialized_data,
    type: "POST",
    success: function (result) {
      // console.log(the_serialized_data);
      // console.log(result);
      $("#textTip").hide();
      $("#phoneNumberMessage").addClass("alert alert-success");
      $("#phoneNumberMessage").html("Thanks for spreading the word!");
    },
    error: function (result) {
      $("#phoneNumberMessage").addClass("alert alert-danger");
      $("#phoneNumberMessage").html("Not able to make a request to TextBelt API...");
      console.log(result);
    }
  });
};



var loginController = function () {
  //go get the data off the login form
  var the_serialized_data = $('#form-login').serialize();
  var url = endpoint01;
  $.getJSON(url, the_serialized_data, function (data) {
    //console.log(data);
    if (typeof data === 'string') {
      localStorage.usertoken = 0; // login failed.  Set usertoken to it's initial value.
      $('#login_message').html(data);
      $('#login_message').show();
    } else {
      $('#login_message').html('');
      $('#login_message').hide();
      localStorage.usertoken = data['user_id']; //login succeeded.  Set usertoken.
      $('.secured').removeClass('locked');
      $('.secured').addClass('unlocked');
      $('#div-login').hide();
      $("#div-loginSideBar").hide();
      $('#div-splash').show();
    }
  });
  //scroll to top of page
  $("html, body").animate({ scrollTop: "0px" });
};
// end of loginController


//document ready section
$(document).ready(function () {

  /* ------------------  basic navigation ----------------*/

  /* lock all secured content */
  $(".secured").removeClass("unlocked");
  $(".secured").addClass("locked");

  /* this reveals the default page */
  $("#div-login").show();
  $("#div-loginSideBar").show();

  /* this controls navigation - show / hide pages as needed */

  /* what to do when a navigation link is clicked */
  $(".nav-link").click(function () {
    navigationControl(this);
  });


  // If button on the splash board is pressed
  $("#calcRef").click(function () {
    $(".content-wrapper").hide(); /* hide all content-wrappers */
    $("#div-calc").show(); /* show the chosen content wrapper */
    $("html, body").animate({ scrollTop: "0px" }); /* scroll to top of page */
    $(".navbar-collapse").collapse(
      "hide"
    ); /* explicitly collapse the navigation menu */
  });


  /* what happens if the login button is clicked? */
  $("#btnLogin").click(function () {
    loginController();
  });


  // Decrease your footprint navigation buttons

  $("#btnTravel").click(function () {
    $("#home").hide();
    $("#food").hide();
    $("#shopping").hide();
    $("#travel").show();
  });
  $("#btnHome").click(function () {
    $("#home").show();
    $("#food").hide();
    $("#shopping").hide();
    $("#travel").hide();
  });
  $("#btnFood").click(function () {
    $("#home").hide();
    $("#food").show();
    $("#shopping").hide();
    $("#travel").hide();
  });
  $("#btnShopping").click(function () {
    $("#home").hide();
    $("#food").hide();
    $("#shopping").show();
    $("#travel").hide();
  });

  // Load leaderboard here
  loadLeaderboard();

  // load tips for the client
  loadTipBoard();

  // Submit button for calculator
  $("#btnCalc").click(function () {
    let totalScore = getScores().totalScore;
    let display_name = $("#display_name").val();

    $("#message").removeClass();
    if (display_name === '') {
      $("#message").addClass("alert alert-danger");
      $("#message").html("Display name required");
      return;
    }

    $("#chart").html(""); //reload chart
    getChart();
    submitNewTotal(display_name, totalScore); // update database
  });

  // what happens if you hit the submit tip button
  $("#btnTip").click(function () {
    sendTip();
  });

  $("#textTip").click(function () {
    let phoneNumber = $("#phoneNumber").val();
    getRandomTip(phoneNumber);
  });

}); // closing document tab
