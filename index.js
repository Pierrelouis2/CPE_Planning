'use strict';
//ALL THE IMPORTS AND CONFIGS HERE
let express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    request = require('request'),
    config = require('config'),
    sqlite3 = require('sqlite3'),
    fs = require('fs');
    const { promisify } = require("util");

// INIT APP
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let port = 8989;
app.listen(port,'0.0.0.0' ,() => {
    console.log(`App listening on port ${port}!`);
    set_get_started();
});

//INIT DB
let db = new sqlite3.Database('users.db');
const queryDB = promisify(db.all).bind(db);

let users = {};
const MAJEURS = { "CBD": "CONCEP.LOGICIELLE/BIG DATA",
    "ROSE": "ROBOTIQUE",
    "ESE": "ELECTRONIQUE ET SYST EMB",
    "INFRA": "INFRA DES RESEAUX",
    "IMI": "IMAGE",
};

// Creation of a minimalist website for somone who might visit the url
app.get('/', (req, res) => {
    res.send('<h1>Hello World!, This is not a website just quit it plz</h1> \n <h2><i> The admin </i></h2>')
});

// Creates the endpoint for our webhook to facebook
app.post('/webhook', async (req, res) => {
    console.log('got webhook post')
    let body = req.body;
    // Checks this is an event from a page subscription
    if (body.object === 'page') {
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(async function(entry) {
            // only reading the message 
            let webhook_event = entry.messaging[0];
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);
            //message or postback ?
            if (webhook_event.message) {
                console.log('in handleMessage');
                handleMessage(sender_psid);
            } else if (webhook_event.postback) {
                await handlePostback(sender_psid, webhook_event.postback);
            }
        });
        // Returns a '200' (=OK) response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
});

// Creation of the endpoint for our facebook webhook verification
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

// Check if the user is in our database
async function isKnownUser(sender_psid){
    let sql_get_user = `SELECT * FROM user WHERE id_user = ?`;
    const user = (await queryDB(sql_get_user, sender_psid))[0];
    console.log("user isKnownUser test : "+ sender_psid)
    if (user === undefined){
        console.log("user undefined")
        return false;
    }
    // check that all fields are filled
    if ((user === [] || 
        user.promo === null ||
        user.groupe === null) && 
        user.status !== "Inscription"){
            console.log("user not in db")
            let message = {"text": "Votre compte n'est pas complet, veuillez le refaire"}
            callSendAPI(sender_psid, message);
            message = askTemplateNewUserPromo();
            callSendAPI(sender_psid, message);
            return false;
    }
    if (user.id_user.toString() === sender_psid){
        return true;
    } else {
        return false;
    }
}

// verify if the timetable is ready or not
async function isReady(sender_psid){
    let lst_promo_ready = ["4"];
    let lst_filliere_ready = ["ETI"];
    let sql_get_user = 'SELECT * FROM user WHERE id_user=?';
    let user = (await queryDB(sql_get_user, [sender_psid]))[0];
    console.log(`user is4A: ${user}`);
    if ( (lst_promo_ready.includes(user.promo)) && (lst_filliere_ready.includes(user.filliere))){
        console.log("isReady");
        return true;
    } else {
        return false;
    }
}

// verify if the user is complete or not
async function isUserComplete(sender_psid){
    let sql_get_user = 'SELECT * FROM user WHERE id_user=?';
    let user = (await queryDB(sql_get_user, [sender_psid]))[0];
    if (user === undefined || user === []){
        return false;
    }
    if (user.promo !== null && user.groupe !== null){
        return true;
    }
    return false;
}
async function sendWeekPlanning(){
    let sql_get_user = 'SELECT id_user FROM user WHERE filliere="ETI" AND promo="4" ';
    let res = (await queryDB(sql_get_user));
    res.forEach(async function(value,index){
        response = TemplateSendWeek();
        r = await callSendAPI(value.id_user, response);
        console.log("index: " + index + ", " + "value user" + value.id_user);
    });// ww w  .jav  a  2s  .co m
}
sendWeekPlanning();
// Set up the Get Started button
function set_get_started(){
    let get_started = {"get_started": {"payload": "GET_STARTED"}}
    let err, res, body = request({
        "uri": "https://graph.facebook.com/v16.0/me/messenger_profile",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": get_started
    });
    if (!err) {
        console.log('get_started set')
    } else {
        console.error("Unable to send message:" + err);
    }
}

