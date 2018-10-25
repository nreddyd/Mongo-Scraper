var cheerio = require("cheerio");
var axios = require("axios");

var express = require("express");
var exphbs = require("express-handlebars");
var logger = require("morgan");
var mongoose = require("mongoose");

var path = require("path");

var db = require("./models");
const Note = require("./models/Note.js"); //require the Note model

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.use(express.static(path.join(__dirname, "public")));

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
  db.Article.find({ saved: false })
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

app.post("/unsave", function(req, res) {
  db.Article.findOneAndUpdate({ _id: req.body._id }, { saved: false })
    .then(function(article) {
      res.redirect("back");
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/delete", function(req, res) {
  console.log("deleteroute");
  db.Article.deleteMany({})
    .then(function(article) {
      res.render("index", { article });
    })
    .catch(function(err) {
      res.json(err);
    });
});
app.get("/notes/:id", function(req, res) {
  //Query to find the matching id to the passed in it
  db.Article.findOne({ _id: req.params.id })
    .populate("notes") //Populate all of the notes associated with it
    .exec(function(error, doc) {
      //execute the query
      if (error) console.log(error);
      // Otherwise, send the doc to the browser as a json object
      else {
        res.json(doc);
      }
    });
});

app.post("/notes/:id", function(req, res) {
  //create a new note with req.body
  var newNote = new Note(req.body);
  //save newNote to the db
  newNote.save(function(err, doc) {
    // Log any errors
    if (err) console.log(err);
    //find and update the note
    db.Article.findOneAndUpdate(
      { _id: req.params.id }, // find the _id by req.params.id
      { $push: { notes: doc._id } }, //push to the notes array
      { new: true },
      function(err, newdoc) {
        if (err) return handleError(err);
        console.log("notes saved");
        res.send(newdoc);
      }
    );
  });
});

app.get("/deleteNote/:id", function(req, res) {
  Note.remove({ _id: req.params.id }, function(err, newdoc) {
    if (err) console.log(err);
    res.redirect("/saved"); //redirect to reload the page
  });
});
app.listen(PORT, function() {
  console.log("listening on : http://localhost:" + PORT);
});
