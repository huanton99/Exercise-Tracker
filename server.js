const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bodyParser= require('body-parser');
const { query } = require('express');
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
        let responseObject = {}
        responseObject['_id'] = updatedUser.id
        responseObject['username'] = updatedUser.username
        responseObject['date'] = new Date(newSession.date).toDateString()
        responseObject['description'] = newSession.description
        responseObject['duration'] = newSession.duration
        res.json(responseObject)
      }
    }
  )
});
app.get('/api/users/:id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  let idJson = { "id": req.params._id };
  let idToCheck = idJson.id;

  // Check ID
  User.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }

    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from)}
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to)}
    }

  let limitChecker = (limit) => {
    let maxLimit = 100;
    if (limit) {
      return limit;
    } else {
      return maxLimit
    }
  }

  if (err) {
    console.log("error with ID=> ", err)
  } else {

    Session.find((query), null, {limit: limitChecker(+limit)}, (err, docs) => {
      let loggedArray = [];
      if (err) {
        console.log("error with query=> ", err);
      } else {

        let documents = docs;
        let loggedArray = documents.map((item) => {
          return {
            "description": item.description,
            "duration": item.duration,
            "date": item.date.toDateString()
          }
        })

        const test = new LogInfo({
          "username": data.username,
          "count": loggedArray.length,
          "log": loggedArray,
        })

        test.save((err, data) => {
          if (err) {
            console.log("error saving exercise=> ", err)
          } else {
            console.log("saved exercise successfully");
            res.json({
              "_id": idToCheck,
              "username": data.username,
              "count": data.count,
              "log": loggedArray
            })
          }
        })
      }
    })
  }
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
