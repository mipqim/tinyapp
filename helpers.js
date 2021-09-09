const urlDatabase = {};
const users = {};

const errMsgs = {
  _ERR_S_USR001: "Email address is already being used.",
  _ERR_S_USR002: "Email address or Password can not be empty.",
  _ERR_S_USR003: "User is already logged in.",
  _ERR_S_USR004: "Login is needed to create new URL.",
  _ERR_S_USR005: "Login is needed to see short URL.",
  _ERR_S_USR006: "Login is needed to delete short URL.",
  _ERR_S_USR007: "Login is needed to update short URL.",
  _ERR_S_USR008: "Login is needed.",
  _ERR_S_USR009: "Invalid login, please try again.",
  _ERR_S_URL001: "Short URL doesn't exist.",
  _ERR_S_URL002: "Long URL is something wrong.",
  _ERR_S_URL003: "Long URL is empty.",
  _ERR_S_URL004: "Long URL format is not valid."
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
};

const userLogin = (req, users) => {
  return users[req.session.user_id];
};

const hasOwnShortId = (shortUrl, userId, urlDatabase) => {
  return urlDatabase.hasOwnProperty(shortUrl) && urlDatabase[shortUrl].userID === userId;
};

/**
 * @param {String} email
 * @returns {(boolean|Object)}
 */
const getUserObj = (inputEmail, users) => {
  for (const userId in users) {
    if (users[userId].email === inputEmail) {
      return users[userId];
    }
  }
  return false;
};

const urlsForUser = (id, urlDatabase) => {
  let urls = {};
  for (const k in urlDatabase) {
    if (urlDatabase[k].userID === id) {
      urls[k] = urlDatabase[k];
    }
  }
  return urls;
};

const isValidUrl = (url) => {
  try {
    new URL(url);
  } catch (e) {
    return false;
  }
  return true;
};

//Pass an error message and object to a next webpage of Tinyapp
const errorHandler = (req, res, renderEJS, errMsg, obj) => {
  const templateVars = {
    user: users[req.session.user_id],
    'errMsg': errMsg
  };
  for (const el in obj) {
    templateVars[el] = obj[el];
  }
  res.render(renderEJS, templateVars);
  return;
};

module.exports = { urlDatabase, 
                   users, 
                   errMsgs, 
                   generateRandomString, 
                   userLogin, 
                   hasOwnShortId, 
                   getUserObj, 
                   urlsForUser, 
                   isValidUrl, 
                   errorHandler 
                 };