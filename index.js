"use strict";

// ----- ALL THE IMPORTS AND CONFIGS HERE ----- //
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
  webFunctions = require("./modules/webFunctions.js"),
  multer  = require('multer'),
  {spawn} = require('child_process'),
  xlsfct = require('./modules/xlsfct');
  

// ----- INIT APP ----- //
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
app.use('./Docs', express.static(__dirname + '/Docs'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Plannings/planningXls/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// ----- INIT DB ----- //
let db = new sqlite3.Database("users.db");
db.on("error", function(error) {
  console.log("Getting an error on DB: ", error, " date = ", writeMessage.getCurrentDate());
}); 
const queryDB = promisify(db.all).bind(db); // used for get info from db


// ----- ROUTES ----- //

app.get("/", async function (req, res) {
  let session = req.session;
    if (session.userid){
      let profile = await account.getProfile(session.userid);
      let sender_psid = profile.psid;
      let user = await userInfo.getUser(sender_psid);
      let imgName = user.promo + user.filliere + variables.constant.DATE;
      let timetableImage = `/png/${imgName}.png`;
      let variable = { page : "planning", timetableImage: timetableImage, rights: profile.rights };
      res.render(path.join(initpath , 'ejs/home.ejs'), variable);
    }
    else {
      res.redirect('/login');
    }
});

// Connect to the website
app.get('/login',function(req, res){
  if (req.session.userid){
      let session = req.session;
      session.userid = req.body.email;
      res.redirect('/');
  } else {
    res.render(path.join(initpath , 'ejs/login.ejs')); 
  }
});

app.post('/login-form',async function(req, res) {  
  let form = JSON.parse(JSON.stringify(req.body));
  let result = await account.comparePassword(form.password, form.email)
  if (result){
      let session = req.session;
      session.userid = req.body.email;
      res.redirect('/');
  } else {
    res.render(path.join(initpath , 'ejs/login.ejs'), {error: "Erreur de connexion"}); 
  }
});

// create a new account
app.get("/register", (req, res) => {
    res.render(path.join(initpath , 'ejs/register.ejs'));
});

app.post('/register-form', async function(req, res){
  let form = JSON.parse(JSON.stringify(req.body));
  let user = (await queryDB("SELECT * FROM user WHERE id_user = ?", [form.code]))[0];
  if (user == undefined){
    console.log("new profile user undefined, wrong code");
    res.render(path.join(initpath , 'ejs/register.ejs'), {error: "Erreur de code de liaison"});
    return;
  }
  form.password = await account.hashPassword(form.password);
  let result = await account.register(form)
  if (result){
    console.log("register success");
    let session = req.session;
    session.userid = req.body.email;
    res.redirect('/'); 
  } else {
    console.log("register failed");
    res.render(path.join(initpath , 'ejs/register.ejs'), {error: "Erreur de code inattendue, réessayez"});
  }
});

app.post('/profile_form', async function(req, res) {
  let session = req.session;
  let form = JSON.parse(JSON.stringify(req.body));
  let user = await userInfo.getUser(form.code);
  if (session.userid){
    if (!(/@cpe.fr$/.test(form.email))){
    res.render(path.join(initpath , 'ejs/home.ejs'), { page : "profileForm", error: "Erreur de mail: prenom.nom@cpe.fr"});
    } else if (user === undefined){
      res.render(path.join(initpath , 'ejs/home.ejs'), { page : "profileForm", error: "Erreur de code de liaison"});
    } else if ( !(await account.comparePassword(form.password, session.userid))){
      res.render(path.join(initpath , 'ejs/login.ejs'), {error: "Erreur de mot de passe, vous ne pouvez pas le changer ici il faut vous reinscrire"});
    } else {
      // all is good so we register the user
      form.password = await account.hashPassword(form.password);
      await account.updateAccount(form);
      session.userid = req.body.email;
      let user = await account.getProfile(form.email);
      let variables = { user: user, page : "profile" };
      res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    } 
  } else {
    res.redirect('/login');
  }
});

// get yout profile info
app.get("/profile", async function (req, res) {
  let session = req.session;
  if (session.userid){
    let user = await account.getProfile(session.userid);
    let variables = { user: user, page : "profile", rights: user.rights };
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
  }
  else {
    res.redirect('/login');
  }
});

app.post('/profile_change' , async function(req, res) {
  let session = req.session;
  if (session.userid){
    let variables = { page : "profileForm", rights: user.rights };
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
  }
});

// get your timetable
app.get("/planning", async function (req, res) {
  let session = req.session;
  if (session.userid){
    let profile = await account.getProfile(session.userid);
    let variables = { page : "planning", rights: profile.rights};
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
  }
  else {
    res.redirect('/login');
  }
});

app.post("/planning", async function (req, res) {
  console.log(`got planning ${req.body.payload} request`);
  let session = req.session;
  if (session.userid){
    // get the user psid
    let profile = await account.getProfile(session.userid);
    let sender_psid = profile.psid;
    let user = await userInfo.getUser(sender_psid);
    let variable = { page: "planning", payload: req.body.payload, rights: profile.rights  };
    if (req.body.payload == "TOUT"){
      let imgName = user.promo + user.filliere + variables.constant.DATE;
      let timetableImage = `/png/${imgName}.png`;
      variable.timetableImage = timetableImage;
    } else {
      let message = await writeMessage.constructMessage(await writeMessage.readCsv(`./Output_Json/Planning${user.promo}${user.filliere}${variables.constant.DATE}.json`, req.body.payload, user.id_user, user), sender_psid);
      if (message[0].length == 0){
        message[0] = "rien";
      }
      if (message[1].length == 0){
        message[1] = "rien";
      }
      variable.timetable = message;
    }
    res.render(path.join(initpath , 'ejs/home.ejs'), variable);
  } else {
    res.redirect('/login');
  }
});

app.get('/message', async function(req, res) {
  let session = req.session;
  if (session.userid){
    if (await account.isAllow(session.userid, ["A"])){
      let profile = await account.getProfile(session.userid);
      let variables = { page : "message", rights: profile.rights };
      res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    }
    else {
      res.redirect('/');  //change this ? or make an alert
    }
  }
  else {
    res.redirect('/login');
  }
});

// for CPE administation to send timetables
app.get("/depot", async function (req, res) {
  let session = req.session;
    if (await account.isAllow(session.userid, ["A","B"])){
      let profile = await account.getProfile(session.userid);
      let variables = { page : "depot", rights: profile.rights };
      res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    }
    else {
      res.redirect('/');  //change this ? or make an alert
    }
  });

app.post("/depot-form", upload.single('file'), async function (req, res) {
  let session = req.session;
  if (session.userid){
    console.log(`got file ${req.file.originalname} request at ${writeMessage.getCurrentDate()}`)
    let filepath = './Plannings/planningXls/' + req.body.payload;
    let newName = req.body.date;
    fs.rename(req.file.path, `${filepath}${newName}.xlsx`, function (err) { 
      if (err) {
        console.log(err);
        let variables = {
          page : "depot",
          error: "Il y a eu une erreur lors de l'envoi du fichier, merci de réessayer"
        };
        res.render(path.join(initpath , 'ejs/home.ejs'), variables);
        return
      }
    });
    let variables = {
      page : "depot",
      error: `Merci nous avons bien reçu votre fichier pour les ${req.body.payload}, la semaine du ${req.body.date}`,
      rights: user.rights 
    };
    res.render(path.join(initpath , 'ejs/home.ejs'), variables);
    //send msg to notify when planning is posted
    let message = { text: `Le planning pour les ${req.body.payload} de la semaine du ${req.body.date} est disponible, merci de vérifier qu'il est correctement rempli` };
    let response = await fetch("./config/default.json");
    let sender_psid  = await response.json();
    r = await writeMessage.callSendAPI(sender_psid.id.pl, message);
    r = await writeMessage.callSendAPI(sender_psid.id.jo, message);

      // convert the xls to csv
    let pythonXls2Csv = spawn('python3', ['Plannings/planningXls/xls2csv.py', `${filepath}${newName}.xlsx`, `Plannings/planningCsv/${req.body.payload}/${newName}.csv`]);
    pythonXls2Csv.stdout.on('data', (data) => {
      console.log('node: (python stdout) ' + data.toString());
    });
    pythonXls2Csv.stderr.on('data', (data) => {
      console.log('node: (python stderr) ' + data.toString());
    });
    // xls to png
    xlsfct.xls2png(`${filepath}${newName}.xlsx`, `Plannings/planningPng/${req.body.payload}${newName}.png`, function(err) {
      if (err) {
        console.log(err);
      }
    });

  } else {
    res.redirect('/login');
  }
});

app.post('/send-message', async function(req, res) {
  console.log(`got message ${req.body.payload} request`);
  let session = req.session;
  // if (session.userid){
  //   if (await account.isAllow(session.userid)){
  //     await writeMessage.sendPlanningWeek()
  //   }
  // }
});

app.get('/about',async function(req, res) {
  let session = req.session;
  let user = await account.getProfile(session.userid);
  if (session.userid){
    let variables = { page : "about" , rights: user.rights };
    res.render(path.join(initpath , 'ejs/home.ejs'),variables);
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});

// create a route for images to be sent in websites
app.get('/png/:imageName', function(req, res) {
  let image = req.params.imageName;
  console.log("got png request : ", image);
  if (image == "logo.png"){
    res.sendFile(path.join(__dirname,`./Docs/Logo/logo.png`));
  } else if(image == "logo-modified.png"){
    res.sendFile(path.join(__dirname,`./Docs/Logo/logo-modified.png`));
  }
  else if (image == "baniere.png"){
    res.sendFile(path.join(__dirname,`./Docs/Logo/baniere.png`));
  } else {
  res.sendFile(path.join(__dirname,`./Plannings/planningPng/${image}`)); 
  }
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
      response.attachment.payload.url = `https://cpe-planning.jo-pouradier.fr/png/${imgName}.png`;
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
      user = await userInfo.getUser(sender_psid); // Make change on sendPlanningDay
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
      await writeMessage.sleep(400);
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
        message = { "text": "Vous êtes bien inscrit en 3ETI, vous pouvez maintenant utiliser ce chat bot ou le site: cpe-planning.jo-pouradier.fr avec votre code de liaison que vous trouverez ici (bouton)" };
        r = await writeMessage.callSendAPI(sender_psid, message);
      }
      break;
    case "CGP":
      // set the user filliere to payload
      sql_set_filiere = `UPDATE user SET filliere=? WHERE id_user=?`;
      await db.run(sql_set_filiere, [payload, sender_psid]);
      let inscription = "Inscrit";
      let sql_uptade_statusCgp = "UPDATE user SET status=? WHERE id_user=?";
      await db.run(sql_uptade_statusCgp, [inscription, sender_psid]);
      await writeMessage.sleep(400);
      if (await userInfo.is4CGP(sender_psid)) {
        console.log("4CGP");
        let messageMso = { "text": "V ;ous êtes en 4CGP, veuillez choisir vos mso, cliquez sur chacune de vos mso:" };
        r = await writeMessage.callSendAPI(sender_psid, messageMso);
        response = templates.askTemplateMsoCGP(Object.assign({}, variables.constant.MSO));
        for (let m of response) {
          console.log("mso sending");
          r = await writeMessage.callSendAPI(sender_psid, m);
        }
        message = { "text": "Vous êtes bien inscrit en 4CGP,choisissez bien vos mso. Vous pouvez maintenant utiliser ce chat bot ou le site: cpe-planning.jo-pouradier.fr avec votre code de liaison que vous trouverez ici (bouton)" };
        r = await writeMessage.callSendAPI(sender_psid, message);
      } else {
        console.log("3CGP");
        message = { "text": "Vous êtes bien inscrit en 3CGP, vous pouvez maintenant utiliser ce chat bot ou le site: cpe-planning.jo-pouradier.fr avec votre code de liaison que vous trouverez ici (bouton)" };
        r = await writeMessage.callSendAPI(sender_psid, message);
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
      message = { "text": "Vous êtes bien inscrit en 4ETI, vous pouvez maintenant utiliser ce chat bot ou le site: cpe-planning.jo-pouradier.fr avec votre code de liaison que vous trouverez ici (bouton)" };
      r = await writeMessage.callSendAPI(sender_psid, message);
      break;
    case "CODE":
      user = await userInfo.getUser(sender_psid);
      if (user.status == "Inscrit") {
        message = {text: `Ton code de liaison est :`};
        await writeMessage.callSendAPI(sender_psid, message);
        message = {text: `${sender_psid}`};
        await writeMessage.callSendAPI(sender_psid, message);
      } else {
        message = {text: `Tu n'es pas encore inscrit, fini ton inscription d'abord`};
        await writeMessage.callSendAPI(sender_psid, message);
      }
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
      } else  {
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

