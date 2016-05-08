"use strict";
//const https = require('https');
const fs = require('fs');
const request = require('request');
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const qs = require('qs');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const app = express();
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const port = process.env.VCAP_APP_PORT || appEnv.port;

process.on('uncaughtException', function (err) {
  console.log(err);
});
const server = http.createServer(app).listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());
app.use(cors());

app.use('/', express.static(__dirname));

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).send('Something broke!');
});

app.get('/authresponse', (req, res) => {
  res.redirect(301, `/?${qs.stringify(req.query)}`);
});

app.post('/audio', upload.single('data'), (req, res) => {
  res.json(req.file);
});

app.get('/lastevent', (req, res)=> {
  
  let MONGO_URL = 'mongodb://hiddengems:test123@aws-us-east-1-portal.17.dblayer.com:10014/hiddengems?ssl=true';
  let user_id = '1234';
  let field = "google_place_info";
  mongodb.MongoClient.connect(MONGO_URL, {ssl: true, sslValidate: false}, function (err, db) {
    let user_info = db.collections("Users").findOne({"user_id": user_id, "google_place_info": {"$exists": true}});
    if (user_info) {
      db.collections("Users")
        .update({"user_id": user_id, "google_place_info": {"$exists": true}}, {"$unset": {"google_place_info": ""}});
      res.json({data: user_info.google_place_info});
    } else {
      res.json({data: null})
    }
  });

});

app.get('/parse-m3u', (req, res) => {
  const m3uUrl = req.query.url;
  console.log(m3uUrl)

  if (!m3uUrl) {
    return res.json([]);
  }

  const urls = [];

  request(m3uUrl, function (error, response, bodyResponse) {
    console.log(bodyResponse, m3uUrl)
    if (bodyResponse) {
      urls.push(bodyResponse);
    }

    res.json(urls);
  });
});


