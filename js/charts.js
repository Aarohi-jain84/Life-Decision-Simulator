/* ============================================
   LIFE DECISION SIMULATOR - Chart.js Visualizations
   ============================================ */

(function() {
  'use strict';

  var chartInstances = {};

  function destroyCharts() {
    Object.keys(chartInstances).forEach(function(key) {
      if (chartInstances[key]) {
        chartInstances[key].destroy();
        delete chartInstances[key];
      }
    });
  }

  function getChartDefaults() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var textColor = isDark ? '#CBD5E1' : '#64748B';
    var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: 'Inter, sans-serif', size: 12 }
          }
        }
      },
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: { family: 'Inter, sans-serif', size: 11 }
          },
          ticks: {
            color: textColor,
            backdropColor: 'transparent',
            font: { size: 10 }
          }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter, sans-serif', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Inter, sans-serif', size: 11 } },
          beginAtZero: true
        }
      }
    };
  }

  function createBarChart(canvasId, labels, data, title) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    var defaults = getChartDefaults();
    var ctx = canvas.getContext('2d');

    var colors = [
      '#2563EB', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6',
      '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#6366F1'
    ];

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: title || 'Final Score',
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: Object.assign({}, defaults, {
        plugins: Object.assign({}, defaults.plugins, {
          legend: { display: false },
          tooltip: {
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#FFFFFF',
            titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A',
            bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#CBD5E1' : '#64748B',
            borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
          }
        }),
        scales: Object.assign({}, defaults.scales, {
          y: Object.assign({}, defaults.scales.y, {
            beginAtZero: true
          })
        })
      })
    });
  }

  function createRadarChart(canvasId, labels, datasets, title) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    var defaults = getChartDefaults();
    var ctx = canvas.getContext('2d');

    var colors = ['#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];

    var chartDatasets = datasets.map(function(ds, i) {
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: colors[i % colors.length] + '20',
        borderColor: colors[i % colors.length],
        borderWidth: 2,
        pointBackgroundColor: colors[i % colors.length],
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: chartDatasets
      },
      options: Object.assign({}, defaults, {
        plugins: Object.assign({}, defaults.plugins, {
          tooltip: {
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#FFFFFF',
            titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A',
            bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#CBD5E1' : '#64748B',
            borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
          }
        })
      })
    });
  }

  function createDoughnutChart(canvasId, labels, data, title) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    var defaults = getChartDefaults();
    var ctx = canvas.getContext('2d');

    var colors = ['#2563EB', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#6366F1', '#E11D48'];

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#0F172A' : '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: Object.assign({}, defaults, {
        cutout: '65%',
        plugins: Object.assign({}, defaults.plugins, {
          tooltip: {
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1E293B' : '#FFFFFF',
            titleColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#F8FAFC' : '#0F172A',
            bodyColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#CBD5E1' : '#64748B',
            borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
          }
        })
      })
    });
  }

  // --- Main render function called from results page ---
  window.renderCharts = function(decisionData) {
    if (!decisionData) {
      destroyCharts();
      return;
    }

    var options = decisionData.options || [];
    var factors = decisionData.factors || [];
    var weights = decisionData.weights || {};
    var ratings = decisionData.ratings || {};
    var results = decisionData.results;

    if (options.length === 0 || factors.length === 0) {
      destroyCharts();
      return;
    }

    // 1. Bar Chart - Final Scores (normalized %)
    var barLabels = options.slice();
    var barData = results ? options.map(function(o) { return results.normalized[o] || 0; }) : [];
    createBarChart('bar-chart', barLabels, barData, 'Final Score (%)');

    // 2. Radar Chart - Factor performance (raw ratings 1-10)
    var radarDatasets = options.map(function(opt) {
      return {
        label: opt,
        data: factors.map(function(f) {
          return (ratings[opt] && ratings[opt][f]) || 5;
        })
      };
    });
    createRadarChart('radar-chart', factors, radarDatasets, 'Performance by Factor');

    // 3. Doughnut Chart - Weight Distribution
    var weightLabels = factors.slice();
    var weightData = factors.map(function(f) { return weights[f] || 1; });
    createDoughnutChart('doughnut-chart', weightLabels, weightData, 'Weight Distribution');
  };

  // Redraw charts on theme change (with retry for data availability)
  var themeObserver = new MutationObserver(function() {
    // Try to get current data from multiple sources
    var data = null;
    if (window.LDS && window.LDS.storage) {
      data = window.LDS.storage.get('current-results');
    }
    if (!data && window.LDS && window.LDS.getState) {
      var st = window.LDS.getState();
      if (st && st.options && st.options.length > 0) {
        data = {
          options: st.options, factors: st.factors,
          weights: st.weights, ratings: st.ratings,
          results: window.LDS.calculateResults ? window.LDS.calculateResults() : null
        };
      }
    }
    if (data && window.renderCharts) {
      setTimeout(function() { window.renderCharts(data); }, 150);
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

})();
