var network = null;
var articleMetadata = new Map();
var currentGraph = null;
var filterSharedOnly = false;

var form = document.getElementById('doi-form');
var doiInput = document.getElementById('doi-input');
var emailInput = document.getElementById('email-input');
var clearButton = document.getElementById('clear-button');
var sharedOnlyButton = document.getElementById('shared-only-button');
var statusBox = document.getElementById('status');
var citationList = document.getElementById('citation-list');
var networkContainer = document.getElementById('network');

var SAMPLE_PLACEHOLDER = '10.1038/nature12373\n10.1126/science.169.3946.635';
var CROSSREF_MAX_REQUESTS_PER_SECOND = 5;
var CROSSREF_REQUEST_INTERVAL_MS = 1000 / CROSSREF_MAX_REQUESTS_PER_SECOND;

form.addEventListener('submit', function (event) {
  event.preventDefault();
  buildNetwork();
});

clearButton.addEventListener('click', function () {
  doiInput.value = '';
  emailInput.value = '';
  articleMetadata.clear();
  currentGraph = null;
  filterSharedOnly = false;
  updateSharedOnlyButton();
  renderCitationList(null);
  if (network) {
    network.destroy();
    network = null;
  }
  setStatus('Enter one or more DOIs to build a citation network.');
  doiInput.focus();
});

sharedOnlyButton.addEventListener('click', function () {
  if (!currentGraph) {
    return;
  }

  filterSharedOnly = !filterSharedOnly;
  updateSharedOnlyButton();
  renderCurrentGraph();
});

function parseDoiInput(value) {
  var candidates = value
    .replace(
      /,\s*(?=(?:https?:\/\/api\.crossref\.org\/works\/(?:doi\/)?|https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?10\.)/gi,
      ' ',
    )
    .split(/\s+/);
  var seen = new Set();
  return candidates.map(normalizeDoi).filter(function (doi) {
    if (!doi || seen.has(doi)) {
      return false;
    }
    seen.add(doi);
    return true;
  });
}

function normalizeDoi(value) {
  if (!value) {
    return '';
  }

  var doi = value.trim();
  doi = doi.replace(/^https?:\/\/api\.crossref\.org\/works\/(?:doi\/)?/i, '');
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  doi = doi.replace(/^doi:\s*/i, '');
  doi = decodeDoiInput(doi);
  doi = doi.replace(/[.,\]]+$/g, '');

  var match = doi.match(/10\.\d{4,9}\/\S+/i);
  return match ? match[0].toLowerCase() : '';
}

function decodeDoiInput(doi) {
  try {
    return decodeURIComponent(doi);
  } catch (error) {
    return doi;
  }
}

function fetchCrossrefWork(doi, email) {
  var endpoint = 'https://api.crossref.org/works/' + encodeDoiForCrossrefPath(doi);
  var params = new URLSearchParams();

  if (email) {
    params.set('mailto', email);
  }

  var url = params.toString() ? endpoint + '?' + params.toString() : endpoint;

  return fetch(url)
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Crossref could not fetch ' + doi + ' (' + response.status + ').');
      }

      return response.json();
    })
    .then(function (payload) {
      if (!payload.message) {
        throw new Error('Crossref returned no article metadata for ' + doi + '.');
      }

      return payload.message;
    });
}

function encodeDoiForCrossrefPath(doi) {
  var slashIndex = doi.indexOf('/');

  if (slashIndex === -1) {
    return encodeURIComponent(doi);
  }

  return encodeURIComponent(doi.slice(0, slashIndex)) + '/' + encodeURIComponent(doi.slice(slashIndex + 1));
}

