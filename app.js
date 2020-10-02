//jshint esversion:6

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { trim, result } = require("lodash");
// Cookies and Sessions
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// To use sessions - 1 use expesss-session
app.use(
  session({
    secret: process.env.PASSPHRASE,
    resave: false,
    saveUninitialized: false,
  })
);

// To use sessions - 2 use passport
app.use(passport.initialize());
app.use(passport.session());

//Connect to mongoose database
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

//Username Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// To use sessions - 3 Attach the plugin  passport-local-mongoose before the model is created
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// To use sessions - 4 use passort create locak strategy (TODO: What is strategy?)
passport.use(User.createStrategy());

//TODO: Explore the below options
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.post("/register", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.register({ username: username }, password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// Start node.js server at test port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
