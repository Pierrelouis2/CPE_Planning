let userInfo = require("./userInfo"),
  variables = require("./variables"),
  fs = require("fs"),
  config = require("config"),
  sqlite3 = require("sqlite3"),
  { promisify } = require("util"),
  request = require("request");
  templates = require("./templates");
  langues = require("./langues");

let db = new sqlite3.Database("users.db");
const queryDB = promisify(db.all).bind(db);

async function readCsv(dir, Jour, sender_psid,user){ // acutally we read a json file
    let planningRen = {};
    let rawdata;
    try {
      rawdata = fs.readFileSync(dir);
    } catch (err) {
      console.log(err);
    }
    let planningG = JSON.parse(rawdata);
    let Date;
    // loop days to get the desired day // May be a better way to do this
    for (let day in planningG) {
      if (day.includes(Jour)) {
        Date = day;
      }
    }
    console.log(Date)
    console.log(getCurrentDate() , "readCsv user : ", user); 
    const demi_jour = ["Matin", "Aprem"];
    let GM = variables.constant.GROUPES[user.groupe];
    if (user.filliere === 'ETI'){
      if (user.promo === '3'){
        try {
          GM = variables.constant.GROUPE3ETI[user.groupe];
        } catch (err) {
          console.log(err);
        }
      } else {
        GM = user.majeur;
      }
    } else {
      if (user.promo === '3'){
        GM = variables.constant.GROUPE3CGP[user.groupe];
      } if (user.promo === '4') {
        // get mso user
        sql_mso_user = "SELECT name_mso FROM mso INNER JOIN tj_user_mso ON tj_user_mso.id_mso = mso.id_mso WHERE tj_user_mso.id_user=?";
        var mso_user = (await queryDB(sql_mso_user, [sender_psid])); // dont add [0], we add a whole array (multiple line of the db)
      };
    };
    try {
      for (let dj of demi_jour) { 
        planningRen[dj] = [];
        planningRen[dj].push(planningG[Date][dj]["Pour tous"]);
        if (planningG[Date][dj][GM] != [] && planningG[Date][dj][GM] != undefined && planningG[Date][dj][GM] != null) {
          planningRen[dj].push(planningG[Date][dj][GM]);
        } else if (mso_user != undefined){
          for (let mso of mso_user){
            if (planningG[Date][dj][mso] != []){
              planningRen[dj].push(planningG[Date][dj][mso.name_mso]);
            };
          };
        };
      };
    } catch (err) {
      console.log(err);
    }
    return planningRen;
  }

// Formatting data to send to get something readable
async function constructMessage(planning,psid =0) {
    let demi_jour = ["Matin", "Aprem"];
    let message = ["", ""];
    let i = 0;
    try{
      for (let dj of demi_jour) {
        for (let matiere in planning[dj]) {
          for (let cellule in planning[dj][matiere]) {
            if (
              planning[dj][matiere][cellule].includes("Salle") ||
              planning[dj][matiere][cellule].includes("Salles")
            ) {
              message[i] += planning[dj][matiere][cellule] + ".\n\n";
            } else {
              message[i] += planning[dj][matiere][cellule] + ",\n";
            }
          } 
        }
        i++;
      }   
      if ( message[1].includes("LV")){ // if there is a language class, we need to add a special message
        message[1] += await langues.filtre(psid);
      }
    } catch (err) {
      console.log(err);
    }
    return message;
  }

// read the planning json data to send Am and Pm
async function sendPlanningDay(payload, sender_psid,user) {
    let promo = user.promo;
    let filliere = user.filliere;
    let planningJour = await readCsv(`./Output_Json/Planning${promo}${filliere}${variables.constant.DATE}.json`, payload, sender_psid, user );
    let rep = await constructMessage(planningJour, sender_psid);
    let message = { text: `Voici le planning de ${payload} :`};
    await callSendAPI(sender_psid, message);
    message = { text: `Matin : ${rep[0]}` };
    await callSendAPI(sender_psid, message);
    message = { text: `Après-midi : ${rep[1]}`};
    await callSendAPI(sender_psid, message);
    return;
  }

// function to get the current date in the format : 'YYYY/MM/DD HH:mm:ss'
function getCurrentDate() {
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// Send message to user
async function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = { recipient: { id: sender_psid }, message: null };
  // attach the appropriate message to the request body
  if (response.attachment) {
    request_body.message = { attachment: response.attachment };
  } else if (response.text) {
    request_body.message = { text: response.text };
  } else {
    console.log("error: no message to send");
  }
  // Send the HTTP request to the Messenger Platform
  let res = await request({
      uri: "https://graph.facebook.com/v16.0/me/messages",
      qs: { access_token: config.get("facebook.page.access_token") },
      method: "POST",
      json: request_body,
    });
  // handling errors
  if (res) {
    console.log("message sent!");
  } else {
    console.error("Unable to send message:");
    console.error(res);
  }
  await sleep(400);
  return;
}
async function sendMessageUsers(promo, filliere, message, planning=false) {
  let sql_get_user_table = "SELECT * FROM user WHERE promo=? AND filliere=?";
  let user_table = await queryDB(sql_get_user_table, [promo, filliere]);
  try{
    user_table.forEach( async (user) => {
        let message = { text: message };
        r = await callSendAPI(user.id_user, message);
        if (planning) {
          response = templates.askTemplateImage();
          let imgName = user.promo + user.filliere + variables.constant.DATE;
          response.attachment.payload.url = `https://cpe-planning.jo-pouradier.fr/png/${imgName}.png`;
          r = await callSendAPI(user.id_user, response);
        }
    });
  } catch (err) {
    console.log(err);
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sendPlanningDay,
    readCsv,
    constructMessage,
    getCurrentDate,
    callSendAPI,
    sleep,
    sendMessageUsers
};
