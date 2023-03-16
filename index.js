'use strict';
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    request = require('request'),
    config = require('config'),
    sqlite3 = require('sqlite3'),
    fs = require('fs');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let users = {};
let db = new sqlite3.Database('users.db');
db.query = function (sql, params, callback) {
    if (!Array.isArray(params)) throw new Error("params is not an array!");
    this.all(sql, params, function (err, rows) {
      callback(err, { rows: rows });
    });
};

let port = 8989;
app.listen(port,'0.0.0.0' ,() => console.log(`App listening on port ${port}!`), set_get_started());

app.get('/', (req, res) => {
    res.send('<h1>Hello World!, This is not a website just quit it plz</h1> \n <h2><i> The admin </i></h2>')
});

// Creates the endpoint for our webhook to facebook
app.post('/webhook', (req, res) => {
    console.log('got webhook post')
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
    console.log('got webhook get')
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

async function isKnownUser(sender_psid){
    let sql_get_user = `SELECT id_user FROM user WHERE id_user = ${sender_psid}`;
    let test = await db.get(sql_get_user,(err, user)=>{
        console.log(user);
        console.log(`user n°${user} is known`);
    if (user === {} ){
        return false;
    } else if (user['id_user'] === sender_psid) {
        
        return true;
    }
      });
    console.log(test);
    return test;
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

// TODO
// on a deja le menu persistent, on peut donc le supprimer ?
function askTemplateJour(){
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
                { "type":"postback", "title":"3A", "payload":"3"},
                { "type":"postback", "title":"4A", "payload":"4"}
            ]
        }
    }
}
}

function askTemplateGroupe(){
    return [{"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Quel Groupe ?",
            "buttons":[
                { "type":"postback", "title":"groupe A", "payload":"A"},
                { "type":"postback", "title":"groupe B", "payload":"B"},
                { "type":"postback", "title":"groupe C", "payload":"C"}
            ]
        }
    }
},
    {"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"",
            "buttons":[
                { "type":"postback", "title":"groupe D", "payload":"D"},
            ]
        }
    }
    }]
}

// TODO
// on sait qui si il est en 4A pas si il est en ETI ...
// changer le nom de la fct ?

async function is4ETI(sender_psid){
    let sql_get_user = 'SELECT promo FROM user WHERE id = ?';
    let promo = await db.get(sql_get_user, [sender_psid]);
    console.log(promo);
    if (promo === "4"){
        return true;
    } else {
        return false;
    }
}

function askTemplateFilliere(){
    return {"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Quel fillière ?",
            "buttons":[
                { "type":"postback", "title":"ETI", "payload":"ETI"},
                { "type":"postback", "title":"CGP", "payload":"CGP"}
            ]
        }
    }
}
}

function askTemplateMajeureETI(){
    return [{"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Quel majeure ?",
            "buttons":[
                { "type":"postback", "title":"CBD", "payload":"GL"},
                { "type":"postback", "title":"Réseau", "payload":"GL"},
                { "type":"postback", "title":"Image", "payload":"GL"}
            ]
        }
    }
},
    {"name":"ask",
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":"Quel majeure ?",
                "buttons":[
                    { "type":"postback", "title":"Robot", "payload":"GL"},
                    { "type":"postback", "title":"Electronique", "payload":"GL"},
                ]
            }
        }
    }]

}
// TODO
// changer le lien de l'image chaque semaine
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

// TODO
// on a plus de message ...
// on l'enleve ?
async function handleMessage(sender_psid) {
    let response = askTemplateJour();
    let r;
    r = await callSendAPI(sender_psid, response[0]);
    r = await callSendAPI(sender_psid, response[1]);
    return;
}

