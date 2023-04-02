let sqlite3 = require("sqlite3"),
    { promisify } = require("util");

let db = new sqlite3.Database("users.db");
const queryDB = promisify(db.all).bind(db);

async function isReady(sender_psid) {
let lst_promo_ready = ["4ETI", "3ETI", "3CGP"];
let sql_get_user = "SELECT * FROM user WHERE id_user=?";
let user = (await queryDB(sql_get_user, [sender_psid]))[0];
console.log(`user is4A: ${user}`);
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
    let sql_get_user = "SELECT * FROM user WHERE id_user=?";
    let user = (await queryDB(sql_get_user, [sender_psid]))[0];
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
    let user = (await queryDB(sql_get_user, [sender_psid]))[0];
    return user;
}


module.exports = {
    isUserComplete,
    isReady,
    is4ETI,
    is4CGP,
    getUser
}