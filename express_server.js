const express = require("express");
const methodOverride = require('method-override');
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['overTheRainbow']
}));

const { urlDatabase, 
        users, 
        errMsgs, 
        generateRandomString, 
        userLogin, 
        hasOwnShortId, 
        getUserObj, 
        urlsForUser, 
        isValidUrl, 
        errorHandler 
      } = require('./helpers');

//Read-index
app.get("/urls", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR008);
    return;
  }
  const userID = req.session.user_id;
  const templateVars = {user: users[userID], urls: urlsForUser(userID ,urlDatabase)};
  res.render("urls_index", templateVars);
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
  if (!isValidUrl(longURL)) {
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

app.delete("/urls/:shortURL", (req, res) => {
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

app.put("/urls/:shortURL", (req, res) => {
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
      longURL: newURL,
      userID: userId,
      hit: hit,
      insertDate: insertDate
    };
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(userId ,urlDatabase)});
    return;
  }
  res.redirect("/urls");
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  if (!userLogin(req, users)) {
    errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR005);
    return;
  }

  const userId = req.session.user_id;
  const id = req.params.shortURL;
  if (hasOwnShortId(id, userId, urlDatabase)) {
    const templateVars = { user: users[userId], 
                           shortURL: id, 
                           longURL: urlDatabase[id].longURL, 
                           hit: urlDatabase[id].hit, 
                           insertDate: urlDatabase[id].insertDate
                          };
    res.render("urls_show", templateVars);
  } else {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_URL001, {urls: urlsForUser(userId ,urlDatabase)});
    return;
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(urlDatabase[shortURL]) {
    urlDatabase[shortURL].hit++;
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    return res.status(400).send(`>>> ${errMsgs._ERR_S_URL001} <<<<`);
  }
});

app.get("/register", (req, res) => {
  if (userLogin(req, users)) {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_USR003, {urls: urlsForUser(req.session.user_id ,urlDatabase)});
    return;
  }
  res.render('urls_register');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email.trim() || !password.trim()) {
    errorHandler(req, res, "urls_register", errMsgs._ERR_S_USR002, {triedEmail : email});
    return;
  }
  if (getUserObj(email, users)) {
    errorHandler(req, res, "urls_register", errMsgs._ERR_S_USR001, {triedEmail : email});
    return;
  }

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
 
});

app.get("/login", (req, res) => {
  if (userLogin(req, users)) {
    errorHandler(req, res, "urls_index", errMsgs._ERR_S_USR003, {urls: urlsForUser(req.session.user_id ,urlDatabase)});
    return;
  }
  res.render("urls_login");
});

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
  errorHandler(req, res, "urls_login", errMsgs._ERR_S_USR009, {triedEmail : email});  
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//Homepage
app.get("/", (req, res) => {
  if (userLogin(req, users)) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Simple Tiny app listening on port ${PORT}!`);
});