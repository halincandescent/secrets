//jshint esversion:6
require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose"); 
//const encrypt = require('mongoose-encryption'); 
//const md5 = require('md5'); 
//const bcrypt = require('bcrypt'); 
const saltRounds = 10; 
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');  


const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SECRET2,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session()); 

//mongoDB
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema); 

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); 


// 
app.get("/", function(req,res){
  res.render("home"); 
});

app.get("/login", function(req,res){
  res.render("login"); 
});

app.get("/register", function(req,res){
  res.render("register"); 
});

app.get("/secrets", function(req,res){
  //if (req.isAuthenticated()){
  //res.render("secrets");
  //} else {
  //  res.redirect("/login"); 
  //}

  User.find({"secret":{$ne:null}})
    .then(function (foundUsers) {
      res.render("secrets",{usersWithSecrets:foundUsers});
      })
    .catch(function (err) {
      console.log(err);
    })  
 
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/"); 
});

app.get("/submit", function(req,res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }

});

app.post("/submit", function (req, res) {
    //console.log(req.user);
    User.findById(req.user)
      .then(foundUser => {
        if (foundUser) {
          foundUser.secret = req.body.secret;
          return foundUser.save();
        }
        return null;
      })
      .then(() => {
        res.redirect("/secrets");
      })
      .catch(err => {
        console.log(err);
      });
});

app.post("/register", function(req,res){

  //bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  //const newUser = new User({
  //  email: req.body.username,
  //  password: hash
  //  });
  //  newUser.save().then(() => {
  //    res.render("secrets");
  //  }).catch((err) => {
  //     console.log(err);
  //  });
  //});
  //////////////////////////////
  User.register({username: req.body.username}, req.body.password, function(err,user){
  if (err) {
    console.log(err);
    res.redirect("/register"); 
  } else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/secrets"); 
  });
  }
  
  });
  
  
  
});

app.post("/login", function(req,res){
  //const username = req.body.username;
  //const password = req.body.password
  //User.findOne({email: username}).then((foundUser)=>{
  //    bcrypt.compare(password, foundUser.password, function(err,result){
  //     if (result === true) {
  //     res.render("secrets"); 
  //  } else {
  //     console.log("password incorrect"); 
  //   }
  // });
  //}).catch((err) => {
  //  console.log(err); 
  // });
  ///////////////////////////////
  
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets"); 
      });
    }
  });
  

}); 

app.listen(3000, function(){
  console.log("Server has started on port 3000");  
});

