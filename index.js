'use strict';
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    request = require('request'),
    config = require('config');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let users = {};

app.listen(8989,'0.0.0.0' ,() => console.log('App listening on port 8989!'));

app.get('/', (req, res) => {
    res.send('<h1>Hello World!, This is not a website just quit it plz</h1> \n <h2><i> The admin </i></h2>')
});


// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            //message or postback
            console.log(webhook_event.message);
            if (webhook_event.message) {
                console.log('in handleMessage');
                handleMessage(sender_psid);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "1476955067";
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

function askTemplate(){
    return {"name":"ask",
            "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":"Quel jour ?",
                "buttons":[
                    { "type":"postback", "title":"LUNDI", "payload":"LUNDI"},
                    { "type":"postback", "title":"MARDI", "payload":"MARDI"},
                    { "type":"postback", "title":"MERCREDI", "payload":"MECREDI"},
                    { "type":"postback", "title":"JEUDI", "payload":"JEUDI"},
                    { "type":"postback", "title":"VENDREDI", "payload":"VENDREDI"},
                    { "type":"postback", "title":"EDT", "payload":"EDT"},
                ]
            }
        }
    };
};

function imageTemplate(){
    return {"name":"image",
            "attachment":{
             "attachment":{
                "type":"image",
                "payload":{"is_reusable":true}
                },
            "data":"edt.png;type=image/jpg"}
            }
};



// Handles messages events
function handleMessage(sender_psid) {
    // console.log('asking template');
    // let response = askTemplate();
    // console.log(response)
    // console.log('sending template');
    let response = {"attachment":{"text": "test"}}
    callSendAPI(sender_psid, response);
    return;
}

function handlePostback(sender_psid, received_postback) {
    let response;
    // Get the payload for the postback
    let payload = received_postback.payload;
    // Set the response based on the postback payload
    if (payload === 'EDT') {
        response = imageTemplate();
        callSendAPI(sender_psid, response);
    } else if (payload === 'LUNDI'){
        // return the column LUNDI from etd.csv
        pass
    } else if (payload === 'MARDI'){
        pass
    } else if (payload === 'MERCREDI'){
        pass
    } else if (payload === 'JEUDI'){
        pass
    } else if (payload === 'VENDREDI'){
        pass
    }

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response, cb = null) {
    // Construct the message body
    let request_body= {
        "recipient": {
            "id": sender_psid
        },
        "message": {"attachement": response.attachment}
    };
    console.log('got request body')
    // Send the HTTP request to the Messenger Platform
    console.log(request_body)
    request({
        "uri": "https://graph.facebook.com/v16.0/me/messages",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        console.log('got response')
        if (!err) {
            if(cb){
                cb();
                return;
            }
        } else {
            console.log("Unable to send message:" + err);
        }
    });
}
