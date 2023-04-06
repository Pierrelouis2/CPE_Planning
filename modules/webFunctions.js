
let sqlite3 = require("sqlite3"),
    { promisify } = require("util")

let db = new sqlite3.Database("users.db");
const queryDB = promisify(db.all).bind(db);

async function getStatPromo(){
    var count4A = 0;
    var count3A = 0;
    let sql_promo = "SELECT promo FROM user ";
    let promo = await queryDB(sql_promo);
    for (var i = 0; i < promo.length; i++) {
        if (promo[i].promo === '4'){
            count4A ++;
        }
    }
    count3A = promo.length - count4A;
    console.log("count4A : ", count4A);
    console.log("count3A : ", count3A);
    return [count4A, count3A];
}

async function getStatFilliere(){
    var countETI = 0;
    var countCGP = 0;
    let sql_filliere = "SELECT filliere FROM user ";
    let filliere = await queryDB(sql_filliere);
    for (var i = 0; i < filliere.length; i++) {
        if (filliere[i].filliere === 'ETI'){
            countETI ++;
        }
    }
    countCGP = filliere.length - countETI;
    console.log("countETI : ", countETI);
    console.log("countCGP : ", countCGP);
    return [countETI, countCGP];
}

async function getStatFillierePromo(){
    var count3ETI = 0;
    var count3CGP = 0;
    var count4ETI = 0;
    var count4CGP = 0;
    let sql_filliere_promo = "SELECT filliere, promo FROM user ";
    let filliere_promo = await queryDB(sql_filliere_promo);
    for (var i = 0; i < filliere_promo.length; i++) {
        if (filliere_promo[i].filliere === 'ETI' && filliere_promo[i].promo === '3'){
            count3ETI ++;
        }
        if (filliere_promo[i].filliere === 'CGP' && filliere_promo[i].promo === '3'){
            count3CGP ++;
        }
        if (filliere_promo[i].filliere === 'ETI' && filliere_promo[i].promo === '4'){
            count4ETI ++;
        }
        if (filliere_promo[i].filliere === 'CGP' && filliere_promo[i].promo === '4'){
            count4CGP ++;
        }
    }
    console.log("count3ETI : ", count3ETI);
    console.log("count3CGP : ", count3CGP);
    console.log("count4ETI : ", count4ETI);
    console.log("count4CGP : ", count4CGP);
    return [count3ETI, count3CGP, count4ETI, count4CGP];
}

module.exports = {
    getStatPromo,
    getStatFilliere,
    getStatFillierePromo
}
