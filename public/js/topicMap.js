const retrieveObject = localStorage.getItem('searchResults');
const searchResults = JSON.parse(retrieveObject);

async function getReferences(data) {
  const refdata = data['items'];
  let allArticles = [];
  for (let i = 0; i < 20; i++) {
    allArticles.push({
      DOI: refdata[i]['DOI'],
      label: refdata[i]['DOI'],
      title: refdata[i]['title'][0],
      author: refdata[i]['author'],
      'container-title': refdata[i]['container-title'],
      published: refdata[i]['published'],
      URL: refdata[i]['URL'],
      'references-count': refdata[i]['references-count'],
      'is-referenced-by-count': refdata[i]['is-referenced-by-count'],
      volume: refdata[i]['volume'],
      'references-count': refdata[i]['references-count'],
      url: 'https://doi.org/' + refdata[i]['DOI'],
      group: i,
    });
    if (refdata[i]['reference']) {
      for (let r = 0; r < refdata[i]['reference'].length; r++) {
        if (refdata[i]['reference'][r]['DOI']) {
          let next = refdata[i]['reference'][r];
          next['origin_DOI'] = refdata[i]['DOI'];
          if (refdata[i]['reference'][r]['article-title']) {
            next['title'] = refdata[i]['reference'][r]['article-title'];
          }
          next['label'] = refdata[i]['reference'][r]['DOI'];
          next['url'] = 'https://doi.org/' + refdata[i]['reference'][r]['DOI'];
          if (!next['group']) {
            next['group'] = i;
          }
          if (!refdata[i]['reference'][r]['article-title'] && refdata[i]['reference'][r]['unstructured']) {
            next['title'] = refdata[i]['reference'][r]['unstructured'];
          }
          allArticles.push(next);
        }
      }
    }
  }

  const cleanNodes = [
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
        allArticles[f]['id'] = cleanNodes[c]['id'];
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
  // console.log(allArticles, 'clean');
  return allArticles;
}

async function drawGraph(searchResults) {
  let refdata = await getReferences(searchResults);
  // console.log(refdata);
  let edgedata = [];
  for (let r = 0; r < refdata.length; r++) {
    if (refdata[r]['DOI'] && refdata[r]['reference_id']) {
      edgedata.push({ from: refdata[r]['id'], to: refdata[r]['reference_id'] });
    }
  }

  const cleanNodes = refdata.filter(
    (refdata, index, self) => index === self.findIndex((t) => t.save === refdata.save && t['id'] === refdata['id'])
  );

  // console.log(edgedata, 'cleanest');

  const container = document.getElementById('mynetwork');
  const nodes = new vis.DataSet(cleanNodes);
  const edges = new vis.DataSet(edgedata);
  const data = { nodes, edges };

  const options = {
    nodes: {
      shape: 'dot',
      scaling: {
        min: 5,
        max: 20,
      },
      size: 10,
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
        type: 'dynamic',
      },
    },
    interaction: {
      hideEdgesOnDrag: true,
      tooltipDelay: 200,
    },
    physics: {
      enabled: true,
      barnesHut: {
        theta: 1,
        gravitationalConstant: -2000,
        centralGravity: 0.5,
        springLength: 100,
        springConstant: 0.04,
        damping: 1,
        avoidOverlap: 0.5,
      },
      maxVelocity: 40,
      minVelocity: 0.5,
      solver: 'barnesHut',
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
  network.on('stabilizationProgress', function (params) {
    loader.classList.add('is-active');
  });
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
drawGraph(searchResults);