function fetchCrossrefWorksWithRateLimit(dois, email, onProgress) {
  var results = [];
  var chain = Promise.resolve();

  dois.forEach(function (doi, index) {
    chain = chain
      .then(function () {
        if (index > 0) {
          return wait(CROSSREF_REQUEST_INTERVAL_MS);
        }

        return null;
      })
      .then(function () {
        if (onProgress) {
          onProgress(index + 1, dois.length, doi);
        }

        return fetchCrossrefWork(doi, email)
          .then(function (value) {
            results[index] = {
              status: 'fulfilled',
              value: value,
            };
          })
          .catch(function (reason) {
            results[index] = {
              status: 'rejected',
              reason: reason,
            };
          });
      });
  });

  return chain.then(function () {
    return results;
  });
}

function wait(milliseconds) {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

function buildArticleRecord(article) {
  var doi = normalizeDoi(article.DOI);

  return {
    DOI: doi,
    label: doi,
    title: firstValue(article.title),
    author: article.author || [],
    reference: article.reference || [],
    'container-title': article['container-title'] || [],
    published: article.published || article['published-print'] || article['published-online'] || null,
    URL: article.URL || '',
    'references-count': article['references-count'] || 0,
    'is-referenced-by-count': article['is-referenced-by-count'] || 0,
    volume: article.volume || '',
    url: doi ? 'https://doi.org/' + doi : '',
    ref_count: article['is-referenced-by-count'] || 0,
  };
}

function articleToNode(article, groupNumber) {
  var doi = normalizeDoi(article.DOI);
  var record = articleMetadata.get(doi) || buildArticleRecord(article);

  articleMetadata.set(doi, record);

  return {
    id: doi,
    label: '<b>' + abbreviateTitle(record['title']) || doi + '</b>',
    title: record['title'] || doi,
    group: groupNumber,
    isPrimary: true,
    size: 16,
    url: record.url,
  };
}

function referencesToEdges(article, inputDoiSet) {
  var sourceDoi = normalizeDoi(article.DOI);
  var references = article.reference || [];
  var edges = [];

  references.forEach(function (reference) {
    var targetDoi = normalizeDoi(reference.DOI);

    if (!targetDoi || targetDoi === sourceDoi) {
      return;
    }

    edges.push({
      id: sourceDoi + '->' + targetDoi,
      from: sourceDoi,
      to: targetDoi,
      title: abbreviateTitle(reference['article-title'] || targetDoi),
      arrows: 'to',
      reference: reference,
    });
  });

  return edges;
}

function renderNetwork(nodes, edges) {
  if (!window.vis || !vis.Network || !vis.DataSet) {
    setStatus('VIS Network did not load. Check your internet connection and refresh the page.', true);
    return;
  }

  var data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges),
  };

  console.log(nodes, edges);

  var options = {
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
        multi: true,
        mono: {
          color: '#343434',
          size: 10, // px
          face: 'Roboto Mono, monospace',
          vadjust: 2,
          mod: '',
        },
      },
      widthConstraint: 150,
    },
    physics: {
      // enabled: false,
      forceAtlas2Based: {
        springLength: 100,
      },
      minVelocity: 0.75,
      solver: 'forceAtlas2Based',
    },
    interaction: {
      hideEdgesOnDrag: true,
      tooltipDelay: 200,
    },
    layout: {
      improvedLayout: false,
      randomSeed: 30,
    },
    edges: {
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.7,
        },
      },
      color: {
        inherit: true,
        opacity: 0.7,
      },
      width: 0.5,
      smooth: {
        // enabled: true,
        type: 'horizontal',
        forceDirection: 'none',
      },
    },
  };

  if (network) {
    network.destroy();
  }

  network = new vis.Network(networkContainer, data, options);
  network.on('stabilizationIterationsDone', function () {
    network.setOptions({ physics: false });
  });
  network.on('click', function (params) {
    var ids = params.nodes;

    if (ids.length > 0) {
      var clickedNodes = data.nodes.get(ids);
      if (clickedNodes[0] && clickedNodes[0].url) {
        window.open(clickedNodes[0].url, '_blank', 'noopener');
      }
    }
  });
  network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
}

