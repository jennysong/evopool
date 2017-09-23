const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.sendfile('index.html');
})

app.get('/driver', function (req, res) {
  res.sendfile('driver.html');
})

app.get('/rider', function (req, res) {
  res.sendfile('rider.html');
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})