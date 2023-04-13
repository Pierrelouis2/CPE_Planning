"use strict";

const { profile } = require("console");

//ALL THE IMPORTS AND CONFIGS HERE
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  userInfo = require("./modules/userInfo"),
  writeMessage = require("./modules/writeMessage"),
  templates = require("./modules/templates"),
  variables = require("./modules/variables"),
  facebookInit = require("./modules/facebookInit"),
  account = require("./modules/account.js"),
  path = require('path'),
  config = require("config"),
  { promisify } = require("util"),
  cookieParser = require("cookie-parser"),
  sessions = require('express-session'),
  sqlite3 = require("sqlite3"),
  fs = require("fs"),
  webFunctions = require("./modules/webFunctions.js");
  

// INIT APP
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let port = 8989;
app.listen(port, "0.0.0.0", () => {
  console.log(`App listening on port ${port}!`);
  facebookInit.set_get_started();
});
const oneDay = 1000 *60 * 60 * 24 ;
app.use(sessions({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  saveUninitialized:true,
  cookie: { maxAge: oneDay },
  resave: false
}));
let initpath = path.join(__dirname,'static','public');
app.use(express.static(initpath));
app.use(cookieParser());
app.use('/Docs', express.static(__dirname + '/Docs'));

// INIT DB
let db = new sqlite3.Database("users.db");
db.on("error", function(error) {
  console.log("Getting an error on DB: ", error, " date = ", writeMessage.getCurrentDate());
}); 
const queryDB = promisify(db.all).bind(db); // used for get info from db

// TO CHANGE PASSWORD AND USERNAME TEST
const myusername = 'user1'
const mypassword = 'mypassword'

// ----- ROUTES ----- //

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.get('/login',function(req, res){
  if (req.body.user == myusername && req.body.password == mypassword){
      let session = req.session;
      session.userid = req.body.user;
      res.redirect('/admin');
  } else {
    res.render(path.join(initpath , 'ejs/login.ejs')); 
  }
});

app.post('/register-form', async function(req, res){
  if (await account.register(req.body)){
    let session = req.session;
    session.userid = req.body.user;
    res.redirect('/admin');
  }
  else {
    // TODO : ERROR MESSAGE
  }
});

app.post('/form', function(req, res) {  
  if (req.body.user == myusername && req.body.password == mypassword){
      let session = req.session;
      session.userid = req.body.user;
      res.redirect('/admin');
  } else {
    res.render(path.join(initpath , 'ejs/login.ejs'), {error: "Erreur de connexion"}); 
  }
});

app.post('/profile_form', async function(req, res) {
  let session = req.session;
  if (session.userid){
    req.body.password = await account.hashPassword(req.body.password);
    await account.changeInfo( JSON.parse(JSON.stringify(req.body)))
    res.redirect('/profile');
  } if else{
    
  }
  } else {
    res.redirect('/login');
  }
});

app.post('/profile_change' , async function(req, res) {
  let session = req.session;
  if (session.userid){
    let variables = {
      page : "profileForm",
    };
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
  }
});

app.get("/admin", async function (req, res) {
  let session = req.session;
    if (session.userid){
      var countPromo = await webFunctions.getStatPromo();
      var countFilliere = await webFunctions.getStatFilliere();
      var countPromoFilliere = await webFunctions.getStatFillierePromo();
      let variables = { 
        page : "profileForm",
        labels : ["Promo", "Filliere", "Promo_Filliere"],
        xlabels: {Promo: ['Promo 4', 'Promo 3'], Filliere: ['ETI', 'CGP'], Promo_Filliere: ['3 ETI', '3 CGP', '4 ETI', '4 CGP']},
        ylabels: {Promo: countPromo, Filliere: countFilliere, Promo_Filliere: countPromoFilliere},
    }; 
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    }
    else {
        res.redirect('/login');
    }
});

