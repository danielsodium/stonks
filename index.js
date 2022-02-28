const request = require('request');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = '5292691877:AAEd4giKmOe256TLUNv8emCOyWgubyUeLxQ';
const bot = new TelegramBot(token, {polling: false});
const { Webhook } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/947003034427347007/M1bRmXyLMn_X89F62w151bbZGbFqtHeZg1CFmlP9_C52-jz4_KXfLYHwXbqMWaINaPjt");

let date_ob = new Date();

// Get cookie from cache
let cookieJSON = fs.readFileSync('/home/opc/stonks/cookie.json');
let cookie = JSON.parse(cookieJSON);

function sendMessage(message) {
    bot.sendMessage(5170145392, message);
}

function sendDiscord(mess) {
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    hook.send(hours+":"+minutes + " | " + mess);
}

// Check if cookie in cache is expired
checkCookie(function() {

    // Check if any orders have been fullfilled
    checkOrders(function(data) {
        // No buy orders


        if (data[0] == 0 && data[1] == 0) {
            req(sellStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                sendDiscord(final.body);
                if (final.Success == true) {
                    sendMessage("Sold $" + (99999999 * 0.0003).toString() + " worth of stonks");
                }
                else {
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
            });


        }
        /*
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
        else sendDiscord("Sell order already exists.");*/
    })
})

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

function buyStocks(_cookie) {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': _cookie
        },
        formData: {
            OrderSide: 1,
            Symbol: "HCMC",
            Quantity: 99999999,
            OrderType: 2,
            Price: 0.0002,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: "Healthier+Choices+Management+Corp",
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: "NorthAmerica"
        }
    };
}

function sellStocks(_cookie) {
    return {
        'method': 'POST',
        'url': 'https://californiasms.com/trading/placeorder',
        'headers': {
            'Cookie': _cookie
        },
        formData: {
            OrderSide: 2,
            Symbol: "HCMC",
            Quantity: 99999999,
            OrderType: 2,
            Price: 0.0003,
            OrderExpiration: 2,
            charttype: "simple",
            SecurityType: "Equities",
            CompanyName: "Healthier+Choices+Management+Corp",
            Currency: "USD",
            Exchange: 1,
            QuantityType: "Amount",
            SelectedRegion: "NorthAmerica"
        }
    };
}