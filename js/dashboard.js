/* ============================================
   LIFE DECISION SIMULATOR - Dashboard
   Saved simulations, history, favorites with localStorage.
   ============================================ */

(function() {
  'use strict';

  var currentSearch = '';
  var currentSort = 'newest';

  // ==========================================
  // INIT
  // ==========================================

  function init() {
    if (!document.getElementById('dashboard-section')) return;
    bindToolbar();
    render();
    window.addEventListener('storage', function() { render(); });
  }

  // ==========================================
  // TOOLBAR BINDINGS
  // ==========================================

  function bindToolbar() {
    var searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        currentSearch = this.value.toLowerCase().trim();
        render();
      });
    }

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        render();
      });
    }

    var clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', function() {
        var decisions = getDecisions();
        if (decisions.length === 0) return;
        if (confirm('Delete ALL saved decisions? This cannot be undone.')) {
          if (window.LDS && window.LDS.storage) {
            window.LDS.storage.set('decisions', []);
            render();
            if (window.LDS.showToast) window.LDS.showToast('All decisions cleared.', 'info');
          }
        }
      });
    }

    var exportAllBtn = document.getElementById('export-all-btn');
    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', function() {
        var decisions = getDecisions();
        if (decisions.length === 0) {
          if (window.LDS.showToast) window.LDS.showToast('No decisions to export.', 'error');
          return;
        }
        if (window.LDS && window.LDS.export) {
          window.LDS.export.downloadJSON(decisions, 'all-decisions.json');
          if (window.LDS.showToast) window.LDS.showToast('All decisions exported.', 'success');
        }
      });
    }
  }

  // ==========================================
  // DATA HELPERS
  // ==========================================

  function getDecisions() {
    return (window.LDS && window.LDS.storage) ? window.LDS.storage.getAllDecisions() : [];
  }

  function filterAndSort(decisions) {
    // Filter by search
    if (currentSearch) {
      decisions = decisions.filter(function(d) {
        var name = (d.name || '').toLowerCase();
        var best = (d.results && d.results.best || '').toLowerCase();
        var factors = (d.factors || []).join(' ').toLowerCase();
        var options = (d.options || []).join(' ').toLowerCase();
        return name.indexOf(currentSearch) !== -1 ||
               best.indexOf(currentSearch) !== -1 ||
               factors.indexOf(currentSearch) !== -1 ||
               options.indexOf(currentSearch) !== -1;
      });
    }

    // Sort
    var sort = currentSort;
    decisions = decisions.slice(); // copy
    if (sort === 'newest') {
      decisions.sort(function(a, b) { return new Date(b.savedAt) - new Date(a.savedAt); });
    } else if (sort === 'oldest') {
      decisions.sort(function(a, b) { return new Date(a.savedAt) - new Date(b.savedAt); });
    } else if (sort === 'name') {
      decisions.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
    } else if (sort === 'score') {
      decisions.sort(function(a, b) {
        var sa = (a.results && a.results.normalized && a.results.normalized[a.results.best]) || 0;
        var sb = (b.results && b.results.normalized && b.results.normalized[b.results.best]) || 0;
        return sb - sa;
      });
    } else if (sort === 'favorites') {
      decisions.sort(function(a, b) {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.savedAt) - new Date(a.savedAt);
      });
    }

    return decisions;
  }

  // ==========================================
  // RENDER
  // ==========================================

  function render() {
    renderStats();
    renderDecisions();
  }

  function renderStats() {
    var decisions = getDecisions();
    var totalEl = document.getElementById('stat-total');
    var favEl = document.getElementById('stat-favorites');
    var recentEl = document.getElementById('stat-recent');

    if (totalEl) totalEl.textContent = decisions.length;

    if (favEl) {
      favEl.textContent = decisions.filter(function(d) { return d.favorite; }).length;
    }

    if (recentEl) {
      var now = new Date();
      var weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      recentEl.textContent = decisions.filter(function(d) {
        return new Date(d.savedAt) >= weekAgo;
      }).length;
    }
  }

  function renderDecisions() {
    var grid = document.getElementById('decisions-grid');
    if (!grid) return;

    var all = getDecisions();
    var filtered = filterAndSort(all);

    if (all.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon"><i class="fas fa-clipboard-list"></i></div>' +
          '<h3>No decisions saved yet</h3>' +
          '<p>Complete a simulation and save your results to see them here.</p>' +
          '<a href="simulator.html" class="btn btn-primary">Start Simulation</a>' +
        '</div>';
      return;
    }

    if (filtered.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon"><i class="fas fa-search"></i></div>' +
          '<h3>No matches found</h3>' +
          '<p>Try a different search term or clear the filter.</p>' +
        '</div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(function(d) {
      var card = document.createElement('div');
      card.className = 'decision-card' + (d.favorite ? ' favorite' : '');
      card.setAttribute('role', 'article');

      var bestName = (d.results && d.results.best) || 'N/A';
      var bestPct = (d.results && d.results.normalized && d.results.normalized[d.results.best]) || 0;
      var totalOpts = (d.options && d.options.length) || 0;
      var totalFacs = (d.factors && d.factors.length) || 0;
      var date = new Date(d.savedAt);
      var dateStr = formatDate(date);

      var scoreLabel = bestPct > 0 ? bestPct + '% score' : '';

      card.innerHTML =
        '<div class="decision-card-top" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-sm);">' +
          '<div class="decision-title" style="flex:1;">' + escHtml(d.name || 'Untitled Decision') + '</div>' +
          '<span class="decision-fav-icon" style="color:' + (d.favorite ? 'var(--accent)' : 'var(--light-3)') + ';font-size:1.1rem;cursor:default;">' +
            (d.favorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>') +
          '</span>' +
        '</div>' +
        '<div class="decision-date"><i class="far fa-calendar-alt"></i> ' + dateStr + '</div>' +
        '<div class="decision-preview">' +
          '<span class="decision-best"><i class="fas fa-trophy" style="color:var(--accent);font-size:0.8rem;"></i> ' + escHtml(bestName) + '</span>' +
          (scoreLabel ? ' <span class="decision-score-badge" style="display:inline-block;padding:0.15rem 0.5rem;border-radius:var(--radius-full);background:rgba(16,185,129,0.1);color:var(--success);font-size:0.75rem;font-weight:600;margin-left:0.5rem;">' + scoreLabel + '</span>' : '') +
        '</div>' +
        '<div class="decision-meta" style="font-size:0.8rem;color:var(--dark-3);margin-top:var(--space-sm);">' +
          totalOpts + ' option' + (totalOpts !== 1 ? 's' : '') + ' &middot; ' +
          totalFacs + ' factor' + (totalFacs !== 1 ? 's' : '') +
        '</div>' +
        '<div class="decision-actions">' +
          '<button class="btn btn-sm btn-primary load-btn" data-id="' + d.id + '"><i class="fas fa-eye"></i> View</button>' +
          '<button class="btn btn-sm btn-outline rename-btn" data-id="' + d.id + '" title="Rename"><i class="fas fa-pen"></i></button>' +
          '<button class="btn btn-sm btn-outline favorite-btn" data-id="' + d.id + '" title="' + (d.favorite ? 'Unfavorite' : 'Favorite') + '">' +
            '<i class="fas ' + (d.favorite ? 'fa-star' : 'fa-star') + '" style="color:' + (d.favorite ? 'var(--accent)' : '') + '"></i>' +
          '</button>' +
          '<button class="btn btn-sm btn-outline export-btn" data-id="' + d.id + '" title="Export JSON"><i class="fas fa-download"></i></button>' +
          '<button class="btn btn-sm btn-danger delete-btn" data-id="' + d.id + '" title="Delete"><i class="fas fa-trash"></i></button>' +
        '</div>';

      grid.appendChild(card);
    });

    // Bind actions
    bindCardActions(grid);
  }

  // ==========================================
  // CARD ACTION BINDINGS
  // ==========================================

  function bindCardActions(grid) {
    // View / Load
    grid.querySelectorAll('.load-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.dataset.id;
        // Track last viewed timestamp
        if (window.LDS && window.LDS.storage) {
          window.LDS.storage.updateDecision(id, { lastViewedAt: new Date().toISOString() });
        }
        window.location.href = 'results.html?load=' + id;
      });
    });

    // Delete
    grid.querySelectorAll('.delete-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.dataset.id;
        var card = this.closest('.decision-card');
        var name = card ? card.querySelector('.decision-title').textContent : 'this decision';
        if (confirm('Delete "' + name.trim() + '"? This cannot be undone.')) {
          if (window.LDS && window.LDS.storage) {
            window.LDS.storage.deleteDecision(id);
            render();
            if (window.LDS.showToast) window.LDS.showToast('"' + name.trim() + '" deleted.', 'info');
          }
        }
      });
    });

    // Favorite toggle
    grid.querySelectorAll('.favorite-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.dataset.id;
        if (window.LDS && window.LDS.storage) {
          var d = window.LDS.storage.getDecision(id);
          if (d) {
            var newVal = !d.favorite;
            window.LDS.storage.updateDecision(id, { favorite: newVal });
            render();
            if (window.LDS.showToast) {
              window.LDS.showToast(newVal ? 'Added to favorites.' : 'Removed from favorites.', 'info');
            }
          }
        }
      });
    });

    // Rename
    grid.querySelectorAll('.rename-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.dataset.id;
        if (window.LDS && window.LDS.storage) {
          var d = window.LDS.storage.getDecision(id);
          if (d) {
            var newName = prompt('Rename decision:', d.name || '');
            if (newName && newName.trim() && newName.trim() !== d.name) {
              window.LDS.storage.updateDecision(id, { name: newName.trim() });
              render();
              if (window.LDS.showToast) window.LDS.showToast('Decision renamed.', 'success');
            }
          }
        }
      });
    });

    // Export single
    grid.querySelectorAll('.export-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.dataset.id;
        if (window.LDS && window.LDS.storage && window.LDS.export) {
          var d = window.LDS.storage.getDecision(id);
          if (d) {
            window.LDS.export.downloadJSON(d, (d.name || 'decision') + '.json');
            if (window.LDS.showToast) window.LDS.showToast('Exported: ' + (d.name || 'decision'), 'success');
          }
        }
      });
    });
  }

  // ==========================================
  // UTILITY
  // ==========================================

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatDate(date) {
    var now = new Date();
    var diffMs = now - date;
    var diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      var hours = date.getHours();
      var mins = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return 'Today at ' + hours + ':' + (mins < 10 ? '0' : '') + mins + ' ' + ampm;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return diffDays + ' days ago';
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
  }

  // ==========================================
  // BOOT
  // ==========================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
