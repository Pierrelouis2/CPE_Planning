let sqlite3 = require("sqlite3"),
    { promisify } = require("util"),
    db = new sqlite3.Database("users.db"),
    bcrypt = require('bcrypt');

const queryDB = promisify(db.all).bind(db);


// hash password
async function hashPassword(plaintextPassword) {
    const hash = await bcrypt.hash(plaintextPassword, "$2b$10$ZtQNnT5Vqmijvf8R9Sxhee");

    return hash;
}

// compare password
async function comparePassword(plaintextPassword, user) {
    console.log("user : " ,user);
    sql_get_hash = "SELECT password FROM profile WHERE email=?"
    let hash = (await queryDB(sql_get_hash,user))[0].password;
    console.log("hash : " ,hash);
    const result = await bcrypt.compare(plaintextPassword, hash);
    return result;
}

async function changeInfo(info) {
    let sql_change_info = `UPDATE profile SET prenom=?, nom=?, email=?, password=?, rights=? WHERE psid=?`;
    await db.run(sql_change_info, [info.prenom, info.nom, info.email, info.password, 'F' ,info.code], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
    });
}

async function getProfile(mail) {
    let sql_get_profile = `SELECT * FROM profile WHERE email=?`;
    let profile = (await queryDB(sql_get_profile,mail))[0];
    return profile;
}

async function register(user) {
    let sql_verify_user = "SELECT * FROM user WHERE id_user=?"
    let verify = (await queryDB(sql_verify_user,user.psid))[0];
    if (verify!==undefined){
        let sql_register = `INSERT INTO profile(psid, prenom, nom, email, password, rights) VALUES(?,?,?,?,?,?)`;
        await db.run(sql_register, [user.psid, user.prenom, user.nom, user.email, user.password, 'F'], function (err) {
            if (err) {
                console.log(err);
                return 0;
            } else {
                console.log(`Row(s) inserted: ${this.changes}`);
                return 1;
            }
        });
        return 1;
        }   else {
            return 0;  
    }
}

async function isAllow(user) {
    console.log("user : " ,user);
    let sql_is_allow = "SELECT rights FROM profile WHERE email=?"
    let allow = (await queryDB(sql_is_allow,user))[0].rights;
    if (allow==='F'){
        return 1;
    }
    else {
        return 0;
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    changeInfo,
    getProfile,
    register,
    isAllow
};