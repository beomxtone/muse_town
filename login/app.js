var express = require('express');
var mysql = require('mysql');
var session = require('express-session')
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport')
var LocalStorage = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var crypto = require('crypto');
const randtoken = require('rand-token');

var app = express();
var conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'test'
});
conn.connect();
app.set('view engine', 'jade');
app.set('views', './views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '1234',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'test'
  })
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStorage(
  function(username, password, done) {
    var sql = "SELECT * FROM users"; // WHERE user_id=?
    conn.query(sql, [username], function(err, results) {
      //console.log(results)
      if(err)
        return done(err);
      if(!results[0])
        return done('check id');

      var user = results[0];
      crypto.pbkdf2(password, 'salt', 100000, 64, 'sha512', function(err, derivedKey) { // not done
        if(err)
          return done(err);
        if(password === user.password)
          return done(null, user);
        else
          //console.log(password);
          //console.log(user.password);
          return done('check password');
      });
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  /**
  var sql = "SELECT * FROM users"; // WHERE user_id=?
  conn.query(sql, [id], function(err, results) {
    if(err)
      return done(err, false);
    if(!results[0])
      return done(err, false);
    return done(null, results[0])
  });
   */
  done(null, user);
});

app.get('/', function (req, res) {
  if(!req.user)
    res.redirect('/login');
  else
    res.redirect('/welcome');
});
app.get('/login', function (req, res) {
  if(!req.user)
    res.render('login');
  else
    res.redirect('/welcome');
});
app.get('/welcome', function (req, res) {
  if(!req.user)
    return res.redirect('/login');
  else
    res.render('welcome', {name:req.user.username});
});
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});
app.get('/forgetPassword', function (req, res) {
  res.render('forgetpassword');
});

app.post('/login',
  passport.authenticate(
    'local', {
      successRedirect: '/welcome',
      failureRedirect: '/login',
      failureFlash: false
    }
  )
);
app.post('/forgetpassword', function(req, res) {
  console.log(req.body.username);
});

app.listen(3000, function() {
  console.log("Express server listening on port 3000");
});