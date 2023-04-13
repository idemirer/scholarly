const express = require('express');
const router = express.Router();
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const authorData = require('./author.json');
const url = process.env.MONGO_URI;

// const localurl = 'mongodb://localhost:27017';
// const localclient = new MongoClient(localurl);

const client = new MongoClient(url);
const dbName = 'cross';

async function mongoPull() {
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('cross');
  const findResult = await collection.find({ title: { $regex: /financial/gim } }).toArray();

  // try {
  //   await localclient.connect();
  //   await client.connect();
  //   console.log('Connected successfully to server');
  //   const localdb = localclient.db(dbName);
  //   const localcollection = localdb.collection('cross');
  //   const db = client.db(dbName);
  //   const collection = db.collection('cross');
  //   const findResult = await localcollection.find({}).toArray();
  //   const result = await collection.insertMany(findResult);
  // } finally {
  //   await client.close();
  //   await localclient.close();
  // }
  return findResult;
}

async function findAuthorWorks(author) {
  // const authorTerm = encodeURIComponent(author);
  // const url = `https://api.crossref.org/works?query.author=${authorTerm}`;
  // try {
  //   let response = await axios.get(url);
  //   let data = response.data['message'];
  //   return data;
  // } catch (error) {
  //   error.message;
  // }
  return authorData['message'];
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
  const author = req.params.author;
  let data = await findAuthorWorks(author);
  res.json(data);
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

router.get('/mongo/', async (req, res, next) => {
  const data = await mongoPull();
  res.json(data);
});

module.exports = router;
