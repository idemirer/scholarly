const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let topic = encodeURIComponent(urlParams.get('topic'));

async function searchResults(topic) {
  try {
    const url = '/api/topic/' + topic;
    const data = await fetch(url).then((res) => res.json());
    localStorage.setItem('searchResults', JSON.stringify(data));
    return data;
  } catch (error) {
    error.message;
  }
}

async function listArticles(topic) {
  const loader = document.getElementById('loader-wrapper');
  const link = document.getElementById('topicMapLink');
  loader.classList.add('is-active');
  const data = await searchResults(topic);
  const articleList = document.getElementById('articleList');
  let htmlContent = '';
  for (let a = 0; a < data['items'].length; a++) {
    let author = 'NA';
    if (data['items'][a]['author']) {
      author = data['items'][a]['author'][0]['family'];
    }
    htmlContent += `<li>${author}, (${data['items'][a]['published']['date-parts'][0][0]}), ${data['items'][a]['title']} - <a href="https://doi.org/${data['items'][a]['DOI']}">DOI</a></li>`;
  }
  articleList.innerHTML = htmlContent;
  loader.classList.remove('is-active');
  link.style.display = 'block';
}

listArticles(topic);
