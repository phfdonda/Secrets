// CONFIG  =====================================================================
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const app = express()
const serverURL = process.env.DB_URL
const mongooseSetting = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}

mongoose
  .connect(serverURL, mongooseSetting)
  .then(console.log('Connected successfully to the DB! =D'))
  .catch("Oops! No connection to the DB! ='C")

app.set('view engine', 'pug')
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static('public'))

// =============================================================================

// GLOBAL VARIABLES ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const validPaths = ['home','login','register','secrets','submit']
const userSchema = new mongoose.Schema({
  email: String,
  password: String
})
const User = mongoose.model("User", userSchema)
const saltRounds = 10

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// GET HOME <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  app.get('/',(req,res)=>{
    res.render('home')
  })
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// GET PATH <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
  app.get('/:path',(req,res)=>{
    const path = req.params.path
    validPaths.includes(path) ? res.render(path) : res.render('lost')
  })
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// POST REGISTER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/register', (req,res)=>{
  bcrypt.hash(req.body.password, saltRounds,(err, hash)=>{
    User.create({
     email: req.body.username,
     password: hash
   }, err =>{
     err ? res.send(err) :
      res.render('secrets')
   })
  })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// POST REGISTER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/login', (req,res)=>{
  const password = req.body.password
   User.findOne({
     email: req.body.username,
   }, (err, foundUser) =>{
     if(err){res.send(err)} else
      if(foundUser){
        bcrypt.compare(password, foundUser.password, (err, check)=>{
          if(err){
            res.send(err)
          } else {
            if(check){
              res.render('secrets')
            }
          }
        })
      }
   })
  })
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// APP LISTEN ??????????????????????????????????????????????????????????????????
app.listen(process.env.PORT || 3000, ()=>{
  console.log('Server started at port 3000')
})
// ?????????????????????????????????????????????????????????????????????????????