// Set up the persistent menu
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
                    {
                        "type": "postback",
                        "title": "REINSCRIPTION",
                        "payload": "REINSCRIPTION"
                    }
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

// Set up the message when a user send text and not a postback
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
                        { "type":"postback", "title":"MERCREDI", "payload":"MERCREDI"}
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

// Set up message for new user
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

// Set up message to get the user group
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
            "text":"ou",
            "buttons":[
                {"type":"postback", "title":"groupe D", "payload":"D"},
            ]
        }
    }
    }]
}

// Set up message to handle unknown user or unknown event
function askTemplateStart(){
    return {"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Redémarrer le bot",
            "buttons":[
                { "type":"postback", "title":"Démarrez", "payload":"GET_STARTED"},
            ]
        }
    }
}
}

// Set up message to get the user filliere
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

// Set up message to get the user majeure for 4ETI
function askTemplateMajeureETI(){
    return [{"name":"ask",
    "attachment":{
        "type":"template",
        "payload":{
            "template_type":"button",
            "text":"Quel majeure ?",
            "buttons":[
                { "type":"postback", "title":"CBD", "payload":"CBD"},
                { "type":"postback", "title":"Réseau", "payload":"INFRA"},
                { "type":"postback", "title":"Image", "payload":"IMI"}
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
                    { "type":"postback", "title":"Robot", "payload":"ROSE"},
                    { "type":"postback", "title":"Electronique", "payload":"ESE"},
                ]
            }
        }
    }]

}

// TODO
// changer le lien de l'image chaque semaine
function imageTemplate(){
    // utilisation d'une url discord pour l'image
    return {"name":"image",
            "attachment":{
                "type":"image",
                "payload":{
                    "url": "https://cdn.discordapp.com/attachments/989244799108386886/1091346376069234749/03_avril_au_07_avril-1.png",
                    "is_reusable": true
                },
            }
        }
}

function TemplateSendWeek(){
    return {"name":"image",
            "attachment":{
                "type":"image",
                "payload":{
                    "url": "https://cdn.discordapp.com/attachments/989244799108386886/1091346376069234749/03_avril_au_07_avril-1.png",
                    "is_reusable": true
                },
            }
        }
}
// Handling the message when a user send text and not a postback
async function handleMessage(sender_psid) {
    let response = askTemplateJour();
    let r;
    set_persistent_menu(sender_psid);
    r = await callSendAPI(sender_psid, response[0]);
    r = await callSendAPI(sender_psid, response[1]);
    return;
}

