const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let doi = urlParams.get('doi');
doi = encodeURIComponent(doi);

async function getArticleData(doi) {
  console.log(doi);
  try {
    const url = '/api/doi/' + doi;
    const data = await fetch(url).then((res) => res.json());
    let refdata = data['reference'];
    let nodes = [];
    for (let r = 0; r < refdata.length; r++) {
      let id = r + 1;
      nodes.push({ id: id, label: refdata[r]['doi'], shape: 'dot' });
    }
    nodes.push({ id: 0, label: data['title'], shape: 'dot' });
    // console.log(nodes, 'finalData');
    return refdata;
  } catch (error) {
    error.message;
  }
}

async function drawGraph(doi) {
  let refdata = await getArticleData(doi);
  let edgedata = [];
  for (let ref = 0; ref < refdata.length; ref++) {
    let id2 = ref + 1;
    edgedata.push({ from: 0, to: id2 });
  }

  console.log(edgedata);

  const container = document.getElementById('mynetwork');
  const nodes = new vis.DataSet(refdata);
  const edges = new vis.DataSet(edgedata);
  const data = { nodes, edges };

  const options = {
    configure: {
      enabled: true,
      filter: ['physics'],
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
drawGraph(doi);