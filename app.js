const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const mongoose = require("mongoose");
const multer = require('multer');
const path = require('path');
const mysql = require('mysql')
const md5 = require("md5");
const app = express();
app.use(express.static("public"));


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'imagestorage'
});

db.connect(function(err) {
  if (err) {
    throw err
  } else {
    console.log("db connected successfully");
  }
});

const userDetails = {
  userName: '',
  user_ID: '',
}

//package to store the user uploaded image to the server folder
const Storages = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cd) => {
    cd(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

let upload = multer({
  storage: Storages
}).single('Browse');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/contributor", function(req, res) {
  res.render("contributor");
});

app.get("/normal_user", function(req, res) {
  const sql = 'SELECT users.name,users.id,images.imagePath,images.imageName,images.downloadCount from users,images where users.id=images.user_id';
  db.query(sql, function(err, result) {
    if (err) {
      throw err
    } else {
      console.log(result);
      res.render("normal_user", {
        images: result,
        dimgs: result,
        success:false
      })
      // res.send(result);
    }
  });
});

app.post("/downloadImage", function(req, res) {
  user_id = req.body.user_id;
  imagePath = req.body.imagePath;
  const sql = 'SELECT users.name,users.id,images.imageName,images.downloadCount,images.imagePath FROM users,images WHERE users.id=images.user_id and images.imagePath=?'
  const sql1 = 'SELECT users.name,users.id,images.imagePath,images.imageName,images.downloadCount from users,images where users.id=images.user_id'
  db.query(sql, imagePath, function(err, images) {
    if (err) {
      throw err;
    } else {
      db.query(sql1,function(err,result){
        res.render("normal_user", {
          images: result,
          dimgs: images,
          success:true
        });
      });

    }
  });
});

app.post("/downloads",function(req,res){
  const imagePath="./public/uploads/"+req.body.imagePath;
  const user_id=req.body.user_id;
  const sql='UPDATE `images` SET `downloadCount`=downloadCount+1 WHERE user_id=?';
  res.download(imagePath,"images.png");
  db.query(sql,user_id,function(err,result){
    if(err){throw err;}
    else {
      res.redirect("/normal_user");
    }
  });
})
app.post("/register", function(req, res) {

  const newUser = {
    name: req.body.username,
    passwords: md5(req.body.password),
    userType: req.body.userType
  }

  const sql = 'INSERT INTO users SET ?'
  db.query(sql, newUser, function(err, result) {
    if (err) {
      throw err
    } else {
      userDetails.userName = newUser.name;
      userDetails.user_ID = result.insertId;
      // console.log(userDetails.userName);
      // console.log(userDetails.user_ID);
      if (req.body.userType === 'normalUser') {
        res.redirect("/normal_user");
      } else {
        res.redirect("/contributor");
      }
    }
  });

});

//login route
app.post("/login", function(req, res) {
  let name = req.body.username;

  let passwords = md5(req.body.password);
  let sql = 'SELECT * from users where name=?';
  db.query(sql, name, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        if (result[0].passwords === passwords) {
          userDetails.userName = result[0].name;
          userDetails.user_ID = result[0].id;
          console.log(userDetails.userName);
          console.log(userDetails.user_ID);
          if (result[0].userType === 'normalUser') {
            res.redirect("/normal_user");
          } else {
            res.redirect("/contributor");
          }
        }
      }
    }

  });
});

//contributor route to accept the user uploaded image file
app.post("/contributor", upload, function(req, res) {
  let imageName = req.body.imageName;
  console.log(req.file.filename);
  let imagePath = req.file.filename;
  let category = req.body.Category;
  const imageData = {
    imagePath: imagePath,
    imageName: imageName,
    category: category,
    user_id: userDetails.user_ID
  }
  const sql = "INSERT INTO images SET ?"
  db.query(sql, imageData, function(err, result) {
    if (err) {
      throw err;
    } else {
      res.redirect("/contributor");
    }
  });
});

app.post("/normalUser", function(req, res) {

});

app.get("/reports",function(req,res){
  let sql = 'SELECT images.imageName,images.category,images.downloadCount from images where user_id=?';
  db.query(sql,userDetails.user_ID,function(err,results){
    if(err){throw err}
    else{
      console.log(results);
      res.render("reports",{results:results});
    }
  })

});



app.listen(3000, function() {
  console.log("Server started at port 3000");
});