// Handling the message when a user send a postback
async function handlePostback(sender_psid, received_postback) {
    let response;
    let message;
    let r;
    let sql_set_filiere
    set_persistent_menu(sender_psid); // Needed here ?
    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log("payload: ", payload);
    // Handle all payloads
    switch (payload) {
        case 'TOUT':
            if (!(await isKnownUser(sender_psid)))  {
                response = askTemplateStart();
                r = await callSendAPI(sender_psid, response);
                break;
            }
            if(!(await isReady(sender_psid))){
                await planningNotReady(sender_psid);
                break;
            }
            message = {"text": "Voici le planning de la semaine: "};
            r = await callSendAPI(sender_psid, message);
            response = imageTemplate();
            r = await callSendAPI(sender_psid, response);
            break;
        case 'LUNDI':
        case 'MARDI':
        case 'MERCREDI':
        case 'JEUDI':
        case 'VENDREDI':
            if (!(await isKnownUser(sender_psid)))  {
                response = askTemplateStart();
                r = await callSendAPI(sender_psid, response);
                break;
            }
            if (!(await isReady(sender_psid))){
                await planningNotReady(sender_psid);
                break;
            }
            await sendPlanningDay(payload, sender_psid);
            break;
        case 'GET_STARTED':
            // verify is the sender is known29687.bot_messenger
            let knownUser = await isKnownUser(sender_psid);
            if (knownUser){
                // send the user the menu
                console.log('known user')
                response = askTemplateJour();
                r = await callSendAPI(sender_psid, response[0]);
                r = await callSendAPI(sender_psid, response[1]);
            }
            //create new user
            else {
                console.log('new user')
                let sql_new_user = `INSERT INTO user (id_user) VALUES (?)`;
                db.run(sql_new_user, sender_psid);
                let inscription = "Inscription";
                let sql_uptade_status = 'UPDATE user SET status=? WHERE id_user=?';
                db.run(sql_uptade_status, [inscription, sender_psid]);
                // ask for promo (3 or 4)
                response = askTemplateNewUserPromo();
                r = await callSendAPI(sender_psid, response);
            }
            break;
        case 'REINSCRIPTION':
            let sql_status_inscription = 'UPDATE user SET status=? WHERE id_user=?';  // TODO : change all other params to None
            db.run(sql_status_inscription, ['Inscription', sender_psid]);
            // ask for promo (3 or 4)
            response = askTemplateNewUserPromo();
            r = await callSendAPI(sender_psid, response);
            break;
        case '3':
        case '4':
            let sql_set_promo = `UPDATE user SET promo=? WHERE id_user=?`;
            db.run(sql_set_promo, [payload, sender_psid]);
            //ask for user groupe (A,B,C,D)
            response = askTemplateGroupe();
            r = await callSendAPI(sender_psid, response[0]);
            r = await callSendAPI(sender_psid, response[1]);
            break;
        case 'A':
        case 'B':
        case 'C':
        case 'D':
            let sql_set_groupe = `UPDATE user SET groupe=? WHERE id_user=?`;
            db.run(sql_set_groupe, [payload, sender_psid]);
            //ask for user filliere (CGP,ETI)
            response = askTemplateFilliere();
            r = await callSendAPI(sender_psid, response);
            break
        case 'ETI': //4A -> get Majeure
            // set the user filliere to payload
            sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
            db.run(sql_set_filiere, [payload, sender_psid]);
            if (await isReady(sender_psid)){
                console.log('4ETI')
                response = askTemplateMajeureETI();
                r = await callSendAPI(sender_psid, response[0]);
                r = await callSendAPI(sender_psid, response[1]);
                break;
            } 
            // give days menu
            else {
                console.log('3ETI')
                await planningNotReady(sender_psid);
                let inscription = "Inscrit";
                let sql_uptade_statusEti = 'UPDATE user SET status=? WHERE id_user=?';
                db.run(sql_uptade_statusEti, [inscription, sender_psid]);
                break;
            }
        case 'CGP': 
            // set the user filliere to payload
            sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
            db.run(sql_set_filiere, [payload, sender_psid]);
            let inscription = "Inscrit";
            let sql_uptade_statusCgp = 'UPDATE user SET status=? WHERE id_user=?';
            db.run(sql_uptade_statusCgp, [inscription, sender_psid]);
            message = {"text": `Le planning pour les CGP n'est pas encore disponible. On fait au plus vite ! `};
            r = await callSendAPI(sender_psid, message);
            message = {"text": `Signé : les dev en SUSU`}; 
            r = await callSendAPI(sender_psid, message);
            break;
        case 'CBD':
        case 'INFRA':
        case 'IMI':
        case 'ROSE':
        case 'ESE':
            let sql_set_majeur = `UPDATE user SET majeur=? WHERE id_user=?`;
            let majeur = MAJEURS[payload];
            db.run(sql_set_majeur, [majeur, sender_psid]);
            let inscriptionMaj = "Inscrit";
            let sql_uptade_statusMaj = 'UPDATE user SET status=? WHERE id_user=?';
            db.run(sql_uptade_statusMaj, [inscriptionMaj, sender_psid]);
            response = askTemplateJour();
            r = await callSendAPI(sender_psid, response[0]);
            r = await callSendAPI(sender_psid, response[1]);
            break;
        default:
            console.log("unknown payload")
            message = {"text": `Je n'ai pas compris votre demande. Veuillez réessayer.`};
            r = await callSendAPI(sender_psid, message);
            let start = askTemplateStart();
            r = await callSendAPI(sender_psid, start);
            break;
    }
}

