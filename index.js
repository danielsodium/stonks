const request = require('request');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const { parse } = require ('node-html-parser');


const token = '5292691877:AAEd4giKmOe256TLUNv8emCOyWgubyUeLxQ';
const bot = new TelegramBot(token, {polling: false});
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

var cash = 180000;
var totalCost = 0;

let date_ob = new Date();

// Get cookie from cache
// /home/opc/stonks/
let cookieJSON = fs.readFileSync(process.env.COOKIE_PATH +'cookie.json');
let cookie = JSON.parse(cookieJSON);

stockData = JSON.parse(fs.readFileSync(process.env.COOKIE_PATH +'stocks.json'));

/*
switch(cookie.version) {
    case 1:
        batchOrder();
        break;
    case 2:
        indivOrder();
        break;
    default:
        break;
}*/
indivOrder();

function sendMessage(message) {
    bot.sendMessage(5170145392, message);
}

function sendDiscord(mess) {
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    hook.send(hours+":"+minutes + " | " + mess);
}

// VERSION 2: BATCH ORDERS DO NOT GO THROUGH
function indivOrder() {
    stockData.buy.forEach(function(price) {
        totalCost += price;
    })
    checkCookie(function() {
        getOrders(function(orders) {
            checkCurrentStocks(function(listed) {
                recursiveCheck(listed, orders, 0);
            })
        })
    })
}

function getOrders(callback) {
    var options = { 
        'method': 'GET',
        'headers': {
            'Cookie': cookie.cookie
        },
        'url': 'https://californiasms.com/account/getorderhistory?pageIndex=0&pageSize=12&startDate=09-04-2021&endDate=06-25-2022&sortField=CreateDate&sortDirection=DESC&status=Open&_=1646373071920'
    };
    req(options, function(res) {
        var page = JSON.parse(res.body).Html;
        var parsed = [];
        root = parse(page);
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
        callback(parsed)
    });
}


function checkCurrentStocks(callback) {
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


function checkStockOrders(orders,name) {
    for (var i = 0 ; i < orders.length; i++) {
        if (orders[i][0] == (name)) {
            //data = aquired[i].querySelectorAll("td")[2];
            return (true);
        }
    }
    return (false);
}

function checkStockInv(listed, name) {
    for (var i = 0 ; i < listed.length; i++) {
        if (listed[i][0] == name) {
            return (parseInt(listed[i][1]));
        }
    }
    return (-1);
}

function recursiveCheck(listed, orders, i) {
    if (i == stockData.names.length) {
        // End of list
        return;
    }
    else {
        stockExists = checkStockOrders(orders, stockData.names[i])
        if (stockExists) {
            recursiveCheck(listed, orders, i+1);
        }
        else {
            var current = checkStockInv(listed, stockData.names[i]);
            console.log(current)
            if (current == -1) {
                recursiveBuy(stockData.names[i], /*Math.floor(cash/totalCost)*/99999999, stockData.buy[i], stockData.company[i], function(res) {
                    if (!res.Success) sendMessage("Error: " + res.ErrorMessage)
                    recursiveCheck(listed, orders, i+1);
                })
            } else {
                recursiveSell(stockData.names[i], current ,stockData.sell[i], stockData.company[i],function (res){
                    if (!res.Success) sendMessage("Error: " + res.ErrorMessage)
                    recursiveCheck(listed, orders, i+1);
                }); 
            }
        }
    }
}

function recursiveBuy(sym, amt, price, company, callback) {
    req(buyStocks(sym, amt, price, company), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        if (newfinal.Success == true) {
            sendMessage("Put in Buy order of $" + (amt * price).toString() + " worth of " + sym + ".");
        } //else console.log(newfinal.ErrorMessage);
        callback(newfinal);
    });
}

function recursiveSell(sym, amt, price, company, callback) {
    req(sellStocks(sym, amt, (price), company), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        if (newfinal.Success == true) {
            sendMessage("Put in sell order of $" + (amt * price).toString() + " worth of " + sym + ".");
        } //else console.log(newfinal.ErrorMessage);
        callback(newfinal);
    });
}


function checkCookie(callback) {
    var date = Date.now()
    if (date - 86400000 > cookie.time) {
        // Expired
        req(login(), function(res) {
            cookie.time = date;
            cookie.cookie = res.headers['set-cookie'];

            fs.writeFile("cookie.json", JSON.stringify(cookie), function() {
                callback();
            })
        });
    }
    else callback();
}

function checkOrders(callback) {
    var options = { 
        'method': 'GET',
        'headers': {
            'Cookie': cookie.cookie
        },
        'url': 'https://californiasms.com/account/getorderhistory?pageIndex=0&pageSize=12&startDate=08-26-2021&endDate=08-28-2022&sortField=CreateDate&sortDirection=DESC&status=Open&_=1645829115406'
    };
    req(options, function(res) {
        data = [0,0];
        var table = JSON.stringify(JSON.parse(res.body).Html);
        if (table.includes("Limit Order - Buy")) data[0] = 1;
        else data[0] = 0;
        if (table.includes("Limit Order - Sell")) data[1] = 1;
        else data[1] = 0;
        return callback(data);
    });
}

function req(options, callback) {
    request(options, function (error, response) {
        if (error) throw new Error(error);
        callback(response);
        //console.log(response.body);
        //sconsole.log(response.headers['set-cookie']);
      }); 
}

function login() {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/login',
        formData: {
          'UserName': 'Foothill Haubner-eb49',
          'Password': '780d49'
        }
      };
}

function buyStocks(sym, amt, bprice, company) {
    options = {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': cookie.cookie
        },
        formData: {
            OrderSide: 1,
            Symbol: sym,
            Quantity: amt,
            OrderType: 2,
            Price: bprice,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: company,
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: "NorthAmerica"
        }
    };
    return options;
}

function sellStocks(sym, amt, sprice, company) {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': cookie.cookie
        },
        formData: {
            OrderSide: 2,
            Symbol: sym,
            Quantity: amt,
            OrderType: 2,
            Price: sprice,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: company,
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: "NorthAmerica"
        }
    };
}