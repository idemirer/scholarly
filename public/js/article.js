const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let doi = encodeURIComponent(urlParams.get('doi'));

async function getArticleData(doi) {
  const loader = document.getElementById('loader-wrapper');
  loader.classList.add('is-active');

  try {
    const url = '/api/doi/' + doi;
    const refdata = await fetch(url).then((res) => res.json());

    let allArticles = [];
    allArticles.push({
      DOI: refdata['DOI'],
      label: refdata['DOI'],
      title: refdata['title'][0],
      author: refdata['author'],
      'container-title': refdata['container-title'],
      published: refdata['published'],
      url: 'https://doi.org/' + refdata['DOI'],
      'references-count': refdata['references-count'],
      'is-referenced-by-count': refdata['is-referenced-by-count'],
      volume: refdata['volume'],
      'references-count': refdata['references-count'],
    });

    if (refdata['reference']) {
      for (let r = 0; r < refdata['reference'].length; r++) {
        if (refdata['reference'][r]['DOI']) {
          let next = refdata['reference'][r];
          next['origin_DOI'] = refdata['DOI'];
          next['label'] = refdata['reference'][r]['unstructured'];
          next['url'] = 'https://doi.org/' + refdata['reference'][r]['DOI'];
          if (refdata['reference'][r]['DOI']) {
            next['label'] = refdata['reference'][r]['DOI'];
          }
          if (refdata['reference'][r]['article-title']) {
            next['title'] = refdata['reference'][r]['article-title'];
          }
          if (!refdata['reference'][r]['article-title'] && refdata['reference'][r]['unstructured']) {
            next['title'] = refdata['reference'][r]['unstructured'];
          }

          allArticles.push(next);
        }
      }
    }
    let cleanNodes = [
      ...allArticles.filter(
        (allArticles, index, self) =>
          index === self.findIndex((t) => t.save === allArticles.save && t.DOI === allArticles.DOI)
      ),
    ];

    for (let c = 0; c < cleanNodes.length; c++) {
      cleanNodes[c]['id'] = c + 1;
    }

    for (let f = 0; f < allArticles.length; f++) {
      for (let c = 0; c < cleanNodes.length; c++) {
        if (allArticles[f]['DOI'] == cleanNodes[c]['DOI']) {
          allArticles[f]['original_id'] = cleanNodes[c]['id'];
        }
        if (allArticles[f]['origin_DOI']) {
          if (allArticles[f]['origin_DOI'] == cleanNodes[c]['DOI']) {
            allArticles[f]['reference_id'] = cleanNodes[c]['id'];
          }
        }
        if (!allArticles[f]['reference_id'] && allArticles[f]['DOI'] == cleanNodes[c]['DOI']) {
        }
      }
    }
    // console.log(allArticles, 'finished');
    return allArticles;
  } catch (error) {
    error.message;
  }
}

async function drawGraph(doi) {
  let refdata = await getArticleData(doi);

  let edgedata = [];
  for (let r = 0; r < refdata.length; r++) {
    if (refdata[r]['DOI'] && refdata[r]['reference_id']) {
      edgedata.push({ from: refdata[r]['original_id'], to: refdata[r]['reference_id'] });
    }
  }
  console.log(edgedata);
  const container = document.getElementById('mynetwork');
  const nodes = new vis.DataSet(refdata);
  const edges = new vis.DataSet(edgedata);
  const data = { nodes, edges };

  const options = {
    nodes: {
      shape: 'dot',
      scaling: {
        min: 5,
        max: 20,
      },
      font: {
        size: 16,
        face: 'Roboto Condensed',
      },
    },
    autoResize: true,
    height: '100%',
    width: '100%',
    configure: {
      enabled: false,
      filter: ['physics'],
    },
    layout: {
      improvedLayout: true,
      randomSeed: 30,
    },
    edges: {
      color: {
        inherit: true,
      },
      width: 0.5,
      smooth: {
        enabled: true,
        type: 'continuous',
      },
    },
    interaction: {
      hideEdgesOnDrag: true,
      tooltipDelay: 200,
    },
    physics: {
      enabled: true,
      forceAtlas2Based: {
        gravitationalConstant: -200,
        centralGravity: 0.1,
        springLength: 100,
        springConstant: 0.05,
        avoidOverlap: 0.1,
      },
      maxVelocity: 40,
      minVelocity: 0.5,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      wind: { x: 0, y: 0 },
      stabilization: {
        enabled: true,
        iterations: 500,
        // updateInterval: 25,
      },
    },
  };
  const loader = document.getElementById('loader-wrapper');

  network = new vis.Network(container, data, options);
  network.once('stabilizationIterationsDone', function () {
    loader.classList.remove('is-active');
  });
  network.on('click', function (params) {
    const ids = params.nodes;
    if (ids.length > 0) {
      const clickedNodes = nodes.get(ids);
      window.open(clickedNodes[0]['url']);
    }
  });

  return network;
}
// getArticleData(doi);
drawGraph(doi);
