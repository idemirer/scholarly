async function getAuthorData(author) {
  try {
    const url = './api/author/' + author;
    const data = await fetch(url).then((res) => res.json());
    return data;
  } catch (error) {
    error.message;
  }
}
async function getArticleData(doi) {
  doi = encodeURIComponent(doi);
  try {
    const url = './api/doi/' + doi;
    const data = await fetch(url).then((res) => res.json());
    console.log(data);
    return data;
  } catch (error) {
    error.message;
  }
}

async function getAllArticles() {
  const authordata = await getAuthorData('"Ilhan Demirer SUNY"');
  const articleList = authordata['items'];

  let summary = [];
  let year = [];
  let text = [];
  let citationCount = [];
  for (let i = 0; i < articleList.length; i++) {
    let title = articleList[i]['title'][0];
    let year = articleList[i]['issued']['date-parts'][0][0];
    let journal = articleList[i]['container-title'][0];
    let doi = articleList[i]['DOI'];
    let authors = articleList[i]['author'];
    let citationCount = articleList[i]['is-referenced-by-count'];
    summary.push({ title, authors, year, journal, doi, citationCount });
  }
  summary.sort((a, b) => a.year - b.year);

  for (let a = 0; a < summary.length; a++) {
    year.push(summary[a]['year']);
    citationCount.push(summary[a]['citationCount']);
    text.push(summary[a]['title'].split(' ')[0]);
    article =
      '<li>' +
      summary[a]['authors'][0]['family'] +
      ', ' +
      summary[a]['authors'][0]['given'] +
      ', (' +
      summary[a]['year'] +
      ') <a href="http://doi.org/' +
      summary[a]['doi'] +
      '">' +
      summary[a]['title'] +
      '</a></li>';
    document.getElementById('articleList').innerHTML += article;
  }

  const trace1 = {
    x: year,
    y: citationCount,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Author Citations Over Time',
    text: text,
    line: {
      width: 1,
      color: '#990000',
    },
    marker: {
      size: 8,
      color: '#990000',
    },
  };

  const data = [trace1];

  Plotly.newPlot('myDiv', data);
}

// getAllArticles();
getArticleData('10.1080/15378020.2013.850374');
