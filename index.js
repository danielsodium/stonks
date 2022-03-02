const request = require('request');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const { parse } = require ('node-html-parser');



const token = '5292691877:AAEd4giKmOe256TLUNv8emCOyWgubyUeLxQ';
const bot = new TelegramBot(token, {polling: false});
const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });


let date_ob = new Date();

// Get cookie from cache
// /home/opc/stonks/
let cookieJSON = fs.readFileSync(process.env.COOKIE_PATH +'cookie.json');
let cookie = JSON.parse(cookieJSON);

stockData = JSON.parse(fs.readFileSync(process.env.COOKIE_PATH +'stocks.json'));


switch(cookie.version) {
    case 1:
        batchOrder();
        break;
    case 2:
        indivOrder();
        break;
    default:
        break;
}


function sendMessage(message) {
    bot.sendMessage(5170145392, message);
}

function sendDiscord(mess) {
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    hook.send(hours+":"+minutes + " | " + mess);
}

// VERSION 1: BATCH ORDERS DO GO THROUGH


function batchOrder() {
    checkCookie(function() {
        // Check if any money left
        checkBalance(function(balance) {
            if (balance > 10) {
                var canbuy = Math.floor((balance-25)/0.0002);
                req(buyStocks(canbuy), function(newfinal) {
                    newfinal = JSON.parse(newfinal.body);
                    if (newfinal.Success == true) {
                        sendMessage("Bought " + canbuy +" stocks worth $" + (canbuy * 0.0002).toString() + ".");
                    }
                    else {
                        sendMessage(newfinal.ErrorMessage);
                    }
                });
            } else {

            }
        })
        checkStocks(function(canSell) {
            if (canSell > 0) {
                req(sellStocks(canSell), function(newfinal) {
                    newfinal = JSON.parse(newfinal.body);
                    if (newfinal.Success == true) {
                        sendMessage("Sold " + canSell +" stocks worth $" + (canSell * 0.0002).toString() + ".");
                    }
                    else {
                        sendMessage(newfinal.ErrorMessage);
                    }
                });
            }
        })
    })
}

function checkBalance(callback) {
    var options = { 
        'method': 'GET',
        'headers': {
            'Cookie': cookie.cookie
        },
        'url': 'https://californiasms.com/account/accountbalances'
    };
    req(options, function(res) {
        root = parse(res.body);
        var bal = root.querySelectorAll('table')[1].querySelectorAll('tbody tr')[4].querySelectorAll('td');
        callback(parseFloat(bal[1].text.replace("$","").replace(",",'')));
    });
}

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
        var aquired = root.querySelectorAll("tr");
        for (var i = 0 ; i < aquired.length; i++) {
            if (aquired[i].innerHTML.includes("HCMC")) {
                data = aquired[i].querySelectorAll("td")[2];
                return callback(parseInt(data.text));
            }
        }
    });
}


// VERSION 2: BATCH ORDERS DO NOT GO THROUGH


function indivOrder() {
    
    checkCookie(function() {
        var order = [0,1,2,3,4,5,6];
        shuffle(order);

        recursiveCheck(order);
    })
}

function recursiveCheck(order) {
    if (order.length <= 0) return;
    i = order[0];
    
    recursiveSell(stockData.names[i], stockData.sell[i], stockData.company[i],function (){
        recursiveBuy(stockData.names[i], stockData.buy[i], stockData.company[i], function() {
            recursiveCheck(order.slice(1));
        })
    });
}

function recursiveBuy(sym, price,company, callback) {
    req(buyStocks(sym, 99999999, (price*0.0001), company), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        amt = 99999999;
        if (newfinal.Success == true) {
            sendMessage("Bought $" + (amt * price * 0.0001).toString() + " worth of " + sym + ".");
        } //else console.log(newfinal.ErrorMessage);
        callback();
    });
}

function recursiveSell(sym, price, company, callback) {
    req(sellStocks(sym, 99999999, (price*0.0001), company), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        amt = 99999999;
        if (newfinal.Success == true) {
            sendMessage("Sold $" + (amt * price * 0.0001).toString() + " worth of " + sym + ".");
        } //else console.log(newfinal.ErrorMessage);
        callback();
    });
}


function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}
// VERSION 3: OLD VERSION
/*
// Check if cookie in cache is expired
checkCookie(function() {
    // Check if any orders have been fullfilled
    checkOrders(function(data) {
        // No buy orders
        if (data[0] == 0 && data[1] == 0) {
            req(sellStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                console.log(final)
                sendDiscord(final.body);
                if (final.Success == true) {
                    sendMessage("Sold $" + (99999999 * 0.0003).toString() + " worth of stonks");
                }
                else {
                    sendDiscord(final.ErrorMessage);
                    req(buyStocks(cookie.cookie), function(newfinal) {
                        newfinal = JSON.parse(newfinal.body);
                        if (newfinal.Success == true) {
                            sendMessage("Bought $" + (99999999 * 0.0002).toString() + " worth of stonks");
                        }
                        else {
                            sendDiscord(newfinal.ErrorMessage);
                        }
                    });
                }
            });
        } else {
            sendDiscord("Orders already in place");
        }
        
        if (data[0] == 0) {
            req(buyStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                if (final.Success == true) {
                    sendMessage("Bought $" + (99999999 * 0.0002).toString() + " worth of stonks");
                }
                else {
                    sendDiscord(final.ErrorMessage);
                }
            });
        } 
        else sendDiscord("Buy order already exists.");
        // No sell orders
        if (data[1] == 0) {
            req(sellStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                sendDiscord(final.body);
                if (final.Success == true) {
                    sendMessage("Sold $" + (99999999 * 0.0003).toString() + " worth of stonks");
                }
                else sendDiscord(final.ErrorMessage);
            });
        }
        else sendDiscord("Sell order already exists.");
    })
})
*/

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
    return {
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
            SelectedRegion: 0
        }
    };
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
            SelectedRegion: 0
        }
    };
}