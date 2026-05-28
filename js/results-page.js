/* ============================================
   LIFE DECISION SIMULATOR - Results Page
   Self-contained weighted scoring, rankings, recommendations, and charts.
   ============================================ */

(function() {
  'use strict';

  // ==========================================
  // WEIGHTED SCORING ENGINE (standalone)
  // ==========================================
  // Formula: Final Score = Σ(Factor Weight × Option Rating)
  // Normalized: (Score / MaxPossible) × 100
  // ==========================================

  function computeWeightedScores(options, factors, weights, ratings) {
    if (!options || !factors || options.length === 0 || factors.length === 0) {
      return { scores: {}, normalized: {}, ranked: [], best: null, worst: null, totalWeight: 0 };
    }

    var scores = {};
    var totalWeight = 0;

    factors.forEach(function(f) {
      totalWeight += (weights && weights[f]) || 1;
    });

    options.forEach(function(opt) {
      var score = 0;
      factors.forEach(function(f) {
        var w = (weights && weights[f]) || 1;
        var r = (ratings && ratings[opt] && ratings[opt][f]) || 5;
        score += w * r;
      });
      scores[opt] = score;
    });

    var maxPossible = totalWeight * 10;
    var normalized = {};
    options.forEach(function(opt) {
      normalized[opt] = maxPossible > 0 ? Math.round((scores[opt] / maxPossible) * 100) : 0;
    });

    var ranked = options.slice().sort(function(a, b) {
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

  // ==========================================
  // DATA LOADING
  // ==========================================

  function loadDecisionData() {
    // 1. URL param ?load=<id> — load saved decision from dashboard
    var params = new URLSearchParams(window.location.search);
    var loadId = params.get('load');
    if (loadId && window.LDS && window.LDS.storage) {
      var saved = window.LDS.storage.getDecision(loadId);
      if (saved) return saved;
    }

    // 2. Current session results stored by simulator
    if (window.LDS && window.LDS.storage) {
      var current = window.LDS.storage.get('current-results');
      if (current && current.options && current.options.length > 0) return current;
    }

    // 3. Live simulator state (page was left open)
    if (window.LDS && window.LDS.getState) {
      var state = window.LDS.getState();
      if (state && state.options && state.options.length > 0) {
        var results = computeWeightedScores(state.options, state.factors, state.weights, state.ratings);
        return {
          options: state.options.slice(),
          factors: state.factors.slice(),
          weights: JSON.parse(JSON.stringify(state.weights)),
          ratings: JSON.parse(JSON.stringify(state.ratings)),
          results: results
        };
      }
    }

    return null;
  }

  // ==========================================
  // RENDER: Summary Cards
  // ==========================================

  function renderSummaryCards(data) {
    var container = document.getElementById('summary-cards');
    if (!container) return;
    var r = data.results;
    if (!r) {
      container.innerHTML = '';
      return;
    }

    var bestName = r.best || 'N/A';
    var bestScore = (r.normalized && r.normalized[r.best]) || 0;

    container.innerHTML =
      '<div class="summary-card best">' +
        '<div class="summary-value">' + escHtml(bestName) + '</div>' +
        '<div class="summary-label">Best Choice &nbsp;<span style="font-size:1.2rem;">&#9733;</span></div>' +
      '</div>' +
      '<div class="summary-card highest">' +
        '<div class="summary-value">' + bestScore + '%</div>' +
        '<div class="summary-label">Highest Score</div>' +
      '</div>' +
      '<div class="summary-card">' +
        '<div class="summary-value">' + data.factors.length + '</div>' +
        '<div class="summary-label">Factors Evaluated</div>' +
      '</div>' +
      '<div class="summary-card">' +
        '<div class="summary-value">' + data.options.length + '</div>' +
        '<div class="summary-label">Options Compared</div>' +
      '</div>';
  }

  // ==========================================
  // RENDER: Rankings
  // ==========================================

  function renderRankings(data) {
    var container = document.getElementById('rankings-list');
    if (!container) return;
    var r = data.results;
    if (!r || !r.ranked) { container.innerHTML = ''; return; }

    var html = '';
    r.ranked.forEach(function(opt, i) {
      var place = i + 1;
      var score = r.scores[opt] || 0;
      var pct = r.normalized[opt] || 0;

      var medal, badgeText, badgeClass;
      if (place === 1) {
        medal = '\u{1F947}';
        badgeText = 'Best Choice';
        badgeClass = 'place-1';
      } else if (place === 2) {
        medal = '\u{1F948}';
        badgeText = 'Runner Up';
        badgeClass = 'place-2';
      } else if (place === 3) {
        medal = '\u{1F949}';
        badgeText = 'Third Place';
        badgeClass = 'place-3';
      } else {
        medal = '#' + place;
        badgeText = '';
        badgeClass = '';
      }

      html +=
        '<div class="ranking-item rank-' + place + '">' +
          '<div class="rank-number">' + medal + '</div>' +
          '<div class="rank-info">' +
            '<h4>' + escHtml(opt) + '</h4>' +
            '<div class="rank-score">Weighted Score: <strong>' + score + '</strong> &middot; Normalized: <strong>' + pct + '%</strong></div>' +
          '</div>' +
          (badgeText ? '<span class="rank-badge ' + badgeClass + '">' + badgeText + '</span>' : '') +
        '</div>';
    });
    container.innerHTML = html;
  }

  // ==========================================
  // RENDER: AI-Style Recommendation
  // ==========================================

  function renderRecommendation(data) {
    var container = document.getElementById('recommendation-text');
    if (!container) return;
    var r = data.results;
    if (!r || !r.best) {
      container.textContent = 'Add options and factors to receive a personalized recommendation.';
      return;
    }

    var best = r.best;
    var ratings = data.ratings[best] || {};

    // Find the best-scoring factors for this option (weight × rating)
    var factorScores = data.factors.map(function(f) {
      return {
        factor: f,
        weightedScore: ((data.weights[f] || 1) * (ratings[f] || 5)),
        weight: data.weights[f] || 1,
        rating: ratings[f] || 5
      };
    });
    factorScores.sort(function(a, b) { return b.weightedScore - a.weightedScore; });

    var strongFactors = factorScores.slice(0, 2);
    var weakFactors = factorScores.slice(-1);

    var strongStr = strongFactors.map(function(f) {
      return '<strong>' + escHtml(f.factor) + '</strong> (weight: ' + f.weight + ', rating: ' + f.rating + ')';
    }).join(' and ');

    var html =
      'Based on your <strong>weighted analysis</strong>, <strong>' + escHtml(best) + '</strong> ranks first with a normalized score of <strong>' +
      (r.normalized[best] || 0) + '%</strong>. ';

    if (strongFactors.length > 0) {
      html += 'It performs best on ' + strongStr + ', which align with your top priorities. ';
    }

    html += 'Each option was evaluated across <strong>' + data.factors.length + ' factors</strong> using the formula: ';
    html += '<em>Final Score = \u03a3(Factor Weight \u00d7 Option Rating)</em>. ';
    html += 'Scores are normalized to a 0\u2013100% scale for easy comparison.';

    container.innerHTML = html;
  }

  // ==========================================
  // RENDER: Full Comparison Table
  // ==========================================

  function renderComparisonTable(data) {
    var container = document.getElementById('comparison-table-wrapper');
    if (!container) return;
    var r = data.results;
    if (!r) { container.innerHTML = ''; return; }

    var html = '<table class="comparison-table"><thead><tr><th>Factor</th>';
    data.options.forEach(function(opt) {
      html += '<th>' + escHtml(opt) + '<br><span style="font-weight:400;font-size:0.75rem;color:var(--dark-3);">Rating</span></th>';
      html += '<th style="font-size:0.75rem;color:var(--dark-3);font-weight:400;">Weighted</th>';
    });
    html += '</tr></thead><tbody>';

    data.factors.forEach(function(f) {
      html += '<tr><td><strong>' + escHtml(f) + '</strong> <span style="font-size:0.75rem;color:var(--dark-3);">(w=' + (data.weights[f] || 1) + ')</span></td>';
      data.options.forEach(function(opt) {
        var rating = (data.ratings[opt] && data.ratings[opt][f]) || 5;
        var weighted = rating * (data.weights[f] || 1);
        var isBestCell = true;
        // Check if this is the best option's cell
        data.options.forEach(function(other) {
          var otherRating = (data.ratings[other] && data.ratings[other][f]) || 5;
          var otherWeighted = otherRating * (data.weights[f] || 1);
          if (other !== opt && otherWeighted > weighted) isBestCell = false;
        });
        html += '<td' + (isBestCell ? ' class="best-cell"' : '') + '>' + rating + '</td>';
        html += '<td' + (isBestCell ? ' class="best-cell"' : '') + '>' + weighted + '</td>';
      });
      html += '</tr>';
    });

    // Totals row
    html += '<tr style="background:var(--light);font-weight:600;">';
    html += '<td><strong>Total Weighted Score</strong></td>';
    data.options.forEach(function(opt) {
      html += '<td colspan="2"><strong>' + (r.scores[opt] || 0) + '</strong> <span style="font-size:0.75rem;color:var(--dark-3);font-weight:400;">(' + (r.normalized[opt] || 0) + '%)</span></td>';
    });
    html += '</tr>';

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  // ==========================================
  // BIND ACTION BUTTONS
  // ==========================================

  function bindActions(data) {
    var saveBtn = document.getElementById('save-decision-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var name = prompt('Name this decision:', data.name || 'My Decision');
        if (name && name.trim()) {
          data.name = name.trim();
          if (window.LDS && window.LDS.storage) {
            window.LDS.storage.saveDecision(data);
            if (window.LDS.showToast) window.LDS.showToast('Decision saved to dashboard!', 'success');
          }
        }
      });
    }

    var exportJsonBtn = document.getElementById('export-json-btn');
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', function() {
        if (window.LDS && window.LDS.export) {
          window.LDS.export.downloadJSON(data, (data.name || 'decision') + '.json');
          if (window.LDS.showToast) window.LDS.showToast('JSON file downloaded.', 'success');
        }
      });
    }

    var exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function() {
        if (window.LDS && window.LDS.export) {
          var csvData = data.options.map(function(opt) {
            var row = {
              Option: opt,
              'Total Weighted Score': data.results.scores[opt] || 0,
              'Normalized %': data.results.normalized[opt] || 0
            };
            data.factors.forEach(function(f) {
              row[f + ' (Rating)'] = (data.ratings[opt] && data.ratings[opt][f]) || 5;
              row[f + ' (Weighted)'] = ((data.ratings[opt] && data.ratings[opt][f]) || 5) * (data.weights[f] || 1);
            });
            return row;
          });
          window.LDS.export.downloadCSV(csvData, (data.name || 'decision') + '.csv');
          if (window.LDS.showToast) window.LDS.showToast('CSV file downloaded.', 'success');
        }
      });
    }

    var backBtn = document.getElementById('back-to-simulator-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.location.href = 'simulator.html';
      });
    }
  }

  // ==========================================
  // UTILITY
  // ==========================================

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ==========================================
  // INIT
  // ==========================================

  function init() {
    if (!document.getElementById('results-section')) return;

    var loadingEl = document.getElementById('results-loading');
    var contentEl = document.getElementById('results-content');
    var emptyEl = document.getElementById('results-empty');

    // Load data (from URL, localStorage, or live simulator state)
    var decisionData = loadDecisionData();

    // Hide loading spinner
    if (loadingEl) loadingEl.style.display = 'none';

    // If no data, show empty state
    if (!decisionData || !decisionData.options || decisionData.options.length === 0) {
      if (contentEl) contentEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    // Ensure results exist (recompute if needed)
    if (!decisionData.results || !decisionData.results.scores) {
      decisionData.results = computeWeightedScores(
        decisionData.options,
        decisionData.factors,
        decisionData.weights,
        decisionData.ratings
      );
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Render all sections
    renderSummaryCards(decisionData);
    renderRankings(decisionData);
    renderRecommendation(decisionData);
    renderComparisonTable(decisionData);

    // Render Chart.js visualizations
    if (window.renderCharts) {
      window.renderCharts(decisionData);
    }

    // Bind action buttons
    bindActions(decisionData);

    // Store current results for chart theme-switching
    if (window.LDS && window.LDS.storage) {
      window.LDS.storage.set('current-results', decisionData);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
