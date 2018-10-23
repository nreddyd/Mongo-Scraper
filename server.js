var cheerio = require("cheerio");
var axios = require("axios");

var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

mongoose.connect(
  "mongodb://localhost/unit18Populater",
  { useNewUrlParser: true }
);

app.get("/scrape", function(req, res) {
  axios.get("https://globalnews.ca/canada/").then(function(response) {
    var $ = cheerio.load(response.data);
    // console.log(response.data);

    $("h3.story-h").each(function(i, element) {
      var result = {};

      result.link = $(element)
        .find("a")
        .attr("href");
      result.title = $(element)
        .find("a")
        .text();
      result.description = $(element)
        .siblings("div.story-txt")
        .find("p")
        .text();

      // console.log(result);

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
    res.send("Scrape Complete");
  });
});
