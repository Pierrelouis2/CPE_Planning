// simple node js app to test the admin.html with express

let  express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    cookieParser = require("cookie-parser"),
    sessions = require('express-session'),
    path = require('path'),
    sqlite3 = require('sqlite3').verbose(),
    { promisify } = require("util"),
    db = new sqlite3.Database('../users.db'),
    variables = require('../modules/variables.json'),
    writeMessage = require('../modules/writeMessage.js');
    queryDB = promisify(db.all).bind(db); // used for get info from db

let app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3000, () => console.log('Listening on port 3000'));

// app.use(express.static('/public'));
let initpath = path.join(__dirname, 'html.ejs')
app.use(express.static(initpath));

// cookie parser middleware
app.use(cookieParser());

app.get('/', async function(req, res) {
    var mascots = [
        { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
        { name: 'Tux', organization: "Linux", birth_year: 1996},
        { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
    ];
    var tagline = "No programming concept is complete without a cute animal mascot.";
    let sql_users = "SELECT * FROM user";
    let users = await queryDB(sql_users);
    var countPromo = await getStatPromo();
    var countFilliere = await getStatFilliere();
    let variables = { 
        mascots: mascots,
        tagline: tagline,
        text: "ceci est ma viables de text conditionnel",
        users: users,
        labels : ["promo", "filliere"],
        xlabels: {promo: ['Promo 4', 'promo 3'], filliere: ['ETI', 'CGP']},
        ylabels: {promo: countPromo, filliere: countFilliere}
    }; 
    res.render(initpath, variables);
});

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

app.get('/planning', async function(req, res) {
    let majeur = variables.constant.MAJEURS;
    let mso = variables.constant.MSO;

    let variable = {   
        majeur: majeur,
        mso: mso,
        }
    res.render(path.join(__dirname, 'getPlanning.ejs'), variable);
});


app.post('/planning', async function(req, res) {
    console.log(req.body);
    let data = req.body;
    let majeur = variables.constant.MAJEURS;
    let mso = variables.constant.MSO;
    let id = '6271457816218293';
    let user = {id_user:id, promo: data.promo, filliere: data.filliere, majeur: data.majeur, groupe: data.groupe}
    let PlanningRend = await writeMessage.readCsv(`../Output_Json/Planning${data.promo + data.filliere + data.DATE}.json`, data.jour, id, user);
    let message = await writeMessage.constructMessage(PlanningRend);
    let variable = {majeur: majeur, mso: mso, data: data, message: message }
    
    res.render(path.join(__dirname, 'getPlanning.ejs'), variable);
});


