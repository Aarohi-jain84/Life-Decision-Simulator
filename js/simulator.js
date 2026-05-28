/* ============================================
   LIFE DECISION SIMULATOR - Core Engine
   ============================================ */

(function() {
  'use strict';

  // --- State ---
  var state = {
    options: [],
    factors: [],
    weights: {},
    ratings: {}
  };

  // --- Templates ---
  var TEMPLATES = {
    'career': {
      name: 'Career Choice',
      options: ['Software Engineer', 'Product Manager', 'Freelance Consultant'],
      factors: ['Salary', 'Growth Potential', 'Work-Life Balance', 'Job Security', 'Passion']
    },
    'college': {
      name: 'College Selection',
      options: ['University A', 'University B', 'University C'],
      factors: ['Tuition Cost', 'Academic Reputation', 'Location', 'Campus Life', 'Career Outcomes']
    },
    'business': {
      name: 'Business Idea',
      options: ['SaaS Product', 'Consulting Agency', 'E-commerce Store'],
      factors: ['Startup Cost', 'Market Size', 'Profit Potential', 'Time to Revenue', 'Scalability']
    },
    'investment': {
      name: 'Investment Comparison',
      options: ['Stocks', 'Real Estate', 'Bonds'],
      factors: ['Risk Level', 'Expected Return', 'Liquidity', 'Time Horizon', 'Diversification']
    }
  };

  // --- Persistence ---
  function saveState() {
    try {
      localStorage.setItem('lds-simulator-state', JSON.stringify({
        options: state.options,
        factors: state.factors,
        weights: state.weights,
        ratings: state.ratings
      }));
    } catch(e) {}
  }

  function loadState() {
    try {
      var saved = localStorage.getItem('lds-simulator-state');
      if (saved) {
        var data = JSON.parse(saved);
        if (data && data.options) state.options = data.options;
        if (data && data.factors) state.factors = data.factors;
        if (data && data.weights) state.weights = data.weights;
        if (data && data.ratings) state.ratings = data.ratings;
        return data && data.options && data.options.length > 0;
      }
    } catch(e) {}
    return false;
  }

  function clearState() {
    localStorage.removeItem('lds-simulator-state');
    state.options = [];
    state.factors = [];
    state.weights = {};
    state.ratings = {};
  }

  // --- Initialize ---
  function init() {
    state.options = [];
    state.factors = [];
    state.weights = {};
    state.ratings = {};

    var restored = loadState();
    loadFromURL();
    renderOptions();
    renderFactors();
    renderWeights();
    renderMatrix();
    renderResults();
    bindEvents();
    bindTemplateButtons();
    bindClearButton();
    if (restored && state.options.length > 0 && window.LDS && window.LDS.showToast) {
      setTimeout(function() {
        window.LDS.showToast('Restored previous session. Continue where you left off!', 'info');
      }, 500);
    }
  }

  // --- Load from URL params (for loading saved decisions) ---
  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var loadId = params.get('load');
    if (loadId && window.LDS && window.LDS.storage) {
      var decision = window.LDS.storage.getDecision(loadId);
      if (decision) {
        state.options = decision.options || [];
        state.factors = decision.factors || [];
        state.weights = decision.weights || {};
        state.ratings = decision.ratings || {};
      }
    }
  }

  // --- Template Buttons ---
  function bindTemplateButtons() {
    document.querySelectorAll('.template-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var templateKey = this.dataset.template;
        var template = TEMPLATES[templateKey];
        if (!template) return;

        state.options = template.options.slice();
        state.factors = template.factors.slice();

        // Reset weights and ratings
        state.weights = {};
        state.ratings = {};
        state.factors.forEach(function(f) {
          state.weights[f] = 5;
        });

        renderOptions();
        renderFactors();
        renderWeights();
        renderMatrix();
        renderResults();
        saveState();
      });
    });
  }

  // --- Options ---
  function addOption(name) {
    if (!name || !name.trim()) return false;
    if (state.options.indexOf(name.trim()) !== -1) return false;
    state.options.push(name.trim());
    renderOptions();
    renderMatrix();
    renderResults();
    saveState();
    return true;
  }

  function removeOption(name) {
    var idx = state.options.indexOf(name);
    if (idx === -1) return;
    state.options.splice(idx, 1);
    // Clean up ratings
    delete state.ratings[name];
    renderOptions();
    renderMatrix();
    renderResults();
    saveState();
  }

  function editOption(oldName, newName) {
    if (!newName || !newName.trim()) return false;
    var idx = state.options.indexOf(oldName);
    if (idx === -1) return false;
    if (oldName !== newName && state.options.indexOf(newName.trim()) !== -1) return false;

    // Transfer ratings
    state.ratings[newName.trim()] = state.ratings[oldName] || {};
    if (oldName !== newName.trim()) {
      delete state.ratings[oldName];
    }

    state.options[idx] = newName.trim();
    renderOptions();
    renderMatrix();
    renderResults();
    saveState();
    return true;
  }

  function renderOptions() {
    var list = document.getElementById('options-list');
    if (!list) return;

    var countEl = document.getElementById('options-count');
    if (countEl) countEl.textContent = state.options.length + ' option' + (state.options.length !== 1 ? 's' : '');

    list.innerHTML = '';
    state.options.forEach(function(opt) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="item-name">' + escapeHtml(opt) + '</span>' +
        '<div class="item-actions">' +
          '<button class="edit-btn" data-name="' + escapeAttr(opt) + '" aria-label="Edit option">' +
            '<i class="fas fa-pen"></i>' +
          '</button>' +
          '<button class="delete-btn" data-name="' + escapeAttr(opt) + '" aria-label="Remove option">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>';
      list.appendChild(li);
    });

    // Bind delete
    list.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeOption(this.dataset.name);
      });
    });

    // Bind edit
    list.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var oldName = this.dataset.name;
        var newName = prompt('Edit option name:', oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
          editOption(oldName, newName.trim());
        }
      });
    });
  }

  // --- Factors ---
  function addFactor(name) {
    if (!name || !name.trim()) return false;
    if (state.factors.indexOf(name.trim()) !== -1) return false;
    state.factors.push(name.trim());
    state.weights[name.trim()] = 5;
    // Initialize ratings for all options
    state.options.forEach(function(opt) {
      if (!state.ratings[opt]) state.ratings[opt] = {};
      state.ratings[opt][name.trim()] = 5;
    });
    renderFactors();
    renderWeights();
    renderMatrix();
    renderResults();
    saveState();
    return true;
  }

  function removeFactor(name) {
    var idx = state.factors.indexOf(name);
    if (idx === -1) return;
    state.factors.splice(idx, 1);
    delete state.weights[name];
    state.options.forEach(function(opt) {
      if (state.ratings[opt]) delete state.ratings[opt][name];
    });
    renderFactors();
    renderWeights();
    renderMatrix();
    renderResults();
    saveState();
  }

  function editFactor(oldName, newName) {
    if (!newName || !newName.trim()) return false;
    var idx = state.factors.indexOf(oldName);
    if (idx === -1) return false;
    if (oldName !== newName && state.factors.indexOf(newName.trim()) !== -1) return false;

    state.weights[newName.trim()] = state.weights[oldName] || 5;
    delete state.weights[oldName];

    state.options.forEach(function(opt) {
      if (state.ratings[opt]) {
        state.ratings[opt][newName.trim()] = state.ratings[opt][oldName] || 5;
        delete state.ratings[opt][oldName];
      }
    });

    state.factors[idx] = newName.trim();
    renderFactors();
    renderWeights();
    renderMatrix();
    renderResults();
    saveState();
    return true;
  }

  function renderFactors() {
    var list = document.getElementById('factors-list');
    if (!list) return;

    var countEl = document.getElementById('factors-count');
    if (countEl) countEl.textContent = state.factors.length + ' factor' + (state.factors.length !== 1 ? 's' : '');

    list.innerHTML = '';
    state.factors.forEach(function(f) {
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="item-name">' + escapeHtml(f) + '</span>' +
        '<div class="item-actions">' +
          '<button class="edit-btn" data-name="' + escapeAttr(f) + '" aria-label="Edit factor">' +
            '<i class="fas fa-pen"></i>' +
          '</button>' +
          '<button class="delete-btn" data-name="' + escapeAttr(f) + '" aria-label="Remove factor">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>';
      list.appendChild(li);
    });

    list.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeFactor(this.dataset.name);
      });
    });

    list.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var oldName = this.dataset.name;
        var newName = prompt('Edit factor name:', oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
          editFactor(oldName, newName.trim());
        }
      });
    });
  }

  // --- Weights ---
  function setWeight(factor, value) {
    state.weights[factor] = parseInt(value, 10) || 1;
    renderResults();
    saveState();
  }

  function renderWeights() {
    var container = document.getElementById('weights-container');
    if (!container) return;
    container.innerHTML = '';
    state.factors.forEach(function(f) {
      var val = state.weights[f] || 5;
      var div = document.createElement('div');
      div.className = 'weight-item';
      div.innerHTML =
        '<label for="weight-' + escapeAttr(f) + '">' +
          '<span>' + escapeHtml(f) + '</span>' +
          '<span class="weight-value" id="weight-val-' + escapeAttr(f) + '">' + val + '</span>' +
        '</label>' +
        '<input type="range" id="weight-' + escapeAttr(f) + '" min="1" max="10" value="' + val + '" aria-label="Weight for ' + escapeAttr(f) + '">';
      container.appendChild(div);

      var input = div.querySelector('input');
      var valueDisplay = div.querySelector('.weight-value');
      input.addEventListener('input', function() {
        var v = this.value;
        valueDisplay.textContent = v;
        setWeight(f, v);
      });
    });
  }

  // --- Scoring Matrix ---
  function setRating(option, factor, value) {
    if (!state.ratings[option]) state.ratings[option] = {};
    state.ratings[option][factor] = parseInt(value, 10) || 1;
    renderResults();
    saveState();
  }

  function renderMatrix() {
    var wrapper = document.getElementById('matrix-wrapper');
    if (!wrapper) return;
    if (state.options.length === 0 || state.factors.length === 0) {
      wrapper.innerHTML = '<p style="color: var(--dark-3); text-align: center; padding: 2rem;">Add options and factors to see the comparison matrix.</p>';
      return;
    }
    var html = '<table class="matrix-table"><thead><tr><th>Factors</th>';
    state.options.forEach(function(opt) {
      html += '<th>' + escapeHtml(opt) + '</th>';
    });
    html += '</tr></thead><tbody>';
    state.factors.forEach(function(f) {
      html += '<tr><td>' + escapeHtml(f) + '</td>';
      state.options.forEach(function(opt) {
        var val = (state.ratings[opt] && state.ratings[opt][f]) || 5;
        html += '<td><input type="number" min="1" max="10" value="' + val + '" ' +
                'data-option="' + escapeAttr(opt) + '" data-factor="' + escapeAttr(f) + '" ' +
                'aria-label="Rating for ' + escapeAttr(opt) + ' on ' + escapeAttr(f) + '"></td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrapper.innerHTML = html;

    wrapper.querySelectorAll('input[type="number"]').forEach(function(input) {
      input.addEventListener('input', function() {
        var v = Math.min(10, Math.max(1, parseInt(this.value, 10) || 1));
        this.value = v;
        setRating(this.dataset.option, this.dataset.factor, v);
      });
    });
  }

  // --- Calculation Engine ---
  function calculateResults() {
    if (state.options.length === 0 || state.factors.length === 0) {
      return { scores: {}, ranked: [], best: null, worst: null, totalWeight: 0 };
    }

    var scores = {};
    var totalWeight = 0;
    state.factors.forEach(function(f) {
      totalWeight += state.weights[f] || 1;
    });

    state.options.forEach(function(opt) {
      var score = 0;
      state.factors.forEach(function(f) {
        var w = state.weights[f] || 1;
        var r = (state.ratings[opt] && state.ratings[opt][f]) || 5;
        score += w * r;
      });
      scores[opt] = score;
    });

    // Normalize scores (percentage of max possible)
    var maxPossible = totalWeight * 10;
    var normalized = {};
    state.options.forEach(function(opt) {
      normalized[opt] = maxPossible > 0 ? Math.round((scores[opt] / maxPossible) * 100) : 0;
    });

    // Rank
    var ranked = state.options.slice().sort(function(a, b) {
      return scores[b] - scores[a];
    });

    return {
      scores: scores,
      normalized: normalized,
      ranked: ranked,
      best: ranked[0] || null,
      worst: ranked[ranked.length - 1] || null,
      totalWeight: totalWeight
    };
  }

  // Helper function to recursively build full decision data
  function buildDecisionData(results) {
    return {
      options: state.options.slice(),
      factors: state.factors.slice(),
      weights: JSON.parse(JSON.stringify(state.weights)),
      ratings: JSON.parse(JSON.stringify(state.ratings)),
      results: results
    };
  }

  // --- Render Results ---
  function renderResults() {
    var resultsDiv = document.getElementById('live-results');
    if (!resultsDiv) return;
    var results = calculateResults();

    if (state.options.length === 0 || state.factors.length === 0) {
      resultsDiv.innerHTML = '<div class="simulator-card"><p style="text-align:center;color:var(--dark-3);padding:1rem;">Add options and factors to see results.</p></div>';
      // Also clear the URL param results if this is the results page
      if (window.renderCharts && typeof window.renderCharts === 'function') {
        window.renderCharts(null);
      }
      return;
    }

    var ranked = results.ranked;

    var html = '<div class="simulator-card">';
    html += '<h2>Results Overview</h2>';

    // Summary cards
    html += '<div class="results-summary-grid" style="margin: 1.5rem 0;">';
    html += '<div class="summary-card best"><div class="summary-value">' + escapeHtml(results.best) + '</div><div class="summary-label">Best Choice</div></div>';
    html += '<div class="summary-card highest"><div class="summary-value">' + (results.normalized[results.best] || 0) + '%</div><div class="summary-label">Highest Score</div></div>';
    html += '<div class="summary-card"><div class="summary-value">' + state.factors.length + '</div><div class="summary-label">Factors</div></div>';
    html += '<div class="summary-card"><div class="summary-value">' + state.options.length + '</div><div class="summary-label">Options</div></div>';
    html += '</div>';

    // Rankings
    html += '<h3>Rankings</h3>';
    html += '<div class="rankings-list" style="margin: 1rem 0;">';
    ranked.forEach(function(opt, i) {
      var place = i + 1;
      var badgeClass = place === 1 ? 'place-1' : place === 2 ? 'place-2' : place === 3 ? 'place-3' : '';
      var medal = place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : place + 'th';
      html += '<div class="ranking-item rank-' + place + '">';
      html += '<div class="rank-number">' + medal + '</div>';
      html += '<div class="rank-info"><h4>' + escapeHtml(opt) + '</h4><div class="rank-score">Score: ' + results.scores[opt] + ' (' + results.normalized[opt] + '%)</div></div>';
      html += '</div>';
    });
    html += '</div>';

    // Recommendation
    var bestFactor = '';
    var bestScore = 0;
    state.factors.forEach(function(f) {
      if (state.weights[f] > bestScore) {
        bestScore = state.weights[f];
        bestFactor = f;
      }
    });
    html += '<div class="recommendation-card">';
    html += '<h3><i class="fas fa-lightbulb"></i> Recommendation</h3>';
    html += '<p>Based on your selected priorities and weighted analysis, <strong>' + escapeHtml(results.best) + '</strong> emerges as the strongest option' +
            (bestFactor ? ' due to its strong alignment with your high-priority factor: <strong>' + escapeHtml(bestFactor) + '</strong>' : '') +
            '. This decision is backed by a structured comparison across ' + state.factors.length + ' key factors tailored to your preferences.</p>';
    html += '</div>';

    // Matrix preview
    html += '<h3>Score Breakdown</h3>';
    html += '<div class="comparison-table-wrapper" style="margin-top:1rem;">';
    html += '<table class="comparison-table"><thead><tr><th>Option</th><th>Total Score</th><th>Normalized %</th></tr></thead><tbody>';
    ranked.forEach(function(opt) {
      html += '<tr><td>' + escapeHtml(opt) + '</td><td>' + results.scores[opt] + '</td><td>' + results.normalized[opt] + '%</td></tr>';
    });
    html += '</tbody></table></div>';

    // Action buttons
    html += '<div class="results-actions">';
    html += '<button class="btn btn-primary" id="save-to-dashboard-btn"><i class="fas fa-save"></i> Save to Dashboard</button>';
    html += '<button class="btn btn-outline" id="export-json-btn"><i class="fas fa-download"></i> Export JSON</button>';
    html += '<button class="btn btn-outline" id="view-full-results-btn"><i class="fas fa-chart-bar"></i> View Full Analysis</button>';
    html += '</div>';

    // Save name input
    html += '<div class="save-name-input">';
    html += '<input type="text" id="save-decision-name" placeholder="Name your decision..." value="My Decision">';
    html += '</div>';

    html += '</div>';
    resultsDiv.innerHTML = html;

    // Bind buttons
    var saveBtn = document.getElementById('save-to-dashboard-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var nameInput = document.getElementById('save-decision-name');
        var name = nameInput ? nameInput.value.trim() || 'My Decision' : 'My Decision';
        var decisionData = {
          name: name,
          options: state.options.slice(),
          factors: state.factors.slice(),
          weights: JSON.parse(JSON.stringify(state.weights)),
          ratings: JSON.parse(JSON.stringify(state.ratings)),
          results: results
        };
        if (window.LDS && window.LDS.storage) {
          window.LDS.storage.saveDecision(decisionData);
          if (window.LDS.showToast) {
            window.LDS.showToast('Decision saved to dashboard!', 'success');
          }
        }
      });
    }

    var exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        var data = buildDecisionData(results);
        if (window.LDS && window.LDS.export) {
          window.LDS.export.downloadJSON(data, 'life-decision.json');
        }
      });
    }

    var viewResultsBtn = document.getElementById('view-full-results-btn');
    if (viewResultsBtn) {
      viewResultsBtn.addEventListener('click', function() {
        // Store in localStorage then navigate to results page
        var data = buildDecisionData(results);
        if (window.LDS && window.LDS.storage) {
          window.LDS.storage.set('current-results', data);
        }
        window.location.href = 'results.html';
      });
    }

    // Store for results page
    if (window.LDS && window.LDS.storage) {
      var data = buildDecisionData(results);
      window.LDS.storage.set('current-results', data);
    }
  }

  // --- Clear Button ---
  function bindClearButton() {
    var btn = document.getElementById('clear-sim-btn');
    if (btn) {
      btn.addEventListener('click', function() {
        if (confirm('Clear all options, factors, weights, and ratings?')) {
          clearState();
          renderOptions();
          renderFactors();
          renderWeights();
          renderMatrix();
          renderResults();
          if (window.LDS && window.LDS.showToast) {
            window.LDS.showToast('Simulation cleared.', 'info');
          }
        }
      });
    }
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Add option
    var addOptionBtn = document.getElementById('add-option-btn');
    var optionInput = document.getElementById('option-input');
    if (addOptionBtn && optionInput) {
      function addOpt() {
        var val = optionInput.value.trim();
        if (addOption(val)) {
          optionInput.value = '';
          optionInput.focus();
        } else {
          if (window.LDS && window.LDS.showToast) {
            window.LDS.showToast('Option already exists or is empty.', 'error');
          }
        }
      }
      addOptionBtn.addEventListener('click', addOpt);
      optionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addOpt();
      });
    }

    // Add factor
    var addFactorBtn = document.getElementById('add-factor-btn');
    var factorInput = document.getElementById('factor-input');
    if (addFactorBtn && factorInput) {
      function addFac() {
        var val = factorInput.value.trim();
        if (addFactor(val)) {
          factorInput.value = '';
          factorInput.focus();
        } else {
          if (window.LDS && window.LDS.showToast) {
            window.LDS.showToast('Factor already exists or is empty.', 'error');
          }
        }
      }
      addFactorBtn.addEventListener('click', addFac);
      factorInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addFac();
      });
    }
  }

  // --- Utilities ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // --- Expose for results page ---
  window.LDS = window.LDS || {};
  window.LDS.getState = function() { return state; };
  window.LDS.calculateResults = calculateResults;
  window.LDS.buildDecisionData = buildDecisionData;
  window.LDS.getTemplates = function() { return TEMPLATES; };

  // --- Init on DOM ready ---
  if (document.getElementById('simulator-section')) {
    document.addEventListener('DOMContentLoaded', init);
  }

})();
