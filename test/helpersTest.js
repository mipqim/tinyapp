const { assert } = require('chai');

const { generateRandomString, userLogin } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('generateRandomString', function() {
  it('Should return alphanumeric', function() {
    const randomStr = generateRandomString(6);
    assert.notEqual(randomStr, undefined);
    assert.ok(randomStr.length === 6);
    assert.ok(randomStr.match(/^[0-9a-zA-Z]+$/));
  });  
});  

describe('userLogin', function() {
  it('Should return user object in testUsers', function() {
    const req = {session:{user_id: 'user2RandomID'}};
    const expectedOutput = testUsers['user2RandomID'];
    const user = userLogin(req, testUsers);
    assert.equal(expectedOutput.id, user.id);
    assert.equal(expectedOutput.email, user.email);
    assert.equal(expectedOutput.password, user.password);
  });  
}); 

