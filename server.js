const express = require('express')
const app = express()
const fs = require('fs');

require('dotenv').config()
const path = require('path');

const port = process.env.PORT;

let cookieJSON = fs.readFileSync(process.env.COOKIE_PATH +'cookie.json');
let cookie = JSON.parse(cookieJSON);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
})
app.get('/changeversion', (req, res) => {
    cookie.version = parseInt(req.query.version);
    fs.writeFile(process.env.COOKIE_PATH +'cookie.json', JSON.stringify(cookie), function() {
        res.redirect('/success');
    })
})

app.get('/success', (req, res) => {
    res.send("Success!");
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})