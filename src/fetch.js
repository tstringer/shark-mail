const display = require('./display');
const https = require('https');
const parse = require('./parse');
const tag = require('./tag');

module.exports = () => {
  const mailConfig = require(`${process.env.HOME}/.shark-mail.js`);
  const options = {
    host: "mail.google.com",
    path: "/mail/feed/atom",
    headers: {
      'Authorization': 'Basic ' + new Buffer(mailConfig.cred.username + ':' + mailConfig.cred.password).toString('base64')
    }
  };
  https.get(options, (res) => {
    var requestData = '';
    res.on('data', (data) => {
      requestData += data;
    });
    res.on('end', () => {
      // do something with the email data
      parse(requestData)
        .then((emails) => {
          for (let i = 0; i < emails.length; i++) {
            tag.exists(emails[i].id)
              .then((exists) => {
                if (exists) {
                  display(`tag ${emails[i].id} exists in cache`);
                }
                else {
                  display(`tag ${emails[i].id} does not exist, caching now...`);
                  return tag.cache(emails[i].id);
                }
              })
              .then((tag) => { 
                if (tag) { 
                  display(`just cached ${tag}`); 
                } 
              })
              .catch((err) => display(err.message));
          }
        });
    });
  }).on('error', (err) => display.apply(null, `error :: ${err.message}`));
};