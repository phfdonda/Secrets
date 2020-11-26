// CONFIG  =====================================================================
const express = require('express')
const bodyParser = require('body-parser')
const _ = require('lodash')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')
const app = express()
const serverURL = "mongodb+srv://m001-student:m001-mongodb-basics@sandbox.znb2f.mongodb.net/secretsDB"
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
const secret = 'Thisisourlittlesecret!'
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]})

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
   User.create({
     email: req.body.username,
     password: req.body.password
   }, err =>{
     err ? res.send(err) :
      res.render('secrets')
   })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// POST REGISTER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
app.post('/login', (req,res)=>{
   User.findOne({
     email: req.body.username,
   }, (err, foundUser) =>{
     if(err){res.send(err)} else
      if(foundUser){
        if(foundUser.password === req.body.password){
          res.render('secrets')
        }else{
          res.send('Wrong Password!')
        }
      }else{
        res.send('No user registered with this email, try to Register')
      }
   })
})
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// APP LISTEN ??????????????????????????????????????????????????????????????????
app.listen(process.env.PORT || 3000, ()=>{
  console.log('Server started at port 3000')
})
// ?????????????????????????????????????????????????????????????????????????????
