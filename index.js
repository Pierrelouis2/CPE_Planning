"use strict";
//ALL THE IMPORTS AND CONFIGS HERE
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  request = require("request"),
  config = require("config"),
  sqlite3 = require("sqlite3"),
  fs = require("fs"),
  { promisify } = require("util"),
  userInfo = require("./modules/userInfo"),
  writeMessage = require("./modules/writeMessage"),
  templates = require("./modules/templates"),
  variables = require("./modules/variables"),
  facebookInit = require("./modules/facebookInit");
  
// INIT APP
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
let port = 8989;
app.listen(port, "0.0.0.0", () => {
  console.log(`App listening on port ${port}!`);
  facebookInit.set_get_started();
});

// INIT DB
let db = new sqlite3.Database("users.db");
db.on("error", function(error) {
  console.log("Getting an error on DB: ", error, " date = ", writeMessage.getCurrentDate());
}); 
const queryDB = promisify(db.all).bind(db); // used for get info from db

// INIT CONSTANTS
const MAJEURS = {
  CBD: "CONCEP.LOGICIELLE/BIG DATA",
  ROSE: "ROBOTIQUE",
  ESE: "ELECTRONIQUE ET SYST EMB",
  INFRA: "INFRA DES RESEAUX",
  IMI: "IMAGE",
};
const MSO = {
    "SSO": "Stratégie de synthèse organique",
    "CO2": "Chimie Organometallique 2, approche orbitalaire",
    "IM": "Ingénierie Macromoléculaire",
    "SSP": "Simulation stationnaire des procédés",
    "CMH": "Chimie médicinale et hétérocycles",
    "GRCA": "Génie de la réaction chimique avancée",
    "TE": "Transition énergétique",
    "AL": "Analyses en lignes",
    "SM": "Synthèse Macromoléculaire",
    "SMB": "Synthèse de molécules bioactives",
    "NN": "Nanochimie, nanomatériaux",
    "CN": "Chimie nucléaire",
    "ADNSC": "Analyse de données - le numérique au service de la chimie",
    "CAM": "Conception et application du médicament",
    "TSA": "Techniques séparatives avancées",
    "CDD": "Catalyse et développement durable",
    "GP": "Génie de la polymérisation",
    "RMN": "RMN appliquée à la chimie moléculaire",
    "MN": "Méthodes Numériques"
}

// Creation of a minimalist website for somone who might visit the url
app.get("/", (req, res) => {
  res.send(
    "<h1>Hello World!, This is not a website just quit it plz</h1> \n <h2><i> The admin </i></h2>"
  );
});

app.get("/admin", function (req, res) {
  //read file
  let html = fs.readFileSync("./static/admin.html", "utf8");
  //send file
  res.status(200).send(html);
});

