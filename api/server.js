const express = require('express');

const app = express();
const PORT = 8081;

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
