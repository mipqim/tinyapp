const express = require("express");
const app = express();
const PORT = 8080; 

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
//app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/*
61 == count[0-9] + count[A-Z] + count[a-z]
decimal 48 == '0' in utf-8
decimal 65 == 'A' in utf-8
decimal 97 == 'a' in utf-8
*/
const generateRandomString = (len = 6) => {
  let randomStr = '';

  for (let i = 0; i < len; i++) {
    let charNum = Math.floor(Math.random() * 62) + 48;
    if (charNum > 57) { //48+9
      charNum += 7;
    }
    if (charNum > 90) { //48+7+35
      charNum += 6;
    }
    randomStr += decodeURI(`%${charNum.toString(16)}`); //decimal to hexadecial then decoding utf-8
  }

  if (urlDatabase[randomStr]) {
    randomStr = generateRandomString(len);
  }

  return randomStr;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls : urlDatabase };
  res.render("urls_index", templateVars)
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  if (Object.values(urlDatabase).indexOf(longURL) < 0) { //if value already exists
    const id = generateRandomString(6);
    urlDatabase[id] = longURL;
  }
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;

  if (urlDatabase[id]){
    const templateVars = { shortURL : id, longURL : urlDatabase[id]};
    res.render("urls_show", templateVars)
  } else {
    res.redirect("/urls");
  }

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
