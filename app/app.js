const express = require('express');
const router = express.Router();
const axios = require('axios');

const authorData = require('./author.json');

async function findAuthorWorks(author) {
  try {
    let response = await axios.get('https://api.crossref.org/works?query.author=' + author);
    let data = response.data['message'];
    return data;
  } catch (error) {
    error.message;
  }
}

async function searchTopic(topic) {
  const selectedParts =
    'DOI,ISBN,ISSN,URL,abstract,author,container-title,title,type,published,reference,references-count,is-referenced-by-count,volume,issue,event';
  const searchTerms = encodeURIComponent(topic);
  const url = `http://api.crossref.org/works?query=${searchTerms}&mailto=posta.gereksiz@gmail.com&filter=type:journal-article&select=${selectedParts}&rows=100&cursor=*`;
  try {
    let response = await axios.get(url);
    let data = response.data['message'];
    return data;
  } catch (error) {
    error.message;
  }
}

async function findArticle(doi) {
  try {
    let response = await axios.get('https://api.crossref.org/works/' + doi);
    let data = response.data['message'];
    return data;
  } catch (error) {
    error.message;
  }
}

router.get('/author/:author', async (req, res, next) => {
  // const author = req.params.author;
  // let data = await findAuthorWorks(author);
  res.json(authorData['message']);
});

router.get('/topic/:topic', async (req, res, next) => {
  const topic = req.params.topic;
  let data = await searchTopic(topic);
  res.json(data);
});

router.get('/doi/:doi', async (req, res, next) => {
  const doi = req.params.doi.replace('"');
  let data = await findArticle(doi);
  res.json(data);
});

module.exports = router;
