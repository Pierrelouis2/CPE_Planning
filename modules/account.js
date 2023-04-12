let sqlite3 = require("sqlite3"),
    { promisify } = require("util"),
    db = new sqlite3.Database("../users.db"),
    bcrypt = require('bcrypt');

const queryDB = promisify(db.all).bind(db);


// hash password
async function hashPassword(plaintextPassword) {
    const hash = await bcrypt.hash(plaintextPassword, "$2b$10$ZtQNnT5Vqmijvf8R9Sxhee");

    return hash;
}

// compare password
async function comparePassword(plaintextPassword, hash) {
    const result = await bcrypt.compare(plaintextPassword, hash);
    return result;
}

async function changeInfo(info) {
    console.log("info  =" ,info);
    console.log("prenom  =" ,info.prenom);
    let sql_info = [info.prenom, info.nom, info.email, info.password, info.rights ,info.code];
    console.log("sql_info  =" ,sql_info);
    let sql_change_info = `UPDATE profile SET prenom=?, nom='terstse', email='tetstsetse', password='test', rights='F' WHERE psid='1'`;
    await db.run(sql_change_info, sql_info, function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row(s) updated: ${this.changes}`);
    });
}


module.exports = {
    hashPassword,
    comparePassword,
    changeInfo
};