app.get("/profile", async function (req, res) {
  let session = req.session;
    if (session.userid){
      let user = await account.getProfile(req.session.userid);
      console.log(user);
      let variables = {
        user: user,
        page : "profile"
      };
      res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    }
    else {
        res.redirect('/login');
    }
});

app.get("/planning", async function (req, res) {
  let session = req.session;
    if (session.userid){
      let variables = {
        page : "planning"
      };
      res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    }
    else {
        res.redirect('/login');
    }
});

app.post("/planning/:payload", async function (req, res) {
  console.log("got planning request");
  console.log(req.params);
});

app.get('/png/:imageName', function(req, res) {
  let image = req.params.imageName;
  console.log("got png request : ", image);
  res.sendFile(path.join(__dirname,`./Plannings/planningPng/${image}`));   
});

// Creates the endpoint for our webhook to facebook
app.post("/webhook", async (req, res) => {
  console.log("got webhook post");
  let body = req.body;
  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    for (const entry of body.entry) {
      console.log("entry: " + entry)
      // only reading the message
      let webhook_event = entry.messaging[0];
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log(`Sender PSID: ${sender_psid}, date = ${writeMessage.getCurrentDate()}`);
      //message or postback ?
      if (webhook_event.message) {
        console.log("in handleMessage");
        await handleMessage(sender_psid);
      } else if (webhook_event.postback) {
        await handlePostback(sender_psid, webhook_event.postback);
      }
    }
    // Returns a '200' (=OK) response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
  return
});

