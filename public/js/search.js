document.getElementById('searchForm').addEventListener('submit', function (event) {
  event.preventDefault();
  listArticles();
});

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

async function listArticles() {
  let htmlContent = '';
  const articleList = document.getElementById('articleList');
  articleList.innerHTML = htmlContent;
  const topic = document.getElementById('searchTerm').value;
  const loader = document.getElementById('loader-wrapper');
  const link = document.getElementById('topicMapLink');
  const selectAll = document.getElementById('selectAll');
  loader.classList.add('is-active');
  link.style.display = 'none';
  selectAll.style.display = 'none';
  const data = await searchResults(topic);
  for (let a = 0; a < data['items'].length; a++) {
    let author = 'NA';
    if (data['items'][a]['author']) {
      author = data['items'][a]['author'][0]['family'];
    }
    const inputId = a;
    htmlContent += `<li><div class="field">
    <div class="control">
      <label class="checkbox">
        <input type="checkbox" id="${inputId}">&nbsp;&nbsp;${author}, (${data['items'][a]['published']['date-parts'][0][0]}), ${data['items'][a]['title']} - <a href="https://doi.org/${data['items'][a]['DOI']}" target="_blank">DOI</a></label>
        </div>
      </div></li>`;
  }
  articleList.innerHTML = htmlContent;
  loader.classList.remove('is-active');
  link.style.display = 'block';
  selectAll.style.display = 'block';
}
