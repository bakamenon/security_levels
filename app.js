//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const { trim, result } = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 4;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

//Username Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "DBE-0001 : Username Cannot be Empty"],
    trim: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "DBE-0002 : Please Fill a Valid Email Address like user@example.com",
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "DBE-0003 : Please Enter At Least Six Character Password"],
    minlength: 6,
    maxlength: 1024,
  },
});

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  res.render("home");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.post("/register", function (req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password,
  });
  newUser.validate(function (err) {
    if (err) {
      console.log(err);
      res.send("Invalid Email Format or Password Length less than 6 chars");
    } else {
      User.findOne({ email: newUser.email }, function (err, foundUser) {
        if (err) {
          res.send("Database Error");
          console.log(err);
        } else {
          if (!foundUser) {
            bcrypt.hash(newUser.password, saltRounds, function (err, hash) {
              if (!err) {
                newUser.password = hash;
                newUser.save(function (err) {
                  if (!err) {
                    res.render("secrets");
                  } else {
                    console.log(err);
                  }
                });
              } else {
                console.log(err);
              }
            });
          } else {
            res.send("User Already Registered, please use login option");
          }
        }
      });
    }
  });
});

app.post("/login", function (req, res) {
  const loginUser = new User({
    email: req.body.username,
    password: req.body.password,
  });
  loginUser.validate(function (err) {
    if (err) {
      console.log(err);
      res.send("Invalid Input, check console logs for details");
    } else {
      User.findOne({ email: loginUser.email }, function (err, foundUser) {
        if (!err) {
          bcrypt.compare(loginUser.password, foundUser.password, function (
            err,
            result
          ) {
            if (!err) {
              if (foundUser && result) {
                res.render("secrets");
              } else {
                if (!foundUser) {
                  res.send("User Not Found in Database");
                } else {
                  res.send("Password Incorrect");
                }
              }
            } else {
              res.send(err);
            }
          });
        } else {
          res.send(err);
        }
      });
    }
  });
});

// Start node.js server at test port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
