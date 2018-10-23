var cheerio = require("cheerio");
var axios = require("axios");

var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");

var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

var MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(
  MONGODB_URI,
  { useNewUrlParser: true }
);

app.get("/scrape", function(req, res) {
  console.log("scrape");
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

      console.log(result.title);

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
    res.redirect("/");
  });
});

// Route for getting all Articles from the db
app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(article) {
      res.render("index", { article });
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/saved", function(req, res) {
  db.Article.find({ saved: true })
    .sort({ created: -1 })
    .then(function(article) {
      res.render("saved", { article });
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/save", function(req, res) {
  db.Article.findOneAndUpdate({ _id: req.body._id }, { saved: true })
    .then(function(article) {
      res.redirect("back");
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("listening on : http://localhost:" + PORT);
});
