const retrieveObject = localStorage.getItem('searchResults');
const searchResults = JSON.parse(retrieveObject);

async function getReferences(data) {
  let nodes = [];
  for (let i = 0; i < data['items'].length; i++) {
    let articleID = i + 1;
    if (data['items'][i]['reference']) {
      let refdata = data['items'][i]['reference'];
      for (let r = 0; r < refdata.length; r++) {
        if (refdata[r]['DOI']) {
          let refIdNum = `${articleID}${r}`;
          nodes.push({
            id: +refIdNum,
            reference_DOI: refdata[r]['DOI'],
            label: refdata[r]['DOI'],
            original_DOI: data['items'][i]['DOI'],
            original_id: articleID,
            shape: 'dot',
          });
        }
      }
      nodes.push({ id: articleID, original_DOI: data['items'][i]['DOI'], shape: 'dot' });
    }
  }
  return nodes;
}

async function drawGraph(searchResults) {
  let refdata = await getReferences(searchResults);
  //   console.log(refdata);
  let edgedata = [];
  for (let r = 0; r < refdata.length; r++) {
    if (refdata[r]['original_id']) {
      edgedata.push({ from: refdata[r]['original_id'], to: refdata[r]['id'] });
    }
  }

  const cleanNodes = refdata.filter(
    (refdata, index, self) => index === self.findIndex((t) => t.save === refdata.save && t.id === refdata.id)
  );

  const container = document.getElementById('mynetwork');
  const nodes = new vis.DataSet(cleanNodes);
  const edges = new vis.DataSet(edgedata);
  const data = { nodes, edges };

  const options = {
    configure: {
      enabled: false,
      filter: ['physics'],
    },
    layout: {
      improvedLayout: false,
    },
    edges: {
      color: {
        inherit: true,
      },
      smooth: {
        enabled: true,
        type: 'dynamic',
      },
    },
    interaction: {
      dragNodes: true,
      hideEdgesOnDrag: false,
      hideNodesOnDrag: false,
    },
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        fit: true,
        iterations: 1000,
        onlyDynamicEdges: false,
        updateInterval: 50,
      },
    },
  };
  network = new vis.Network(container, data, options);
  return network;
}
// getArticleData(doi);
drawGraph(searchResults);
