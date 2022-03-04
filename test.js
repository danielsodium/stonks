const request = require('request');
const fs = require('fs');
const { parse } = require ('node-html-parser');

const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });
let cookieJSON = fs.readFileSync(process.env.COOKIE_PATH +'cookie.json');
let cookie = JSON.parse(cookieJSON);
stockData = JSON.parse(fs.readFileSync(process.env.COOKIE_PATH +'stocks.json'));

var cash = 400000;

totalCost = 0;
stockData.buy.forEach(function(price) {
    totalCost += price;
})
console.log(cash/totalCost);

function req(options, callback) {
    request(options, function (error, response) {
        if (error) throw new Error(error);
        callback(response);
        //console.log(response.body);
        //sconsole.log(response.headers['set-cookie']);
      }); 
}
checkStocks(function(a) {console.log(a)})


function checkStocks(callback) {
    var options = { 
        'method': 'GET',
        'headers': {
            'Cookie': cookie.cookie
        },
        'url': 'https://californiasms.com/portfolio/openpositionsbysecuritytype?securityType=Equities&pageIndex=0&pageSize=12&sortField=CreateDate&sortDirection=DESC'
    };
    req(options, function(res) {
        var page = JSON.parse(res.body).Html;
        root = parse(page);
        var data = root.querySelectorAll("tr td");
        var parsed = [];

        var current = [];
        data.forEach(function(entry) {
            if (entry.innerHTML.includes("data-tooltip")) {
                current.push(entry.querySelector("span").text.trim())
            }
            else if (entry.innerHTML.includes("%")) {
                parsed.push(current)
                current = [];
            }
            else if (!entry.innerHTML.includes("<")) {
                
                current.push(entry.innerHTML.trim())
            }
            
        })
        callback(parsed)
    });
}

fs.readFile('table.html', 'utf8', function(err, html) { console.log(parseTable(html))})
//console.log(parseTable())
function parseTable(html) {
    var parsed = [];
    root = parse(html);
    entries = root.querySelectorAll("td");
    var current = [];
    entries.forEach(function(entry) {
        text = entry.innerHTML
        if (!text.includes("data") && text != '') {
            if (text.includes("<a")) {
                if (current.length != 0) {
                    parsed.push(current);
                    current = [];
                }
                //current.push(entry.text);
                current.push(parse(text).text)
            }
            else current.push(text);
            //console.log("ENTRY");
        }
    })
    parsed.push(current);
    return (parsed)
}