const request = require('request');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = '5292691877:AAEd4giKmOe256TLUNv8emCOyWgubyUeLxQ';
const bot = new TelegramBot(token, {polling: false});


// Get cookie from cache
let cookieJSON = fs.readFileSync('cookie.json');
let cookie = JSON.parse(cookieJSON);

function sendMessage(message) {
    bot.sendMessage(5170145392, message);
}

// Check if cookie in cache is expired
checkCookie(function() {

    // Check if any orders have been fullfilled
    checkOrders(function(data) {
        // No buy orders
        if (data[0] == 0) {
            req(buyStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                if (final.Success == true) {
                    sendMessage("Bought $" + (400000000 * 0.0002).toString() + " worth of stonks");
                }
                else console.log(final.ErrorMessage);
            });
        }
        // No sell orders
        if (data[1] == 0) {
            req(sellStocks(cookie.cookie), function(final) {
                final = JSON.parse(final.body);
                if (final.Success == true) {
                    sendMessage("Sold $" + (400000000 * 0.0002).toString() + " worth of stonks");
                }
                else console.log(final.ErrorMessage);
            });
        }
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
            Quantity: 400000000,
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
            Quantity: 400000000,
            OrderType: 3,
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