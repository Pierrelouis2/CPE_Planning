const sqlite3 = require("sqlite3"),
  { promisify } = require("util"),
  db = new sqlite3.Database("users.db"),
  bcrypt = require("bcrypt"),
  queryDB = promisify(db.all).bind(db);

// hash password
async function hashPassword(plaintextPassword) {
  const hash = await bcrypt.hash(
    plaintextPassword,
    "$2b$10$ZtQNnT5Vqmijvf8R9Sxhee"
  );
  return hash;
}

// compare password
async function comparePassword(plaintextPassword, email) {
  sql_get_hash = `SELECT password FROM profile WHERE email=?`;
  let hash = (await queryDB(sql_get_hash, email))[0];
  if (hash !== undefined) {
    hash = hash.password;
  } else {
    hash = ""; // What do we do for this case?
  }
  const result = await bcrypt.compare(plaintextPassword, hash);
  return result;
}

async function updateAccount(info) {
  let sql_change_info = `UPDATE profile SET prenom=?, nom=?, email=?, password=?, rights=? WHERE psid=?`;
  await db.run(
    sql_change_info,
    [info.prenom, info.nom, info.email, info.password, "F", info.code],
    function (err) {
      if (err) {
        console.error(err.message);
        return 0;
      } else {
        console.log(`user ${info.code} updated`);
        return 1;
      }
    }
  );
}

async function getProfile(mail) {
  let sql_get_profile = `SELECT * FROM profile WHERE email=?`;
  let profile = (await queryDB(sql_get_profile, mail))[0];
  return profile;
}

async function register(user) {
  let sql_verify_user = "SELECT * FROM user WHERE id_user=?";
  let verify = (await queryDB(sql_verify_user, user.code))[0];
  console.log(verify);
  if (verify !== undefined) {
    let sql_register = `INSERT INTO profile(psid, prenom, nom, email, password, rights) VALUES(?,?,?,?,?,?)`;
    await db.run(
      sql_register,
      [user.code, user.prenom, user.nom, user.email, user.password, "F"],
      async function (err) {
        if (err) {
          console.log(err);
          return 0;
        } else {
          console.log(`Account created for ${user.psid}`);
          return 1;
        }
      }
    );
    return 1;
  } else {
    return 0;
  }
}

async function isAllow(mail,allowed) {
  console.log("mail : ", mail);
  let sql_is_allow = "SELECT rights FROM profile WHERE email=?";
  let allow = (await queryDB(sql_is_allow, mail))[0];
  if (allow === undefined) {
    return 0;
  } else {
    allow = allow.rights;
    if (allowed.includes(allow)){
      return 1;
    } else {
      return 0;
    }
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  updateAccount,
  getProfile,
  register,
  isAllow,
};
