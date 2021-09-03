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

const userLogin = (req, users) => {
  //pretend to use curl with invalid userid
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
  for (userId in users) {
    if (users[userId].email === inputEmail) {
      return users[userId];
    }    
  }
  return false;
};

const urlsForUser = (id, urlDatabase) => {
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

module.exports = { generateRandomString, userLogin, hasOwnShortId, getUserObj, urlsForUser, isValidUrl };