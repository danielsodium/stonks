const request = require('request');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const { parse } = require ('node-html-parser');



const token = '5292691877:AAEd4giKmOe256TLUNv8emCOyWgubyUeLxQ';
const bot = new TelegramBot(token, {polling: false});
const { Webhook } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/947003034427347007/M1bRmXyLMn_X89F62w151bbZGbFqtHeZg1CFmlP9_C52-jz4_KXfLYHwXbqMWaINaPjt");

require('dotenv').config();




let date_ob = new Date();

// Get cookie from cache
// /home/opc/stonks/
let cookieJSON = fs.readFileSync(process.env.COOKIE_PATH +'cookie.json');
let cookie = JSON.parse(cookieJSON);




switch(cookie.version) {
    case 1:
        batchOrder;
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
                var canbuy = Math.floor(balance/0.0002);
                req(buyStocks(canbuy), function(newfinal) {
                    newfinal = JSON.parse(newfinal.body);
                    if (newfinal.Success == true) {
                        sendMessage("Bought " + canbuy +" stocks worth $" + (canbuy * 0.0002).toString() + ".");
                    }
                    else {
                        sendDiscord(newfinal.ErrorMessage);
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
                        sendDiscord(newfinal.ErrorMessage);
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
        var bal = root.querySelector('tbody tr').querySelectorAll('td');
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
        recursiveBuy();
        recursiveSell();
    })
}

function recursiveBuy() {
    req(buyStocks(99999999), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        if (newfinal.Success == true) {
            sendMessage("Bought " + 99999999 +" stocks worth $" + (99999999 * 0.0002).toString() + ".");
            return recursiveBuy();
        }
        else {
            return;
        }
    });
}

function recursiveSell() {
    req(sellStocks(99999999), function(newfinal) {
        newfinal = JSON.parse(newfinal.body);
        if (newfinal.Success == true) {
            sendMessage("Sold " + 99999999 +" stocks worth $" + (99999999 * 0.0002).toString() + ".");
            return recursiveSell();
        }
        else {
            return;
        }
    });
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

function buyStocks(amt) {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': cookie.cookie
        },
        formData: {
            OrderSide: 1,
            Symbol: "HCMC",
            Quantity: amt,
            OrderType: 2,
            Price: 0.0002,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: "Healthier+Choices+Management+Corp",
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: 0
        }
    };
}

function sellStocks(amt) {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': cookie.cookie
        },
        formData: {
            OrderSide: 2,
            Symbol: "HCMC",
            Quantity: amt,
            OrderType: 2,
            Price: 0.0003,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: "Healthier+Choices+Management+Corp",
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: 0
        }
    };
}