const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('42 server up');
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
