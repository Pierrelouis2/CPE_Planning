
let sqlite3 = require("sqlite3"),
    { promisify } = require("util");

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

    return [count3ETI, count3CGP, count4ETI, count4CGP];
}
// var countPromo = await webFunctions.getStatPromo();
// var countFilliere = await webFunctions.getStatFilliere();
// var countPromoFilliere = await webFunctions.getStatFillierePromo();

// labels : ["Promo", "Filliere", "Promo_Filliere"],
// xlabels: {Promo: ['Promo 4', 'Promo 3'], Filliere: ['ETI', 'CGP'], Promo_Filliere: ['3 ETI', '3 CGP', '4 ETI', '4 CGP']},
// ylabels: {Promo: countPromo, Filliere: countFilliere, Promo_Filliere: countPromoFilliere}

module.exports = {
    getStatPromo,
    getStatFilliere,
    getStatFillierePromo
}