// Set up message for users that filliere/promo is not ready
async function planningNotReady(sender_psid){
    let message = {"text": `Le planning n'est pas encore disponible pour ta promo. On fait au plus vite ! `};
    let r = await callSendAPI(sender_psid, message);
    message = {"text": `Signé : les dev en SUSU`}; 
    r = await callSendAPI(sender_psid, message);
    return
}

// Send message to user
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

// read the planning json data to send Am and Pm
async function sendPlanningDay(payload, sender_psid){
    let planningJour = await readCsv('./Output_Json/Planning27_03.json',payload,sender_psid);
    let rep = await ConstructMessage(planningJour);
    let message = {"text": `Voici le planning de ${payload} : `};
    let r = await callSendAPI(sender_psid, message);
    message = {"text": `Matin : ${rep[0]}`};
    r = await callSendAPI(sender_psid, message);
    message = {"text": `Après-midi : ${rep[1]}`};
    r = await callSendAPI(sender_psid, message);
    return
}

// load the planning json file
async function readCsv(dir,Jour,sender_psid) {
    let planningRen = {}
    let rawdata = fs.readFileSync(dir);
    let planningG = JSON.parse(rawdata);
    let Date;
    // loop days to get the desired day // May be a better way to do this
    for(let day in planningG) {
        if (day.includes(Jour)){
            Date = day
        }
    }
    //get the info on the user
    let sql_get_user = `SELECT * FROM user WHERE id_user=?`;
    let user = (await queryDB(sql_get_user,sender_psid))[0];
    console.log(user)
    let majeur = user.majeur;
    //init matin
    planningRen["Matin"] = []
    // Check if there is something for the majeur
    if (planningG[Date]["Matin"][majeur] !== null ){
        planningRen["Matin"].push(planningG[Date]["Matin"][majeur])
    }
    planningRen["Matin"].push(planningG[Date]["Matin"]["Pour tous"])
    //init aprem
    planningRen["Aprem"] = [];
    // Check if there is something for the majeur
    if (planningG[Date]["Aprem"][majeur] !==  null ){
        planningRen["Aprem"].push(planningG[Date]["Aprem"][majeur]);
    }
    planningRen["Aprem"].push(planningG[Date]["Aprem"]["Pour tous"]);
    return planningRen
}

// Formatting data to send to get something readable
async function ConstructMessage(planning){
    let messageMat = "";
    let messageAprem = "";
    for (let matiere in planning["Matin"]){
        for (let cellule in planning["Matin"][matiere]){
            if (planning["Matin"][matiere][cellule].includes('Salle') || planning["Matin"][matiere][cellule].includes('Salles')){
                messageMat += planning["Matin"][matiere][cellule]+ ".\n\n";
            } else {
                messageMat += planning["Matin"][matiere][cellule]+ ",\n";
            }
            
        }
    }
    for (let matiere in planning["Aprem"]){
        for (let cellule in planning["Aprem"][matiere]){
            if (planning["Aprem"][matiere][cellule].includes('Salle') || planning["Aprem"][matiere][cellule].includes('Salles')){
                messageAprem += planning["Aprem"][matiere][cellule]+ ".\n\n";
            } else {
                messageAprem += planning["Aprem"][matiere][cellule]+ ",\n";
            }
        }
    }
    return [messageMat,messageAprem]
}