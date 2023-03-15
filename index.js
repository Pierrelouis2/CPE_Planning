'use strict';
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    request = require('request'),
    config = require('config'),
    sqlite3 = require('sqlite3');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let users = {};
// let db_file = 'db.db';
let db = new sqlite3.Database('db.db'); // db in memory

// let sql_get_user = 'SELECT user_id FROM users WHERE id = ?';

app.listen(8989,'0.0.0.0' ,() => console.log('App listening on port 8989!'), set_get_started(), create_db());

app.get('/', (req, res) => {
    res.send('<h1>Hello World!, This is not a website just quit it plz</h1> \n <h2><i> The admin </i></h2>')
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
    console.log('got webhook')
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
            set_persistent_menu(sender_psid);
            //message or postback
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

app.get('/webhook', (req, res) => {
    // Adds support for GET requests to our webhook
    let VERIFY_TOKEN = config.get('facebook.page.secret');
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

async function create_db(){
    // Create db
    db.serialize(function() {
        let sql, res, err
        sql = `CREATE TABLE IF NOT EXISTS users (user_id INTEGER NOT NULL PRIMARY KEY, annee INTEGER NULL check(annee in (3,4)), filiere TEXT NULL check(filiere in ('ETI', 'CGP')), majeur TEXT NULL);`;
        res = db.run(sql, [], (err) => {
            if (err){console.log(err);}
        });
        // test
        let user = {user_id: 5, annee: 4, filiere: 'CGP', majeur: 'test'};
        let user_data = [];
        for (let key in user) {
            user_data.push(user[key]);
        }
        console.log(user_data)
        sql = `INSERT INTO users (user_id, annee, filiere, majeur) VALUES (?, ?, ?, ?)`;
        db.run(sql, user_data, (res, err) => {
            if (err){
                console.log(err.message);
                // rollback on error 
                db.run('ROLLBACK');
            }

        sql = `SELECT * FROM users`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.log(err.message);
            } else {
                rows.forEach((row) => {
                    console.log(row);
                })
            }
            });
        });
    });
}

function set_get_started(){
    // Set up Get Started button
    let get_started = {"get_started": {"payload": "GET_STARTED"}}
    let err, res, body = request({
        "uri": "https://graph.facebook.com/v16.0/me/messenger_profile",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": get_started
    });
    // handling errors
    if (!err) {
        console.log('get_started set')
    } else {
        console.error("Unable to send message:" + err);
    }
}

async function set_persistent_menu(psid){
    let menu = {"psid": psid,
            "persistent_menu": [
            {
                "locale": "default",
                "composer_input_disabled": true, // activate/deactivate the keayboard
                "call_to_actions": [
                    {
                        "type": "postback",
                        "title": "LUNDI",
                        "payload": "LUNDI"
                    },
                    {
                        "type": "postback",
                        "title": "MARDI",
                        "payload": "MARDI"
                    },
                    {
                        "type": "postback",
                        "title": "MERCREDI",
                        "payload": "MERCREDI"
                    },
                    {
                        "type": "postback",
                        "title": "JEUDI",
                        "payload": "JEUDI"
                    },
                    {
                        "type": "postback",
                        "title": "VENDREDI",
                        "payload": "VENDREDI"
                    },
                    {
                        "type": "postback",
                        "title": "TOUT 🗓",
                        "payload": "TOUT"
                    },
                ]
            }
        ]
    }
    let err, res, body = await request({
        "uri": "https://graph.facebook.com/v16.0/me/custom_user_settings",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": menu
    });
    // handling errors
    if (!err) {
        console.log('menu set')
    } else {
        console.error("Unable to send message:" + err);
    }
}

function askTemplate(){
    return [{"name":"ask",
            "attachment":{
                "type":"template",
                "payload":{
                    "template_type":"button",
                    "text":"Quel jour ?",
                    "buttons":[
                        { "type":"postback", "title":"LUNDI", "payload":"LUNDI"},
                        { "type":"postback", "title":"MARDI", "payload":"MARDI"},
                        { "type":"postback", "title":"MERCREDI", "payload":"MECREDI"}
                    ]
                }
            }
        },
        {"name":"ask",
            "attachment":{
                "type":"template",
                "payload":{
                    "template_type":"button",
                    "text":"ou",
                    "buttons":[
                        { "type":"postback", "title":"JEUDI", "payload":"JEUDI"},
                        { "type":"postback", "title":"VENDREDI", "payload":"VENDREDI"},
                        { "type":"postback", "title":"TOUT 🗓", "payload":"TOUT"}
                    ]
                }
            }
        }]
}

function askTemplateNewUserPromo(){
    return {"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Quel Promo ?",
            "buttons":[
                { "type":"postback", "title":"3A", "payload":"3A"},
                { "type":"postback", "title":"4A", "payload":"4A"}
            ]
        }
    }
}
}

function imageTemplate(psid){
    // utilisation d'une url discord pour l'image
    return {"name":"image",
            "attachment":{
                "type":"image",
                "payload":{
                    "url": "https://cdn.discordapp.com/attachments/900449490539016233/1078715007648403610/Screenshot_20230224_172800_PDF_Viewer_Lite.jpg",
                    "is_reusable":true
                },
            }
        }
}

async function handleMessage(sender_psid) {
    let response = askTemplate();
    let r;
    r = await callSendAPI(sender_psid, response[0]);
    r = await callSendAPI(sender_psid, response[1]);
    return;
}

async function handlePostback(sender_psid, received_postback) {
    let response;
    let message;
    let r;
    // Get the payload for the postback
    let payload = received_postback.payload;
    switch (payload) {
        case 'TOUT':
            message = {"text": "Voici le planning de la semaine: "};
            r = await callSendAPI(sender_psid, message);
            response = imageTemplate();
            r = await callSendAPI(sender_psid, response);
            break;
        case 'LUNDI':
            // return the column LUNDI from etd.csv
            break;
        case 'MARDI':
            break;
        case 'MERCREDI':
            break;
        case 'JEUDI':
            break;
        case 'VENDREDI':
            break;
        case 'GET_STARTED':
            // verify is the sender is known
            

            break;
        case 'ETI', 'CGP':
            // set the user filiere to payload

            // ask for promo
            break;
        case '3A', '4A':
            // set the user promo to payload

            // ask for group
            // and if in 4A-ETI, ask for major
            break;
        
        default:
            break;
    }
}

async function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body= { "recipient": {"id": sender_psid}, "message": null };
    // attach the appropriate message to the request body
    if(response.attachment){
        request_body.message = {"attachment": response.attachment}
    } else if (response.text){
        request_body.message = {"text": response.text}
    } else {
        console.log("error: no message to send")
    }
    // Send the HTTP request to the Messenger Platform
    let err, res, body = await request({
        "uri": "https://graph.facebook.com/v16.0/me/messages",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    });
    // handling errors
    if (!err) {
        console.log('message sent!')
    } else {
        console.error("Unable to send message:" + err);
    }
    return
}
