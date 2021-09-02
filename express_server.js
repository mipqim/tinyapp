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

const users = { 
  "jI8Njdd": {
    id: "jI8Njdd", 
    email: "admin@example.com", 
    password: "1234"
  },
  "kST6Rs1": {
    id: "kST6Rs1", 
    email: "master@example.com", 
    password: "5678"
  }
};

const errMsgs = {
  ERRUSR001: "Email address is already being used.",
  ERRUSR002: "Email address or Password can not be empty."
};
/*
for (var planet in planetMoons) {
  // additional filter for object properties:
  if (planetMoons.hasOwnProperty(planet)) {
    //  ...
  }
}
*/

// 62 == count[0-9] + count[A-Z] + count[a-z]
// decimal 48 == '0' in utf-8
// decimal 65 == 'A' in utf-8
// decimal 97 == 'a' in utf-8
/**
 * @param {Number} len - length of random-string
 * @returns {String} random-string
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
  return randomStr;
}

//Read-index
app.get("/urls", (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]], urls : urlDatabase};
  res.render("urls_index", templateVars)
});

//Create
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  let id = '';
  if (Object.values(urlDatabase).indexOf(longURL) < 0) { //if value already exists
    id = generateRandomString(6);
    while (urlDatabase[id]) {
      id = generateRandomString(6);
    }
    urlDatabase[id] = longURL;
  } else { //if longUrl exist just redirect with id
    id = Object.keys(urlDatabase).find(key => urlDatabase[key] === longURL);
  }
  res.redirect(`/urls/${id}`);
});

//Page of creation
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  if (urlDatabase.hasOwnProperty(id)){
    delete urlDatabase[id];
  } 
  res.redirect("/urls");  
});

//Update
app.post("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;
  const newURL = req.body.newURL;

  if (urlDatabase.hasOwnProperty(id)){
    urlDatabase[id] = newURL;
  }
  res.redirect(`/urls/${id}`);
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;

  if (urlDatabase.hasOwnProperty(id)){
    const templateVars = { user: users[req.cookies["user_id"]], shortURL : id, longURL : urlDatabase[id]};
    res.render("urls_show", templateVars)
  } else {
    res.redirect("/urls");
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase.hasOwnProperty(req.params.shortURL)) {
    res.redirect(urlDatabase[req.params.shortURL]);
  } else {
    res.redirect("/urls");
  }
});

//Register User-view
app.get("/register", (req, res) => {
  //should block if user already login or has user-info in cookie?
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render('urls_register', templateVars);
});

//Register User
app.post("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  const email = req.body.email;
  const password = req.body.password;

  if (userExists(email)) {
    errorHandler(req, res, "urls_register", errMsgs.ERRUSR001);
    return;
  }
  if (email && password) {
    let id = generateRandomString(7);
    while (users.hasOwnProperty(id)) {
      id = generateRandomString(7);
    }
    // should check duplicate email?
    users[id] = {
      'id' : id,
      'email' : email,
      'password' : password  
    };
    res.cookie('user_id', id); 
    res.redirect("/urls");  
    return;
  } else {
    errorHandler(req, res, "urls_register", errMsgs.ERRUSR002);  
    return;  
  }
});


const errorHandler = (req, res, renderEJS, errMsg) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    'errMsg': errMsg
  };
  res.render(renderEJS, templateVars);
  return;
};

/**
 * @param {String} email 
 * @return {boolean}
 */
const userExists = (inputEmail) => {  
  for (userId in users) {
    if (users[userId].email === inputEmail) {
      return true;
    }    
  }
  return false;
};


//Login
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username); 
  res.redirect("/urls");
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");  
});



////////////////////////////////////////////////////////////
//Should delete? -start
////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////
//Should delete? -end
////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