function renderCurrentGraph() {
  if (!currentGraph) {
    return;
  }

  var graph = prepareGraphView(currentGraph.nodes, currentGraph.edges, filterSharedOnly);
  renderNetwork(graph.nodes, graph.edges);

  var status =
    'Rendered ' +
    graph.nodes.length +
    ' node' +
    plural(graph.nodes.length) +
    ' and ' +
    graph.edges.length +
    ' directed edge' +
    plural(graph.edges.length) +
    '.';

  if (filterSharedOnly) {
    status += ' Showing shared references and primary article links.';
  }

  setStatus(status);
}

function prepareGraphView(nodes, edges, sharedOnly) {
  var citationCounts = countIncomingCitations(edges);
  var visibleNodeIds = new Set();
  var preparedNodes = nodes.map(function (node) {
    var citationCount = citationCounts.get(node.id) || 0;
    var isSharedReference = !node.isPrimary && citationCount > 1;
    var nextNode = Object.assign({}, node, {
      citationCount: citationCount,
      borderWidth: isSharedReference ? 3 : 1,
      size: isSharedReference ? Math.max(node.size || 8, 14) : node.size,
      title: isSharedReference ? node.title + ' Cited by ' + citationCount + ' papers' : node.title,
    });

    if (!sharedOnly || node.isPrimary || citationCount > 1) {
      visibleNodeIds.add(node.id);
      return nextNode;
    }

    return null;
  });

  preparedNodes = preparedNodes.filter(Boolean);

  var preparedEdges = edges
    .filter(function (edge) {
      return visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to);
    })
    .map(function (edge) {
      var targetCitationCount = citationCounts.get(edge.to) || 0;
      return Object.assign({}, edge, {
        width: targetCitationCount > 1 ? 1.5 : edge.width,
      });
    });

  return {
    nodes: preparedNodes,
    edges: preparedEdges,
  };
}

function countIncomingCitations(edges) {
  var sourceByTarget = new Map();

  edges.forEach(function (edge) {
    if (!sourceByTarget.has(edge.to)) {
      sourceByTarget.set(edge.to, new Set());
    }

    sourceByTarget.get(edge.to).add(edge.from);
  });

  var counts = new Map();
  sourceByTarget.forEach(function (sources, target) {
    counts.set(target, sources.size);
  });

  return counts;
}

function renderCitationList(graph) {
  citationList.replaceChildren();

  if (!graph || !graph.edges.length) {
    citationList.classList.remove('is-visible');
    return;
  }

  var citationCounts = countIncomingCitations(graph.edges);
  var nodesById = new Map();
  graph.nodes.forEach(function (node) {
    nodesById.set(node.id, node);
  });

  var rankedArticles = Array.from(citationCounts.entries())
    .map(function (entry) {
      var doi = entry[0];
      var count = entry[1];
      var node = nodesById.get(doi);

      return {
        doi: doi,
        count: count,
        title: node ? node.title : doi,
      };
    })
    .sort(function (a, b) {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.doi.localeCompare(b.doi);
    })
    .filter(function (entry) {
      return entry.count > 1;
    });

  if (!rankedArticles.length) {
    citationList.classList.remove('is-visible');
    return;
  }

  var heading = document.createElement('h2');
  heading.textContent = 'Most cited articles';

  var list = document.createElement('ol');
  rankedArticles.forEach(function (article) {
    var item = document.createElement('li');
    var link = document.createElement('a');
    var count = document.createElement('span');

    link.href = 'https://doi.org/' + article.doi;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = article.doi;
    link.title = article.title;

    count.className = 'citation-count';
    count.textContent = ' - ' + article.count + ' citation' + plural(article.count);

    item.append(link, count);
    list.append(item);
  });

  citationList.append(heading, list);
  citationList.classList.add('is-visible');
}

