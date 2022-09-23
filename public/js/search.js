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
    htmlContent += `<li>${data['items'][a]['title']}</li>`;
  }
  articleList.innerHTML = htmlContent;
  loader.classList.remove('is-active');
  link.style.display = 'block';
}

listArticles(topic);