async function handlePostback(sender_psid, received_postback) {
    let response;
    let message;
    let r;
    let planningJour;
    let rep;
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
            // get parametre from user_id in db: promo, filliere, majeure
            planningJour = await readCsv('./Output_Json/Datatest.json',4,'ETI',payload,'IMAGE');
            rep = await ConstructMessage(planningJour);
            message = {"text": `Voici le planning de ${payload}: `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Matin : ${rep[0]}`};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Après-midi : ${rep[1]}`};
            r = await callSendAPI(sender_psid, message);
            // return the column LUNDI from etd.csv
            break;
        case 'MARDI':
            planningJour = await readCsv('./Output_Json/Datatest.json',4,'ETI',payload,'IMAGE');
            rep = await ConstructMessage(planningJour);
            message = {"text": `Voici le planning de ${payload} : `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Matin : ${rep[0]}`};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Après-midi : ${rep[1]}`};
            r = await callSendAPI(sender_psid, message);
            break;
        case 'MERCREDI':
            planningJour = await readCsv('./Output_Json/Datatest.json',4,'ETI',payload,'IMAGE');
            rep = await ConstructMessage(planningJour);
            message = {"text": `Voici le planning de ${payload} : `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Matin : ${rep[0]}`};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Après-midi : ${rep[1]}`};
            r = await callSendAPI(sender_psid, message);
            break;
        case 'JEUDI':
            planningJour = await readCsv('./Output_Json/Datatest.json',4,'ETI',payload,'IMAGE');
            rep = await ConstructMessage(planningJour);
            message = {"text": `Voici le planning de ${payload} : `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Matin : ${rep[0]}`};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Après-midi : ${rep[1]}`};
            r = await callSendAPI(sender_psid, message);
            break;
        case 'VENDREDI':
            planningJour = await readCsv('./Output_Json/Datatest.json',4,'ETI',payload,'IMAGE');
            rep = await ConstructMessage(planningJour);
            message = {"text": `Voici le planning de ${payload} : `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Matin : ${rep[0]}`};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Après-midi : ${rep[1]}`};
            r = await callSendAPI(sender_psid, message);
            break;
        case 'GET_STARTED':
            // verify is the sender is known
            if (await isKnownUser(sender_psid)){
                // send the user the menu
                console.log('known user')
                response = askTemplateJour();
                r = await callSendAPI(sender_psid, response[0]);
                r = await callSendAPI(sender_psid, response[1]);
            }
            //create new user
            else {
                let sql_new_user = `INSERT INTO user (id_user) VALUES (${sender_psid})`;
                db.exec(sql_new_user);
                // ask for promo (3 or 4)
                response = askTemplateNewUserPromo();
                r = await callSendAPI(sender_psid, response);
            }
            break;
        case '3':
        case '4':
            //Write payload into database
            let sql_set_promo = `UPDATE user SET promo = ${payload} WHERE id_user = ${sender_psid}`;
            db.exec(sql_set_promo);
            //ask for user groupe (A,B,C,D)
            response = askTemplateGroupe();
            r = await callSendAPI(sender_psid, response[0]);
            r = await callSendAPI(sender_psid, response[1]);
            break;
        case 'A':
        case 'B':
        case 'C':
        case 'D':
            //Write payload into database
            let sql_set_groupe = `UPDATE user SET groupe = ${payload} WHERE id_user = ${sender_psid}`;
            db.exec(sql_set_groupe);
            //ask for user filliere (CGP,ETI)
            response = askTemplateFilliere();
            r = await callSendAPI(sender_psid, response);
            break
        case 'ETI': //4ETI -> get Majeure
        case 'CGP': 
            // set the user filiere to payload
            let sql_set_filiere = `UPDATE user SET filiere = ${payload} WHERE id_user = ${sender_psid}`;
            db.exec(sql_set_filiere);
            // ask for majeure
            if (await is4ETI(sender_psid)){
                // response = askTemplateJour();
                response = askTemplateMajeureETI();
                r = await callSendAPI(sender_psid, response[0]);
                r = await callSendAPI(sender_psid, response[1]);
                //response = askTemplateMajeureETI();
                //r = await callSendAPI(sender_psid, response);
            }
            break;
        // case 'CGP':
        //     response = askTemplateJour();
        //     r = await callSendAPI(sender_psid, response[0]);
        //     r = await callSendAPI(sender_psid, response[1]);
        //     break
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

async function readCsv(dir,Annee,Filliere,Jour, Majeur="Pour tous") {
    let planningRen = {}
    let rawdata = fs.readFileSync(dir);
    let planningG = JSON.parse(rawdata);
    let Date;
    // parcour des jours to get the desired day
    for(let day in planningG) {
        if (day.includes(Jour)){
            Date = day
        }
    }
    //init matin
    planningRen["Matin"] = []
    // on verifie si on a qqch dans la majeure, si oui on prend que le planning de la majeure
    if (planningG[Date]["Matin"][Majeur].length != 0 && Majeur != "Pour tous"){
        planningRen["Matin"].push(planningG[Date]["Matin"][Majeur])
    }
    // peut import la majeur on prend le planning Pour tous du matin
    planningRen["Matin"].push(planningG[Date]["Matin"][Majeur])

    // console.log(planningG[Date]["Aprem"][Majeur])
    //init aprem
    planningRen["Aprem"] = []
    if (planningG[Date]["Aprem"][Majeur] != 0 && Majeur != "Pour tous"){
        planningRen["Aprem"].push(planningG[Date]["Aprem"]["Pour tous"])
        // console.log("Pour tous")
    }
    // peut import la majeur on prend le planning Pour tous de l'aprem
    planningRen["Aprem"].push(planningG[Date]["Aprem"]["Pour tous"])

    return planningRen
}

async function ConstructMessage(planning){
    let messageMat = ""
    let messageAprem = ""
    for (let matiere in planning["Matin"]){
        //TODO
        // vaiment besoin de <planning["Matin"][matiere] + "\n"> ? pas just <matiere + "\n"> ?
        messageMat += planning["Matin"][matiere] + "\n"
    }
    for (let matiere in planning["Aprem"]){
        messageAprem += planning["Aprem"][matiere] + "\n"
        if (planning["Aprem"][matiere].includes("Salle")){
            messageAprem += "\n"
        }
    }
    return [messageMat,messageAprem]
}