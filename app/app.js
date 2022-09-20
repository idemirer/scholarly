const express = require('express');
const router = express.Router();
const axios = require('axios');

async function findAuthorWorks(author) {
  try {
    let response = await axios.get('https://api.crossref.org/works?query.author=' + author);
    let data = response.data['message'];
    return data;
  } catch (error) {
    error.message;
  }
}

async function findArticle(doi) {
  let response = await axios.get('https://api.crossref.org/works/' + doi);
  let data = response.data['message'];
  return data;
}

router.get('/author/:author', async (req, res, next) => {
  const author = req.params.author;
  let data = await findAuthorWorks(author);
  res.json(data);
});

router.get('/doi/:doi', async (req, res, next) => {
  const doi = req.params.doi.replace('"');
  let data = await findArticle(doi);
  res.json(data);
});

module.exports = router;
