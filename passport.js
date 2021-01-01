var express = require('express');
var mysql = require('mysql');
var session = require('express-session')
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport')
var LocalStorage = require('passport-local').Strategy;
var bodyParser = require('body-parser');
var jade = require('jade');
var crypto = require('crypto');
const { doesNotMatch } = require('assert');

var app = express();
var conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'test'
})

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
    var sql = 'SELECT * FROM user WHERE id=?';
    conn.query(sql, [username], function(err, results) {
      if(err)
        return done(err);
      if(!results[0])
        return done('check id');

      var user = results[0];
      crypto.pbkdf2(password, user.salt, 100000, 64, 'sha512', function(err, deriveKey) {
        if(err)
          return done(err);
        if(derivedKey.toString('hex') === user.password) {
          req.session.name = user.name;
          req.session.save(function() {
            return done(null, user);
          })
        }
        else
          return done('check password');
      });
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  var sql = 'SELECT * FROM user WHERE id=?';
  conn.query(sql, [id], function(err, results) {
    if(err)
      return done(err, false);
    if(!results[0])
      return done(null, results[0]);
  });
});

app.get('/', function (req, res) {
  if(!req.user)
    res.redirect('/');
  else
    res.redirect('/login')
});
app.get('/login', function (req, res) {
  if(!req.session.username)
    res.render('')
  else
    res.redirect('/login')
});

app.post('/',
  passport.authenticate(
    'local', {
      successRedirect: '/login',
      failureRedirect: '/',
      failureFlash: false
    }
  )
);
