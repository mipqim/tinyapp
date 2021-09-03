const express = require("express");
const app = express();
const PORT = 8080; 

const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['overTheRainbow']
}))

const { generateRandomString, userLogin, hasOwnShortId, getUserObj, urlsForUser, isValidUrl } = require('./helpers');

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "jI8Njdd",
    hit: 11,
    insertDate: '2020-12-02'
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "jI8Njdd",
    hit: 100,
    insertDate: '2021-09-01'
  }
};

const users = { 
  "jI8Njdd": {
    id: "jI8Njdd", 
    email: "jeff.shjeon@gmail.com", 
    password: "$2b$10$NX0v98lKM2u.fJECvHdUouR7maVlo5tobWBHmUxFTt4oe.F2r/j2y"
  },
  "kST6Rs1": {
    id: "kST6Rs1", 
    email: "master@example.com", 
    password: "$2b$10$WW0NsLRTzhDPis7l9/qHwOKoKUnXghGISASMwN2dnwx8vVZ3tj47K"
  }
};

const errMsgs = {
  _ERR_S_USR001: "Email address is already being used.",
  _ERR_S_USR002: "Email address or Password can not be empty.",
  _ERR_S_USR003: "User is already logged in.",
  _ERR_S_USR004: "Login is needed to create new URL.",
  _ERR_S_USR005: "Login is needed to see short URL",
  _ERR_S_USR006: "Login is needed to delete short URL",
  _ERR_S_USR007: "Login is needed to update short URL",
  _ERR_S_USR008: "Login is needed",
  _ERR_S_URL001: "Short URL doesn't exist.",
  _ERR_S_URL002: "Long URL is someting wrong.",
  _ERR_S_URL003: "Long URL is empty.",
  _ERR_S_URL004: "Long URL format is not valid."
};

//Read-index
app.get("/urls", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR008);
    return;
  }
  const userID = req.session.user_id;
  const templateVars = {user: users[userID], urls: urlsForUser(userID ,urlDatabase)};
  res.render("urls_index", templateVars)
});

//Create URL
app.post("/urls", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR004);
    return;
  }

  const longURL = req.body.longURL;
  if (!longURL.trim()) {
    errorHandler(req, res, "urls_new", errMsgs._ERR_S_URL003);
    return;
  }
  if (!isValidUrl(longURL)){
    errorHandler(req, res, "urls_new", errMsgs._ERR_S_URL004);
    return;    
  }

  let id = '';
  let today = new Date();
  id = generateRandomString(6);
  while (urlDatabase[id]) {
    id = generateRandomString(6);
  }
  urlDatabase[id] = {
    longURL,
    userID: req.session.user_id,
    hit: 0,
    insertDate: today.toLocaleDateString()
  };  
  res.redirect(`/urls/${id}`);
});

//Create URL-view
app.get("/urls/new", (req, res) => {  
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR004);
    return;
  }

  const templateVars = { user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR006);
    return;
  }

  const userId = req.session.user_id;
  const id = req.params.shortURL;
  if (hasOwnShortId(id, userId, urlDatabase)) {
    delete urlDatabase[id];
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(userId ,urlDatabase)});
    return;
  }
  res.redirect("/urls");  
});

//Update
app.post("/urls/:shortURL", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR007);
    return;
  }

  const id = req.params.shortURL;
  const newURL = req.body.newURL;
  const userId = req.session.user_id;
  if (hasOwnShortId(id, userId, urlDatabase)) {
    const hit = urlDatabase[id].hit;
    const insertDate = urlDatabase[id].insertDate;
    urlDatabase[id] = {
      longURL : newURL,
      userID : userId,
      hit : hit,
      insertDate: insertDate
    };
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(userId ,urlDatabase)});
    return;
  }
  res.redirect(`/urls/${id}`);
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR005);
    return;
  }

  const userId = req.session.user_id;
  const id = req.params.shortURL;  
  if (hasOwnShortId(id, userId, urlDatabase)){
    const templateVars = { user: users[userId], shortURL : id, longURL : urlDatabase[id].longURL, hit: urlDatabase[id].hit, insertDate: urlDatabase[id].insertDate};
    res.render("urls_show", templateVars)
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(userId ,urlDatabase)});
    return;
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR008);
    return;
  }

  const shortURL = req.params.shortURL;  
  if (hasOwnShortId(shortURL, req.session.user_id, urlDatabase)) {
    urlDatabase[shortURL].hit++;
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(req.session.user_id ,urlDatabase)});
    return;
  }
});

//Register User-view
app.get("/register", (req, res) => {
  if (userLogin(req, users)) {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_USR003, {urls: urlsForUser(req.session.user_id ,urlDatabase)});
    return;
  }
  res.render('urls_register');
});

//Register User
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (checkRegistInfo(email, hashedPassword)) {
    let id = generateRandomString(7);
    while (users.hasOwnProperty(id)) {
      id = generateRandomString(7);
    }
    users[id] = {
      'id' : id,
      'email' : email,
      'password' : hashedPassword  
    };
    req.session.user_id = id; 
    res.redirect("/urls");  
  } else {
    res.status(400).end();
  } 
});

const checkRegistInfo = (email, password) => {
  if (email.trim() && password.trim()) {
    // errorHandler(req, res, "urls_register", errMsgs.ERRUSR002);  
    if (!getUserObj(email, users)) {
      //errorHandler(req, res, "urls_register", errMsgs.ERRUSR001);
      return true;
    }
  }
  return false;
};

//Login-view
app.get("/login", (req, res) => {
  if (userLogin(req, users)) {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_USR003, {urls: urlsForUser(req.session.user_id ,urlDatabase)});
    return;
  }
  res.render("urls_login");
});

//Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserObj(email, users);

  if (user) {
    if (bcrypt.compareSync(password, user.password)) {
      req.session.user_id = user.id;
      res.redirect("/urls");
      return;
    }
  } 
  res.status(403).end();
});

//Logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//website root
app.get("/", (req, res) => {
  if (userLogin(req, users)) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

//Is it a helper function?
const errorHandler = (req, res, renderEJS, errMsg, obj) => {
  const templateVars = { 
    user: users[req.session.user_id],
    'errMsg': errMsg
  };
  for (el in obj) {
    templateVars[el] = obj[el];
  }
  res.render(renderEJS, templateVars);
  return;
};

app.listen(PORT, () => {
  console.log(`Simple Tiny app listening on port ${PORT}!`);
});