// CONFIG  =====================================================================
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose')
const app = express()
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const serverURL = process.env.DB_URL
const findOrCreate = require('mongoose-findorcreate')
const mongooseSetting = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose
  .connect(serverURL, mongooseSetting)
  .then(console.log('Connected successfully to the DB! =D'))

app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: false
  },
  password: String,
  googleId: String,
  facebookId: String,
  secrets: Array
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)

    User.findOrCreate({ googleId: profile.id }, { username: profile.email || profile.displayName}, function (err, user) {
      // console.log(user)
      return cb(err, user);
    });
  }
))
passport.use(new FacebookStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secret",
    profileFields: ['email','id', 'first_name', 'gender', 'last_name']
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, {username: profile.email || profile.displayName || profile.name.givenName}, function (err, user) {
      return cb(err, user);
    });
  }
));

// =============================================================================

// GLOBAL VARIABLES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const validPaths = process.env.VALID_PATHS

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// GET HOME <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  app.get('/',(req,res)=>{
    res.render('home')
  })
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

app.get('/auth/google',
  passport.authenticate('google',{scope:['profile']})
)

app.get('/auth/facebook',
  passport.authenticate('facebook')
)


app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/facebook/secret',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

// GET PATH <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  app.get('/:path',(req,res)=>{
    const path = req.params.path
   if(path === 'logout'){
      if(req.isAuthenticated()){
        req.logout()
        res.redirect('/')
      }else{
        res.render('login')
      }
    }else if(path === 'submit'){
      if(req.isAuthenticated()){
        res.render('submit')
      }else{
        res.render('login')
      }
    }else{
      validPaths.includes(path) ? res.render(path) : res.render('lost')
    }
  })
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// GET SECRETS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
app.get('/secrets', (req,res)=>{
  User.find({"secrets": {$ne: []}},
  (err, foundUsers)=>{
    if(err){console.log(err)} else
    {
      if(foundUsers){
        res.render('secrets',{usersWithSecrets: foundUsers})
      }
    }
  }
  )
})
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// POST REGISTER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/register', (req,res)=>{
  User.register({username: req.body.username},req.body.password, (err,user)=>{
    if(err){
      console.log(err)
      res.redirect('back')
    }else{
      passport.authenticate('local')(req,res,()=>{
        res.redirect('/secrets')
      })
    }
  })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// POST LOGIN >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/login', (req,res)=>{
  const user = new User({
    email: req.body.email,
    password: req.body.password
  })
  req.login(user,err=>{
    err ? console.log(err) :
      passport.authenticate('local')(req,res,()=>{
        res.redirect('/secrets')
      })
  })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// POST SUBMIT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/submit', (req,res)=>{
  const submittedSecret = req.body.secret
  const user = req.user
  console.log(req)
  User.findById(req.user.id, (err, foundUser)=>{
    if(err){
      console.log(err)
    } else{
      if(foundUser){
        foundUser.secrets.push(submittedSecret)
        foundUser.save()
        res.redirect('secrets')
      }
    }
  })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// APP LISTEN ??????????????????????????????????????????????????????????????????
app.listen(process.env.PORT || 3000, ()=>{
  console.log('Server started at port 3000')
})
// ?????????????????????????????????????????????????????????????????????????????
