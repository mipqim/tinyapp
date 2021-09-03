const express = require("express");
const app = express();
const PORT = 8080; 

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "jI8Njdd"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "jI8Njdd"
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
  ERR_S_USR001: "Email address is already being used.",
  ERR_S_USR002: "Email address or Password can not be empty.",
  ERR_S_USR003: "User is already logged in.",
  ERR_S_USR004: "Login is needed to create new URL.",
  ERR_S_USR005: "Login is needed to see short URL",
  ERR_S_USR006: "Login is needed to delete short URL",
  ERR_S_USR007: "Login is needed to update short URL",
  ERR_S_USR008: "Login is needed",
  ERR_S_URL001: "Short URL doesn't exist.",
  ERR_S_URL002: "Long URL is someting wrong.",
  ERR_S_URL003: "Long URL is empty.",
  ERR_S_URL004: "Long URL format is not valid."
};

//Read-index
app.get("/urls", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR008);
    return;
  }

  const userID = req.cookies["user_id"];
  const templateVars = {user: users[userID], urls : urlsForUser(userID)};
  res.render("urls_index", templateVars)
});

//Create URL
app.post("/urls", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR004);
    return;
  }

  const longURL = req.body.longURL;
  if (!longURL.trim()) {
    errorHandler(req, res, "urls_new", errMsgs.ERR_S_URL003);
    return;
  }
  if (!isValidUrl(longURL)){
    errorHandler(req, res, "urls_new", errMsgs.ERR_S_URL004);
    return;    
  }

  let id = '';
  // Should find existing long URL the deny to create URL by userId?
  id = generateRandomString(6);
  while (urlDatabase[id]) {
    id = generateRandomString(6);
  }
  urlDatabase[id] = {
    longURL,
    userID: req.cookies["user_id"]
  };  

 
//TBDTBD userid, long URL check

  // if (Object.values(urlDatabase).indexOf(longURL) < 0) { //if value already exists
  //   id = generateRandomString(6);
  //   while (urlDatabase[id]) {
  //     id = generateRandomString(6);
  //   }
  //   urlDatabase[id] = {
  //     longURL,
  //     userID: users[req.cookies["user_id"]]
  //   };
  // } else { //if longUrl exist just redirect with id
  //   //TBDTBDTBDTBDTBDTBDTBD error handler pass
  //   id = Object.keys(urlDatabase).find(key => urlDatabase[key].longURL === longURL);
  // }
  res.redirect(`/urls/${id}`);
});

//Create URL-view
app.get("/urls/new", (req, res) => {  
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR004);
    return;
  }

  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR006);
    return;
  }

  const userId = req.cookies["user_id"];
  const id = req.params.shortURL;
  if (hasOwnShortId(id, userId)) {
    delete urlDatabase[id];
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL001, {urls : urlDatabase});
    return;
  }
  res.redirect("/urls");  
});

//Update
app.post("/urls/:shortURL", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR007);
    return;
  }

  const id = req.params.shortURL;
  const newURL = req.body.newURL;
  const userId = req.cookies["user_id"];
  if (hasOwnShortId(id, userId)) {
    urlDatabase[id] = {
      longURL : newURL,
      userID : userId
    };
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL001, {urls : urlDatabase});
    return;
  }
  res.redirect(`/urls/${id}`);
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR005);
    return;
  }

  const userId = req.cookies["user_id"];
  const id = req.params.shortURL;  
  if (hasOwnShortId(id, userId)){
    const templateVars = { user: users[userId], shortURL : id, longURL : urlDatabase[id].longURL};
    res.render("urls_show", templateVars)
  } else {
    errorHandler(req, res, "urls_index", id +" / "  +userId+" / " +errMsgs.ERR_S_URL001+" get", {urls : urlDatabase});
    return;
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  if (!userLogin(req)) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR008);
    return;
  }

  const shortURL = req.params.shortURL;  
  if (hasOwnShortId(shortURL, ureq.cookies["user_id"])) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL002, {urls : urlDatabase});
    return;
  }
});

//Register User-view
app.get("/register", (req, res) => {
  if (userLogin(req)) {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_USR003, {urls : urlDatabase});
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
    console.log(users);
    res.cookie('user_id', id); 
    res.redirect("/urls");  
  } else {
    res.status(400).end();
  } 
});

const checkRegistInfo = (email, password) => {
  if (email.trim() && password.trim()) {
    // errorHandler(req, res, "urls_register", errMsgs.ERRUSR002);  
    if (!getUserObj(email)) {
      //errorHandler(req, res, "urls_register", errMsgs.ERRUSR001);
      return true;
    }
  }
  return false;
};

const errorHandler = (req, res, renderEJS, errMsg, obj) => {
  const templateVars = { 
    user: users[req.cookies["user_id"]],
    'errMsg': errMsg
  };
  for (el in obj) {
    templateVars[el] = obj[el];
  }

  res.render(renderEJS, templateVars);
  return;
};

//Login-view
app.get("/login", (req, res) => {
  if (userLogin(req)) {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_USR003, {urls : urlDatabase});
    return;
  }
  res.render("urls_login");
});

//Login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserObj(email);

  if (user) {
//    if (user.password === password) {
    if (bcrypt.compareSync(password, user.password)) {
      res.cookie('user_id', user.id); 
      res.redirect("/urls");
      return;
    }
  } 
  res.status(403).end();
});

//Logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});


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

const userLogin = (req) => {
  //pretend to use curl with invalid userid
  return users[req.cookies["user_id"]];
};

const hasOwnShortId = (shortUrl, userId) => {
  return urlDatabase.hasOwnProperty(shortUrl) && urlDatabase[shortUrl].userID === userId;
};

/**
 * @param {String} email 
 * @returns {(boolean|Object)}
 */
const getUserObj = (inputEmail) => {
  for (userId in users) {
    if (users[userId].email === inputEmail) {
      return users[userId];
    }    
  }
  return false;
};

const urlsForUser = (id) => {
  let urls={};
  for (k in urlDatabase) {
    if (urlDatabase[k].userID === id) {
      urls[k] = urlDatabase[k];
    }
  }
  return urls;
};

//better to be on view level?
const isValidUrl = (url) => {
  try {
    new URL(url);
  } catch (e) {
    return false;
  }
  return true;
};

app.listen(PORT, () => {
  console.log(`Simple Tiny app listening on port ${PORT}!`);
});