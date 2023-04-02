let userInfo = require("./userInfo"),
  variables = require("./variables"),
  fs = require("fs"),
  config = require("./config"),
  request = require("request");

async function readCsv(dir, Jour, sender_psid,user) {
    let planningRen = {};
    let rawdata;
    try {
      rawdata = fs.readFileSync(dir);
    } catch (err) {
      console.log(err);
    }
    let planningG = JSON.parse(rawdata);
    console.log(planningG)
    let Date;
    // loop days to get the desired day // May be a better way to do this
    for (let day in planningG) {
      if (day.includes(Jour)) {
        Date = day;
      }
    }
    console.log(getCurrentDate() , "readCsv user : ", user); 
    const demi_jour = ["Matin", "Aprem"];
    let GM = user.groupe;
    if (user.filliere = 'ETI'){
      if (user.promo = 4){
         GM = user.majeur;
      }
    } else {
      if (user.promo = 3){
        GM = GROUPE3CGP[user.groupe];
      }
      if (user.promo = 4){
        return;
      }
    }
    for (let dj of demi_jour) { 
      planningRen[dj] = []; 
      if (planningG[Date][dj][GM] !== null) {
        planningRen[dj].push(planningG[Date][dj][GM]);
      }
      planningRen[dj].push(planningG[Date][dj]["Pour tous"]);
    }
    console.log("planningRen = ", planningRen);
    return planningRen;
  }

// Formatting data to send to get something readable
async function constructMessage(planning) {
    let demi_jour = ["Matin", "Aprem"];
    let message = [[], []];
    let i = 0;
  
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
    console.log("message = ", message);
    return message;
  }

// read the planning json data to send Am and Pm
async function sendPlanningDay(payload, sender_psid) {
    let user = await userInfo.getUser(sender_psid);
    let promo;
    try {
        promo = user.promo.toString();
    } catch (e) {
        console.log(e);
        promo = "3";
    }
    let filliere = user.filliere;
    let planningJour = await readCsv(`./Output_Json/Planning${promo}${user.filliere}${variables.constant.DATE}.json`,
        payload,
        sender_psid,
        user
    );
    let rep = await constructMessage(planningJour);
    let message = { text: `Voici le planning de ${payload} : ` };
    let r = await callSendAPI(sender_psid, message);
    message = { text: `Matin : ${rep[0]}` };
    r = await callSendAPI(sender_psid, message);
    message = { text: `Après-midi : ${rep[1]}` };
    r = await callSendAPI(sender_psid, message);
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
  let err,
    res,
    body = await request({
      uri: "https://graph.facebook.com/v16.0/me/messages",
      qs: { access_token: config.get("facebook.page.access_token") },
      method: "POST",
      json: request_body,
    });
  // handling errors
  if (!err) {
    console.log("message sent!");
  } else {
    console.error("Unable to send message:" + err);
  }
  return;
}

module.exports = {
    sendPlanningDay,
    readCsv,
    constructMessage,
    getCurrentDate,
    callSendAPI,
};