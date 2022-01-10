const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bodyParser= require('body-parser')
require('dotenv').config()
const URI = `mongodb+srv://admin:huanton99@mern-call.bsfhx.mongodb.net/mern-call?retryWrites=true&w=majority`;
const connectDB= async()=>{
  try{
    mongoose.connect(URI)
    console.log('Connect success');
  }
  catch(err){
    console.log(err);
  }
}
connectDB();
let sessionSchema = new Schema({
  description: {type:String, required: true},
  duration: {type:Number, required: true},
  date: String
})


let userSchema = new Schema({
    username: {type:String, required: true},
    log : [sessionSchema]
})

let Session= mongoose.model("Session",sessionSchema)
let User= mongoose.model("Users",userSchema)

app.use(bodyParser.urlencoded({extends: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const user = req.body['username']
  const newUser = new User({username:user})
  newUser.save(newUser,(err,result)=>{
    if(err)
    console.log(err);
    else{
      res.json({username:result.username,_id:result._id});
    }
  })
});
app.get('/api/users', (req, res) => {
  User.find({},(err,result)=>{
    if(err)
    res.json({err:err})
    else{
      res.json(result)
    }
  }).select('-log')
});
app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })
  if(newSession.date === ''){
    newSession.date = new Date().toISOString().substring(0, 10)
  }
  newSession.save()
  User.findByIdAndUpdate(
    id,
    {$push : {log: newSession}},
    {new: true},
    (error, updatedUser)=> {
      if(!error){
        // let responseObject = {}
        // responseObject['_id'] = updatedUser.id
        // responseObject['username'] = updatedUser.username
        // responseObject['date'] = new Date(newSession.date).toDateString()
        // responseObject['description'] = newSession.description
        // responseObject['duration'] = newSession.duration
        res.json({_id:updatedUser._id,username:updatedUser.username,log:[newSession]})
      }
    }
  )
});
app.get('/api/users/:id/logs', (req, res) => {
  const id = req.params.id;
  User.findOne({_id:id},(err,result)=>{
    if(err)
    res.json({err:err})
    else{
      res.json(result)
    }
  }).select('-_id').select('-username')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
