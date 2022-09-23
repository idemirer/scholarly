const sample = require('./sample.json');

const refdata = sample['items'];
let allArticles = [];

for (let i = 0; i < refdata.length; i++) {
  allArticles.push({
    DOI: refdata[i]['DOI'],
    title: refdata[i]['title'],
    author: refdata[i]['author'],
    'container-title': refdata[i]['container-title'],
    published: refdata[i]['published'],
    URL: refdata[i]['URL'],
    'references-count': refdata[i]['references-count'],
    'is-referenced-by-count': refdata[i]['is-referenced-by-count'],
    volume: refdata[i]['volume'],
    'references-count': refdata[i]['references-count'],
  });
  if (refdata[i]['reference']) {
    for (let r = 0; r < refdata[i]['reference'].length; r++) {
      let next = refdata[i]['reference'][r];
      next['original_DOI'] = refdata[i]['DOI'];
      allArticles.push(next);
    }
  }
}

const filterArticles = allArticles.copyWithin();
const cleanNodes = filterArticles.filter(
  (filterArticles, index, self) =>
    index === self.findIndex((t) => t.save === filterArticles.save && t.DOI === filterArticles.DOI)
);

for (let c = 0; c < cleanNodes.length; c++) {
  cleanNodes[c]['id'] = c + 1;
}

for (let f = 0; f < allArticles.length; f++) {
  for (let c = 0; c < cleanNodes.length; c++) {
    if (allArticles[f]['DOI'] == cleanNodes[c]['DOI']) {
      allArticles[f]['original_id'] = cleanNodes[c]['id'];
    }
    if (allArticles[f]['original_DOI'] == cleanNodes[c]['DOI']) {
      allArticles[f]['reference_id'] = cleanNodes[c]['id'];
    }
  }
}

// for (const i of sample) {
//   for (const n of newIdSet) {
//     if (sample[i]['id'] !== newIdSet[n]['id']) {
//     }
//   }
// }

// for (let i = 0; i < allArticles.length; i++) {
//   if (allArticles[i]['id'] == undefined) {
//     console.log(allArticles[i]);
//   }
// }

// for (let i = 0; i < cleanNodes.length; i++) {
//   if (cleanNodes[i]['id'] == 100) {
//     console.log(cleanNodes[i]);
//   }
// }

console.log(allArticles[63]);
