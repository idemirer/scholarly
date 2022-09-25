const retrieveObject = localStorage.getItem('searchResults');
const searchResults = JSON.parse(retrieveObject);

async function getReferences(data) {
  const refdata = data['items'];
  let allArticles = [];
  for (let i = 0; i < refdata.length; i++) {
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
      group: i,
    });
    if (refdata[i]['reference']) {
      for (let r = 0; r < refdata[i]['reference'].length; r++) {
        let next = refdata[i]['reference'][r];
        next['original_DOI'] = refdata[i]['DOI'];
        next['label'] = refdata[i]['DOI'];
        if (!next['group']) {
          next['group'] = i;
        }
        if (refdata[i]['reference'][r]['article-title']) {
          next['title'] = refdata[i]['reference'][r]['article-title'];
        }
        allArticles.push(next);
      }
    }
  }

  let cleanNodes = [];
  cleanNodes.push(
    allArticles.filter(
      (allArticles, index, self) =>
        index === self.findIndex((t) => t.save === allArticles.save && t.DOI === allArticles.DOI)
    )
  );

  for (let c = 0; c < cleanNodes[0].length; c++) {
    cleanNodes[0][c]['id'] = c + 1;
  }

  // console.log(cleanNodes[0]);

  for (let f = 0; f < allArticles.length; f++) {
    for (let c = 0; c < cleanNodes[0].length; c++) {
      if (allArticles[f]['DOI'] == cleanNodes[0][c]['DOI']) {
        allArticles[f]['original_id'] = cleanNodes[0][c]['id'];
      }
      if (allArticles[f]['original_DOI']) {
        if (allArticles[f]['original_DOI'] == cleanNodes[0][c]['DOI']) {
          allArticles[f]['reference_id'] = cleanNodes[0][c]['id'];
        }
      }
      if (!allArticles[f]['reference_id'] && allArticles[f]['DOI'] == cleanNodes[0][c]['DOI']) {
      }
    }
  }
  // console.log(allArticles);
  return allArticles;
}

async function drawGraph(searchResults) {
  let refdata = await getReferences(searchResults);
  // console.log(refdata);
  let edgedata = [];
  for (let r = 0; r < refdata.length; r++) {
    if (refdata[r]['DOI'] && refdata[r]['reference_id']) {
      edgedata.push({ from: refdata[r]['original_id'], to: refdata[r]['reference_id'] });
    }
  }

  const cleanNodes = refdata.filter(
    (refdata, index, self) => index === self.findIndex((t) => t.save === refdata.save && t.id === refdata.id)
  );

  // console.log(cleanNodes);

  const container = document.getElementById('mynetwork');
  const nodes = new vis.DataSet(cleanNodes);
  const edges = new vis.DataSet(edgedata);
  const data = { nodes, edges };

  const options = {
    nodes: {
      shape: 'dot',
      scaling: {
        min: 5,
        max: 30,
      },
      font: {
        size: 12,
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
      width: 0.15,
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
        gravitationalConstant: -26,
        centralGravity: 0.005,
        springLength: 230,
        springConstant: 0.18,
      },
      maxVelocity: 146,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      stabilization: {
        enabled: true,
        iterations: 500,
        updateInterval: 25,
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

  return network;
}
// getArticleData(doi);
drawGraph(searchResults);
