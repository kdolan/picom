const fs = require('fs');
const path = require('path');

module.exports = {
  server: "mumble.example.net",
  port: 36001,
  username: "NodeJs",
  key: fs.readFileSync(path.resolve('./cert/key.pem')),
  cert: fs.readFileSync(path.resolve('./cert/cert.pem')),
};