const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE;

mongoose
  .connect(DB)
  .then(() => {
    console.log('db is connected!');
  })
  .catch(ex => {
    console.log('db connection failed: ', ex);
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
