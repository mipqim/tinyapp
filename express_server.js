const express = require("express");
const app = express();
const PORT = 8080; 

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/*
62 == count[0-9] + count[A-Z] + count[a-z]
decimal 48 == '0' in utf-8
decimal 65 == 'A' in utf-8
decimal 97 == 'a' in utf-8
*/
const generateRandomString = (len = 6) => {
  let randomStr = '';

  for (let i = 0; i < len; i++) {
    let charNum = Math.floor(Math.random() * 62) + 48;
    if (charNum > 57) { //48 [start position of numbers] + 9 [0 to 9]
      charNum += 7;
    }
    if (charNum > 90) { //48+9+7+26
      charNum += 6;
    }
    randomStr += decodeURI(`%${charNum.toString(16)}`); //decimal to hexadecial then decoding with utf-8
  }

  if (urlDatabase[randomStr]) {
    randomStr = generateRandomString(len);
  }

  return randomStr;
}

//Read-index
app.get("/urls", (req, res) => {
  const templateVars = {username: req.cookies["username"], urls : urlDatabase};
  res.render("urls_index", templateVars)
});

//Create
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  let id = '';
  if (Object.values(urlDatabase).indexOf(longURL) < 0) { //if value already exists
    id = generateRandomString(6);
    urlDatabase[id] = longURL;
  } else {
    id = Object.keys(urlDatabase).find(key => object[key] === longURL);
  }
  res.redirect(`/urls/${id}`);
});

//Page of creation
app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;

  if (urlDatabase[id]){
    delete urlDatabase[id];
  } 
  res.redirect("/urls");  
});

//Update
app.post("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;
  const newURL = req.body.newURL;

  if (urlDatabase[id]){
    urlDatabase[id] = newURL;
  }
  res.redirect(`/urls/${id}`);
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;

  if (urlDatabase[id]){
    const templateVars = { username: req.cookies["username"], shortURL : id, longURL : urlDatabase[id]};
    res.render("urls_show", templateVars)
  } else {
    res.redirect("/urls");
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.redirect("/urls");
  }
});

//Login
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username); 
  res.redirect("/urls");  
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");  
});


//Should delete? -start
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting : 'Hello World!' };
  res.render('hello_world', templateVars);
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});
 
 app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});
//Should delete? -end

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
