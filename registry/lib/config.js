require('dotenv').config()
process.env = Object.assign({
  PORT:3000,
  EXTERNAL_HOST:"http://localhost:3000"
},process.env);

module.exports = process.env;