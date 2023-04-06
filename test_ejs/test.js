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
    let variables = { 
        mascots: mascots, 
        tagline: tagline,
        users: users
    };
    res.render(initpath, variables);
});

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
    let user = {id_user:id, promo: data.promo, filliere: data.filliere, majeur: data.majeur}
    let PlanningRend = await writeMessage.readCsv(`../Output_Json/Planning${data.promo + data.filliere + data.DATE}.json`, data.jour, id, user);
    let message = await writeMessage.constructMessage(PlanningRend);
    let variable = {majeur: majeur, mso: mso, data: data, message: message }
    
    res.render(path.join(__dirname, 'getPlanning.ejs'), variable);
});