// Creation of the endpoint for our facebook webhook verification
app.get("/webhook", (req, res) => {
  console.log("got webhook get");
  // Adds support for GET requests to our webhook
  let VERIFY_TOKEN = config.get("facebook.page.secret");
  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handling the message when a user send text and not a postback
async function handleMessage(sender_psid) {
  let response = templates.askTemplateJour();
  let r;
  await facebookInit.set_persistent_menu(sender_psid, true);
  r = await writeMessage.callSendAPI(sender_psid, response[0]);
  r = await writeMessage.callSendAPI(sender_psid, response[1]);
}

// Handling the message when a user send a postback
async function handlePostback(sender_psid, received_postback) {
  let response;
  let message;
  let r;
  let user;
  let sql_set_filiere;
  await facebookInit.set_persistent_menu(sender_psid, true); // Needed here ?
  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log("payload: ", payload);
  // Handle all payloads
  switch (payload) {
    case "TOUT":
      if (!(await userInfo.isKnownUser(sender_psid))) {
        response = templates.askTemplateStart();
        r = await writeMessage.callSendAPI(sender_psid, response);
        break;
      }
      if (!(await userInfo.isReady(sender_psid))) {
        await planningNotReady(sender_psid);
        break;
      }
      message = { text: "Voici le planning de la semaine: " };
      r = await writeMessage.callSendAPI(sender_psid, message);
      response = templates.askTemplateImage();
      user = await userInfo.getUser(sender_psid);
      let imgName = user.promo + user.filliere + variables.constant.DATE;
      response.attachment.payload.url = `https://messenger.jo-pouradier.fr/png/${imgName}.png`;;
      r = await writeMessage.callSendAPI(sender_psid, response);
      break;
    case "LUNDI":
    case "MARDI":
    case "MERCREDI":
    case "JEUDI":
    case "VENDREDI":
      if (!(await userInfo.isKnownUser(sender_psid))) {
        response = templates.askTemplateStart();
        r = await writeMessage.callSendAPI(sender_psid, response);
        break;
      }
      if (!(await userInfo.isReady(sender_psid))) {
        await planningNotReady(sender_psid);
        break;
      }
      //get user
      user = await userInfo.getUser(sender_psid);
      await writeMessage.sendPlanningDay(payload, sender_psid, user);
      break;
    case "GET_STARTED":
      // verify is the sender is known29687.bot_messenger
      let knownUser = await userInfo.isKnownUser(sender_psid);
      if (knownUser) {
        // send the user the menu
        console.log("known user");
        response = templates.askTemplateJour();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
      }
      //create new user
      else {
        console.log("new user");
        let sql_new_user = `INSERT INTO user (id_user) VALUES (?)`;
        try {
          await db.run(sql_new_user, sender_psid, function (err) {
            if (err) {
              console.log(err.message);
            }
          });
          let inscription = "Inscription";
          let sql_uptade_status = "UPDATE user SET status=? WHERE id_user=?";
          await db.run(sql_uptade_status, [inscription, sender_psid]);
          // ask for promo (3 or 4)
          let messageRetour = {"text": "Vous avez été réinscrit, veuillez rensigner TOUTES les informations suivantes:\n- promo \n- filliere \n - groupe \n - majeur pour les 4ETI"};
          r = await writeMessage.callSendAPI(sender_psid, messageRetour);
          response = templates.askTemplateNewUserPromo();
          r = await writeMessage.callSendAPI(sender_psid, response);
        } catch (err) {
          console.log(`error while inserting new user, date = ${writeMessage.getCurrentDate()}`);
          console.log("error: " + err);
          let message_error =
            "Il y a eu un probleme lors de votre inscription, rééssayez, si le probleme persiste contactez un administrateur";
          let r = await writeMessage.callSendAPI(sender_psid, message_error);
        }
      }
      break;
    case "REINSCRIPTION":
      let sql_status_inscription = "UPDATE user SET promo=?, filliere=?, groupe=?, majeur=?, status=? WHERE id_user=?"; // TODO : change all other params to None
      try {
        await db.run(sql_status_inscription, ["None","None","None","None","Inscription", sender_psid]); 
      } catch (err) {
        console.log( `error while updating REINSCRIPTION, date = ${writeMessage.getCurrentDate()} error: ${err}`);
      }
      // empty the mso table if its a 4CGP
      if (await userInfo.is4CGP(sender_psid)){
        let sql_delete_mso = `DELETE FROM tj_user_mso WHERE id_user=?`;
        await db.run(sql_delete_mso, sender_psid, function (err) {
          if (err) {
            console.log(`Error table when reinscription 4CGP, date = ${writeMessage.getCurrentDate()}: error = ${err.message}`);
          }
        });
      }
      let messageRetour = {"text": "Vous avez été réinscrit, veuillez rensigner TOUTES les informations suivantes:\n- promo \n- filliere \n- groupe \n- majeur pour les 4ETI"};
      r = await writeMessage.callSendAPI(sender_psid, messageRetour);
      // ask for promo (3 or 4)
      response = templates.askTemplateNewUserPromo();
      r = await writeMessage.callSendAPI(sender_psid, response);
      break;
    case "3":
    case "4":
      let sql_set_promo = `UPDATE user SET promo=? WHERE id_user=?`;
      await db.run(sql_set_promo, [payload, sender_psid]);
      //ask for user groupe (A,B,C,D)
      response = templates.askTemplateGroupe();
      r = await writeMessage.callSendAPI(sender_psid, response[0]);
      r = await writeMessage.callSendAPI(sender_psid, response[1]);
      break;
    case "A":
    case "B":
    case "C":
    case "D":
      let sql_set_groupe = `UPDATE user SET groupe=? WHERE id_user=?`;
      await db.run(sql_set_groupe, [payload, sender_psid]);
      //ask for user filliere (CGP,ETI)
      response = templates.askTemplateFilliere();
      r = await writeMessage.callSendAPI(sender_psid, response);
      break;
    case "ETI": //4A -> get Majeure
      // set the user filliere to payload
      sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
      await db.run(sql_set_filiere, [payload, sender_psid]);
      if (await userInfo.is4ETI(sender_psid)) {
        console.log("4ETI");
        response = templates.askTemplateMajeureETI();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
      }
      // give days menu
      else {
        console.log("3ETI");
        let inscription = "Inscrit";
        let sql_uptade_statusEti = "UPDATE user SET status=? WHERE id_user=?";
        await db.run(sql_uptade_statusEti, [inscription, sender_psid]);
        response = templates.askTemplateJour();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
      }
      break;
    case "CGP":
      // set the user filliere to payload
      sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
      await db.run(sql_set_filiere, [payload, sender_psid]);
      let inscription = "Inscrit";
      let sql_uptade_statusCgp = "UPDATE user SET status=? WHERE id_user=?";
      await db.run(sql_uptade_statusCgp, [inscription, sender_psid]);
      if (await userInfo.is4CGP(sender_psid)) {
        console.log("4CGP");
        let messageMso = { "text": "Vous êtes en 4CGP, veuillez choisir vos mso, cliquez sur chacune de vos mso:" };
        r = await writeMessage.callSendAPI(sender_psid, messageMso);
        response = templates.askTemplateMsoCGP(Object.assign({}, variables.constant.MSO));
        for (let m of response) {
          console.log("mso sending");
          r = await writeMessage.callSendAPI(sender_psid, m);
        }
      } else {
        console.log("3CGP");
        response = templates.askTemplateJour();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
      }
      break;
    case "CBD":
    case "INFRA":
    case "IMI":
    case "ROSE":
    case "ESE":
      let sql_set_majeur = `UPDATE user SET majeur=? WHERE id_user=?`;
      let majeur = variables.constant.MAJEURS[payload];
      await db.run(sql_set_majeur, [majeur, sender_psid]);
      let inscriptionMaj = "Inscrit";
      let sql_uptade_statusMaj = "UPDATE user SET status=? WHERE id_user=?";
      await db.run(sql_uptade_statusMaj, [inscriptionMaj, sender_psid]);
      response = templates.askTemplateJour();
      r = await writeMessage.callSendAPI(sender_psid, response[0]);
      r = await writeMessage.callSendAPI(sender_psid, response[1]);
      break;
    default:
      // let's not make a long switch case with CGP MSO
      if (Object.keys(variables.constant.MSO).includes(payload)) {
        console.log("MSO payload")
        let mso_name = variables.constant.MSO[payload];
        console.log(`mso_name = ${mso_name} at ${writeMessage.getCurrentDate()}`);
        // get the id of the mso
        let sql_get_mso_id = `SELECT id_mso FROM mso WHERE name_mso=?`;
        let mso_id = (await queryDB(sql_get_mso_id, [mso_name]))[0];
        console.log(`mso_id = ${mso_id}`);
        // get the id of the user
        let user = await userInfo.getUser(sender_psid);
        let sql_set_mso = `INSERT INTO tj_user_mso (id_user, id_mso) VALUES(?, ?)`;
        await db.run(sql_set_mso, [user.id_user, mso_id.id_mso], async function (err) {
            if (err) {
                console.log(err);
                let messageAlreadyInMso = { "text": `Vous avez déjà choisi cette mso ${mso_name}`};
                writeMessage.callSendAPI(sender_psid, messageAlreadyInMso);
            }
        });
      } else {
        console.log("unknown payload");
        message = {text: `Je n'ai pas compris votre demande. Veuillez réessayer.`,};
        r = await writeMessage.callSendAPI(sender_psid, message);
        let start = templates.askTemplateStart();
        r = await writeMessage.callSendAPI(sender_psid, start);
      }
      break;
      
  }
}

// Set up message for users that filliere/promo is not ready
async function planningNotReady(sender_psid) {
  let message = {
    text: `Le planning n'est disponible que pour les 3ETI, 3CGP, 4ETI. \nA tu remplis ta promo, filliere et groupe? \nPour les 4CGP on fait au plus vite ! `,
  };
  let r = await writeMessage.callSendAPI(sender_psid, message);
  message = { text: `Signé : les dev en SUSU` };
  r = await writeMessage.callSendAPI(sender_psid, message);
  return;
}

