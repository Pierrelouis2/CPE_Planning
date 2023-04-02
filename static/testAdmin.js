// simple node js app to test the admin.html with express

let  express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    bcrypt = require('bcrypt'),
    hashedPassword = require('./hashedPassword');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const path = require('path');

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3000, () => console.log('Listening on port 3000'));



// creating 24 hours from milliseconds
const oneDay = 1000 ;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));


// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static('public'));

// cookie parser middleware
app.use(cookieParser());


//username and password
const myusername = 'user1'
const mypassword = 'mypassword'

// a variable to save a session
var session;



app.get('/', function(req, res) {
    res.redirect('/login');
 
});
app.get('/admin', function(req, res) {
    session = req.session;
    if (session.userid){
        // let homepage = fs.readFileSync('.public/html/home.html', 'utf8');
        res.sendFile('public/html/home.html', {root: __dirname});;
    }
    else {
        res.redirect('/login');
    }

    // //read file
    // let html = fs.readFileSync('./admin.html', 'utf8');
    // //send file
    // res.status(200).send(html);
});


// app path to handle a form post
app.get('/login',function(req, res){
    
    res.sendFile(__dirname + "/" + 'public/html/login.html');

    if (req.body.user == myusername && req.body.password == mypassword){
        session = req.session;
        session.userid = req.body.user;
        console.log(req.session);
        res.redirect('/admin');
    }
    else {
        res.send(html);
    }



    // let body = req.body;
    // let password = req.body.password;
    // let user = req.body.user;
    // let function_to_do = req.body.function;
    // console.log(body);
    // console.log(hashedPassword.password.hashjo);
    // let hash =  await hashPassword(password);
    // console.log(hash);
    // console.log(await comparePassword(password, "$2b$10$ZtQNnT5Vqmijvf8R9Sxheev6K6PZWkObGqJwQZILB4rKrtcKQY60m"));
    // let html = fs.readFileSync('./admin.html', 'utf8');
    // res.status(200).send(html);
});

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


