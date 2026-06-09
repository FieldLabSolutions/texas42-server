const express = require('express');
const { mkHand } = require('./engine');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('42 server alive');
});

app.get('/deal', (req, res) => {
  res.json(mkHand(0, [0, 0]));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
