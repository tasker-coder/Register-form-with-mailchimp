const express = require("express");
const mongoose = require('mongoose');
const validator=require("validator")

const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();
const https = require("https");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(cors(corsOptions));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Content-Type, Accept");
    next();
    });


// MONGODB MODEL AND SCHEMA

mongoose.connect('mongodb://localhost:27017/AccountDB');

const Account = mongoose.model(
  'account',
  mongoose.Schema( 
  {
    country: String,
    firstName: {type:String,required:true},
    lastName: {type:String,required:true},
    email: { type:String,
    validate(value){
      if(!validator.isEmail(value)){
        throw new Error("Email is not valid !");
      }}
    },
    password: {type:String,required:true,min:[8,"should be 8 characters"]},
    confirmPassword: {type:String,required:true,min:[8,"should be 8 characters"]},

    address: {type:String,required:[true,"Address Required"]}, 
    city: {type:String,required:[true,"City Required"]},
    state: {type:String,required:[true,"State Required"]}, 
    zip: Number,
    mobile:{type:String,
    validate: {
      validator: function(v) {
        return /\d{3}-\d{3}-\d{4}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    },
  }
  },
  {timestamps : true},
  
));



//GET ALL ACCOUNTS

app.get("/api/accounts", (req, res) => {
  Account.find({}, (err, accounts) => {
    return res.send(accounts);
  }).catch((err) => {
    res.status(500).send({
      message: err.message || "Some error while retrieving accounts.",
    });
  });
});



//REGISTER A USER USING POST METHOD

app.post("/api/accounts", async (req, res)=>{
    const account = new Account({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      state: req.body.state,
      address: req.body.address,
      zip: req.body.zip,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      mobile:req.body.mobile
    });


    // SAVING THE ACCOUNT TO THE DATABASE
    await account.save((err)=>{
      if ( err )
        { 
          res.send(err)
        }
      else
        {  
           res.send({message:"Data Successfully Added"})
        }
    });


    //ADDING THE REGISTERED USER TO THE SUBSCRIBED LIST OF CONTACTS IN MAILCHIMP


    const data = {
      members: [
        {
          email_address: req.body.email,
          status: "subscribed",
          merge_fields: {
            FNAME: req.body.firstName,
            LNAME: req.body.lastName,
          },
        },
      ],
    };
    jsonData = JSON.stringify(data);

    const url = "https://us2.api.mailchimp.com/3.0/lists/6052b4bcc2";
    const options = {
      method: "POST",
      auth: "apikey:13e7434a4460c4e58242f6c2aa2d9068-us2",
    };

    const request = https.request(url, options, (response) => {
      response.on("data", (data) => {
        console.log(JSON.parse(data));
      });
    });

    request.write(jsonData);
    request.end();
    console.log(req.body.firstName, req.body.lastName, req.body.email);
  }

  // After subscribing the user will get an automated welcome mail from mailchimp. The automation has been designed in mailchimp api.

);



app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log("Server is running on PORT " + PORT);
});