function buildNetwork() {
  var inputDois = parseDoiInput(doiInput.value);
  var email = emailInput.value.trim();

  if (!inputDois.length) {
    setStatus('Please enter at least one valid DOI. Example: ' + SAMPLE_PLACEHOLDER.split('\n')[0], true);
    return;
  }

  setLoading(true);
  setStatus(
    'Fetching metadata for ' +
      inputDois.length +
      ' DOI' +
      plural(inputDois.length) +
      ' from Crossref at max ' +
      CROSSREF_MAX_REQUESTS_PER_SECOND +
      ' requests per second...',
  );

  fetchCrossrefWorksWithRateLimit(inputDois, email, function (current, total, doi) {
    setStatus(
      'Fetching DOI ' +
        current +
        ' of ' +
        total +
        ' from Crossref at max ' +
        CROSSREF_MAX_REQUESTS_PER_SECOND +
        ' requests per second: ' +
        doi,
    );
  })
    .then(function (results) {
      var fetchedArticles = [];
      var failures = [];

      results.forEach(function (result, index) {
        if (result.status === 'fulfilled') {
          fetchedArticles.push(result.value);
        } else {
          failures.push(inputDois[index] + ': ' + result.reason.message);
        }
      });

      if (!fetchedArticles.length) {
        throw new Error('No DOI metadata could be fetched. ' + failures.join(' '));
      }

      var inputDoiSet = new Set(inputDois);
      var inputGroupMap = new Map();
      var nodeMap = new Map();
      var edgeMap = new Map();

      inputDois.forEach(function (doi, index) {
        inputGroupMap.set(doi, index + 1);
      });

      fetchedArticles.forEach(function (article) {
        var sourceDoi = normalizeDoi(article.DOI);
        var sourceGroup = inputGroupMap.get(sourceDoi) || 1;

        if (!sourceDoi) {
          return;
        }

        nodeMap.set(sourceDoi, articleToNode(article, sourceGroup));

        referencesToEdges(article, inputDoiSet).forEach(function (edge) {
          edgeMap.set(edge.id, edge);

          if (!nodeMap.has(edge.to)) {
            var referenceTitle = edge.reference['article-title'] || edge.to;
            nodeMap.set(edge.to, {
              id: edge.to,
              // label: '<code>' + edge.to + '</code>',
              title: referenceTitle,
              group: inputGroupMap.get(edge.to) || sourceGroup,
              isPrimary: inputDoiSet.has(edge.to),
              size: 8,
              url: 'https://doi.org/' + edge.to,
            });
          }
        });
      });

      currentGraph = {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
      };
      filterSharedOnly = false;
      updateSharedOnlyButton();
      renderCitationList(currentGraph);
      renderCurrentGraph();

      var status =
        'Rendered ' +
        nodeMap.size +
        ' node' +
        plural(nodeMap.size) +
        ' and ' +
        edgeMap.size +
        ' directed edge' +
        plural(edgeMap.size) +
        '.';
      if (failures.length) {
        status += ' Some DOI requests failed: ' + failures.join(' ');
      }
      setStatus(status, failures.length > 0);
    })
    .catch(function (error) {
      setStatus(error.message, true);
    })
    .finally(function () {
      setLoading(false);
    });
}

function abbreviateTitle(value) {
  var text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= 25) {
    return text;
  }

  return text.split(' ').slice(0, 5).join(' ');
}

function firstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';
}

function setStatus(message, isError) {
  statusBox.textContent = message;
  statusBox.classList.toggle('error', Boolean(isError));
}

function setLoading(isLoading) {
  var submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  clearButton.disabled = isLoading;
  sharedOnlyButton.disabled = isLoading || !currentGraph;
  submitButton.textContent = isLoading ? 'Fetching...' : 'Fetch Graph';
}

function updateSharedOnlyButton() {
  sharedOnlyButton.disabled = !currentGraph;
  sharedOnlyButton.classList.toggle('is-active', filterSharedOnly);
  sharedOnlyButton.textContent = filterSharedOnly ? 'Show all refs' : 'Shared refs';
}

function plural(count) {
  return count === 1 ? '' : 's';
}