// app path to handle a form post
app.post("/admin/form", async function (req, res) {
  let body = req.body;
  let password = req.body.password;
  let user = req.body.user;
  let function_to_do = req.body.function;
  console.log(body);
  //console.log(hashedPassword.password.hashjo);
  let html = fs.readFileSync("./static/admin.html", "utf8");
  res.status(200).send(html);
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
      console.log("Sender PSID: " + sender_psid);
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
  await facebookInit.set_persistent_menu(sender_psid);
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
  await facebookInit.set_persistent_menu(sender_psid); // Needed here ?
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
      let PF = user.promo.toString() + user.filliere;
      response.attachment.payload.url = variables.link[PF];
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
          db.run(sql_new_user, sender_psid, function (err) {
            if (err) {
              console.log(err.message);
            }
          });
          let inscription = "Inscription";
          let sql_uptade_status = "UPDATE user SET status=? WHERE id_user=?";
          db.run(sql_uptade_status, [inscription, sender_psid]);
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
        db.run(sql_status_inscription, ["None","None","None","None","Inscription", sender_psid]); 
      } catch (err) {
        console.log( `error while updating REINSCRIPTION, date = ${writeMessage.getCurrentDate()} error: ${err}`);
      }
      let messageRetour = {"text": "Vous avez été réinscrit, veuillez rensigner TOUTES les informations suivantes:\n- promo \n- filliere \n - groupe \n - majeur pour les 4ETI"};
      r = await writeMessage.callSendAPI(sender_psid, messageRetour);
      // ask for promo (3 or 4)
      response = templates.askTemplateNewUserPromo();
      r = await writeMessage.callSendAPI(sender_psid, response);
      break;
    case "3":
    case "4":
      let sql_set_promo = `UPDATE user SET promo=? WHERE id_user=?`;
      db.run(sql_set_promo, [payload, sender_psid]);
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
      db.run(sql_set_groupe, [payload, sender_psid]);
      //ask for user filliere (CGP,ETI)
      response = templates.askTemplateFilliere();
      r = await writeMessage.callSendAPI(sender_psid, response);
      break;
    case "ETI": //4A -> get Majeure
      // set the user filliere to payload
      sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
      db.run(sql_set_filiere, [payload, sender_psid]);
      if (await userInfo.is4ETI(sender_psid)) {
        console.log("4ETI");
        response = templates.askTemplateMajeureETI();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
        break;
      }
      // give days menu
      else {
        console.log("3ETI");
        let inscription = "Inscrit";
        let sql_uptade_statusEti = "UPDATE user SET status=? WHERE id_user=?";
        db.run(sql_uptade_statusEti, [inscription, sender_psid]);
        response = templates.askTemplateJour();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
        break;
      }

    case "CGP":
      // set the user filliere to payload
      sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
      db.run(sql_set_filiere, [payload, sender_psid]);
      let inscription = "Inscrit";
      let sql_uptade_statusCgp = "UPDATE user SET status=? WHERE id_user=?";
      db.run(sql_uptade_statusCgp, [inscription, sender_psid]);


      if (await userInfo.is4CGP(sender_psid)) {
        console.log("4CGP");
        // message = {
        //   text: `Le planning pour les CGP n'est pas encore disponible. On fait au plus vite ! `,
        // };
        // r = await writeMessage.callSendAPI(sender_psid, message);
        // message = { text: `Signé : les dev en SUSU` };
        // r = await writeMessage.callSendAPI(sender_psid, message);
        let messageMso = { "text": "Vous êtes en 4CGP, veuillez choisir vos mso (ca va etre long):" };
        r = await writeMessage.callSendAPI(sender_psid, messageMso);
        response = templates.askTemplateMsoCGP();
        for (let m of response) {
            console.log(m);
            r = await writeMessage.callSendAPI(sender_psid, m);
        }
        break;
      }
      // give days menu
      else {
        console.log("3CGP");
        response = templates.askTemplateJour();
        r = await writeMessage.callSendAPI(sender_psid, response[0]);
        r = await writeMessage.callSendAPI(sender_psid, response[1]);
        break;
      }
      
    case "CBD":
    case "INFRA":
    case "IMI":
    case "ROSE":
    case "ESE":
      let sql_set_majeur = `UPDATE user SET majeur=? WHERE id_user=?`;
      let majeur = MAJEURS[payload];
      db.run(sql_set_majeur, [majeur, sender_psid]);
      let inscriptionMaj = "Inscrit";
      let sql_uptade_statusMaj = "UPDATE user SET status=? WHERE id_user=?";
      db.run(sql_uptade_statusMaj, [inscriptionMaj, sender_psid]);
      response = templates.askTemplateJour();
      r = await writeMessage.callSendAPI(sender_psid, response[0]);
      r = await writeMessage.callSendAPI(sender_psid, response[1]);
      break;
    default:
      console.log("unknown payload");
      message = {
        text: `Je n'ai pas compris votre demande. Veuillez réessayer.`,
      };
      r = await writeMessage.callSendAPI(sender_psid, message);
      let start = templates.askTemplateStart();
      r = await writeMessage.callSendAPI(sender_psid, start);
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

