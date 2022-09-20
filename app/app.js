const express = require('express');
const router = express.Router();
const axios = require('axios');

async function findAuthorWorks(author) {
  let response = await axios.get('https://api.crossref.org/works?query.author=' + author);
  let data = response.data['message'];
  return data;
}

router.get('/:author', async (req, res, next) => {
  const author = req.params.author;
  let data = await findAuthorWorks(author);
  res.json(data);
});

module.exports = router;
