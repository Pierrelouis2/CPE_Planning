
const sqlite3 = require("sqlite3"),
    { promisify } = require("util"),
    templates = require("./templates"),
    writeMessage = require("./writeMessage"),
    db = new sqlite3.Database("users.db"),
    queryDB = promisify(db.all).bind(db);

async function isReady(sender_psid) {
  let lst_promo_ready = ["4ETI", "3ETI", "3CGP", "4CGP"];
  let sql_get_user = "SELECT * FROM user WHERE id_user=?";
  let user = (await queryDB(sql_get_user, [sender_psid]))[0];
  let PF = user.promo + user.filliere;
  if (lst_promo_ready.includes(PF)) {
      console.log("isReady");
      return true;
  } else {
      return false;
  }
}


async function is4ETI(sender_psid) {
let sql_get_user = "SELECT * FROM user WHERE id_user=?";
let user = (await queryDB(sql_get_user, [sender_psid]))[0];
if (user.promo === "4" && user.filliere === "ETI") {
  return true;
}
return false;
}
  
async function is4CGP(sender_psid) {
    let user = await getUser(sender_psid);
    console.log(`user in is4CGP:`);
    console.log(user);
    if (user.promo === "4" && user.filliere === "CGP") {
      return true;
      
    }
    return false;
}

// verify if the user is complete or not
async function isUserComplete(sender_psid) {
    let sql_get_user = "SELECT * FROM user WHERE id_user=?";
    let user = (await queryDB(sql_get_user, [sender_psid]))[0];
    if (user === undefined || user === []) {
      return false;
    }
    if (user.promo !== null && user.groupe !== null) {
      return true;
    }
    return false;
}

async function getUser(sender_psid) {
    let sql_get_user = "SELECT * FROM user WHERE id_user=?";
    let user;
    try {
      user = (await queryDB(sql_get_user, [sender_psid]))[0];
    } catch (error) {
      console.log(error);
    }
    return user;
}

// Check if the user is in our database
async function isKnownUser(sender_psid) {
  const user = await getUser(sender_psid);
  console.log("user isKnownUser test : " + sender_psid);
  if (user === undefined) {
    console.log("user undefined");
    return false;
  }
  // check that all fields are filled
  if (
    (user === [] || user.promo === null || user.groupe === null) &&
    user.status !== "Inscription"
  ) {
    console.log("user not in db");
    let message = {
      text: "Votre compte n'est pas complet, veuillez le refaire",
    };
    writeMessage.callSendAPI(sender_psid, message);
    message = templates.askTemplateNewUserPromo();
    writeMessage.callSendAPI(sender_psid, message);
    return false;
  }
  if (user.id_user.toString() === sender_psid) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
    isUserComplete,
    isReady,
    is4ETI,
    is4CGP,
    getUser,
    isKnownUser
}