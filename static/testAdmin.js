// simple node js app to test the admin.html with express

let  express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    bcrypt = require('bcrypt'),
    hashedPassword = require('./hashedPassword');

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(3000, () => console.log('Listening on port 3000'));

app.get('/', function(req, res) {
    //read file
    let html = fs.readFileSync('./admin.html', 'utf8');
    //send file
    res.status(200).send(html);
});


// app path to handle a form post
app.post('/form', async function(req, res) {
    let body = req.body;
    let password = req.body.password;
    let user = req.body.user;
    let function_to_do = req.body.function;
    console.log(body);
    console.log(hashedPassword.password.hashjo);
    let hash =  await hashPassword(password);
    console.log(hash);
    console.log(await comparePassword(password, "$2b$10$ZtQNnT5Vqmijvf8R9Sxheev6K6PZWkObGqJwQZILB4rKrtcKQY60m"));
    let html = fs.readFileSync('./admin.html', 'utf8');
    res.status(200).send(html);
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


