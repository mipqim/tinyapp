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
    password: "1111"
  },
  "kST6Rs1": {
    id: "kST6Rs1", 
    email: "master@example.com", 
    password: "5678"
  }
};

const errMsgs = {
  ERR_S_USR001: "Email address is already being used.",
  ERR_S_USR002: "Email address or Password can not be empty.",
  ERR_S_USR003: "User is already logged in.",
  ERR_S_USR004: "Login is needed to create new URL.",
  ERR_S_URL005: "Short URL doesn't exist.",
  ERR_S_URL006: "Long URL is someting wrong."
};

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

//Create URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  let id = '';

  // Should find existing long URL the deny to create URL?
  id = generateRandomString(6);
  while (urlDatabase[id]) {
    id = generateRandomString(6);
  }
  urlDatabase[id] = {
    longURL,
    userID: users[req.cookies["user_id"]]
  };  
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
  if (!users[req.cookies["user_id"]]) {
    errorHandler(req, res, "urls_login", errMsgs.ERR_S_USR004);
    return;
  }
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

//Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  if (urlDatabase.hasOwnProperty(id)){
    delete urlDatabase[id];
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL005, {urls : urlDatabase});
    return;
  }
  res.redirect("/urls");  
});

//Update
app.post("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;
  const newURL = req.body.newURL;
  if (urlDatabase.hasOwnProperty(id)){
    urlDatabase[id] = {
      longURL : newURL
    };
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL005, {urls : urlDatabase});
    return;
  }
  res.redirect(`/urls/${id}`);
});

//Read-detail
app.get("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;

  if (urlDatabase.hasOwnProperty(id)){
    const templateVars = { user: users[req.cookies["user_id"]], shortURL : id, longURL : urlDatabase[id].longURL};
    res.render("urls_show", templateVars)
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL005, {urls : urlDatabase});
    return;
  }
});

//Redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  console.log('req.params.shortURL->',req.params.shortURL);  
  console.log(urlDatabase.hasOwnProperty(req.params.shortURL));

  console.log('shortURL->',shortURL);  
  console.log(urlDatabase.hasOwnProperty(shortURL));

  
  if (urlDatabase.hasOwnProperty(shortURL)) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL006, {urls : urlDatabase});
    return;
  }
  // if (urlDatabase.hasOwnProperty(req.params.shortURL)) {
  //   res.redirect(urlDatabase[req.params.shortURL].longURL);
  // } else {
  //   errorHandler(req, res, "urls_index", errMsgs.ERR_S_URL006, {urls : urlDatabase});
  //   return;
  // }
});

//Register User-view
app.get("/register", (req, res) => {
//  const templateVars = { user: users[req.cookies["user_id"]]};
  if (users[req.cookies["user_id"]]) {
    errorHandler(req, res, "urls_index", errMsgs.ERR_S_USR003, {urls : urlDatabase});
    return;
  }
  // res.render('urls_register', templateVars);
  res.render('urls_register');
});

//Register User
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (checkRegistInfo(email, password)) {
    let id = generateRandomString(7);
    while (users.hasOwnProperty(id)) {
      id = generateRandomString(7);
    }
    users[id] = {
      'id' : id,
      'email' : email,
      'password' : password  
    };
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
}

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
  if (users[req.cookies["user_id"]]) {
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
    if (user.password === password) {
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
  res.redirect("/urls");
});

// /**
//  * @param {String} email 
//  * @return {boolean}
//  */
//  const userExists = (inputEmail) => {  
//   for (userId in users) {
//     if (users[userId].email === inputEmail) {
//       return true;
//     }    
//   }
//   return false;
// };

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
