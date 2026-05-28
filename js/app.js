/* ============================================
   LIFE DECISION SIMULATOR - Global JavaScript
   ============================================ */

(function() {
  'use strict';

  // --- DOM Ready ---
  document.addEventListener('DOMContentLoaded', function() {

    // --- Initialize A11y ---
    document.body.setAttribute('role', 'application');

    // --- Navigation ---
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const mobileLinks = document.querySelectorAll('.nav-links a');

    // Hamburger toggle
    if (hamburger) {
      hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('open');
        const expanded = this.getAttribute('aria-expanded') === 'true' ? 'false' : 'true';
        this.setAttribute('aria-expanded', expanded);
      });
    }

    // Close mobile menu on link click
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
        if (navLinks) navLinks.classList.remove('open');
      });
    });

    // Active page highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    mobileLinks.forEach(function(link) {
      const href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      } else if (currentPage === '' || currentPage === 'index.html') {
        if (link.getAttribute('href') === 'index.html') link.classList.add('active');
      }
    });

    // Sticky navbar on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = currentScroll;
    }, { passive: true });

    // --- Dark Mode Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const savedTheme = localStorage.getItem('lds-theme');

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('lds-theme', theme);
      if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    // --- Intersection Observer for Scroll Animations ---
    const animateElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .fade-in-scale');

    if (animateElements.length > 0) {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      animateElements.forEach(function(el) {
        observer.observe(el);
      });
    }

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.length > 1) {
          const target = document.querySelector(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // --- Toast Notification System ---
    window.LDS = window.LDS || {};
    window.LDS.showToast = function(message, type) {
      type = type || 'info';
      var existing = document.querySelector('.toast');
      if (existing) existing.remove();

      var toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      toast.setAttribute('role', 'alert');
      document.body.appendChild(toast);

      requestAnimationFrame(function() {
        toast.classList.add('show');
      });

      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 400);
      }, 3500);
    };

    // --- LocalStorage Helpers ---
    window.LDS.storage = {
      get: function(key) {
        try {
          return JSON.parse(localStorage.getItem('lds-' + key));
        } catch(e) {
          return null;
        }
      },
      set: function(key, value) {
        localStorage.setItem('lds-' + key, JSON.stringify(value));
      },
      remove: function(key) {
        localStorage.removeItem('lds-' + key);
      },
      getAllDecisions: function() {
        var decisions = this.get('decisions');
        return Array.isArray(decisions) ? decisions : [];
      },
      saveDecision: function(decision) {
        var decisions = this.getAllDecisions();
        decision.id = decision.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        decision.savedAt = decision.savedAt || new Date().toISOString();
        decisions.unshift(decision);
        this.set('decisions', decisions);
        return decision;
      },
      deleteDecision: function(id) {
        var decisions = this.getAllDecisions();
        decisions = decisions.filter(function(d) { return d.id !== id; });
        this.set('decisions', decisions);
        return decisions;
      },
      getDecision: function(id) {
        var decisions = this.getAllDecisions();
        return decisions.find(function(d) { return d.id === id; }) || null;
      },
      updateDecision: function(id, updates) {
        var decisions = this.getAllDecisions();
        var idx = decisions.findIndex(function(d) { return d.id === id; });
        if (idx !== -1) {
          decisions[idx] = Object.assign(decisions[idx], updates);
          this.set('decisions', decisions);
          return decisions[idx];
        }
        return null;
      }
    };

    // --- Export utilities ---
    window.LDS.export = {
      downloadJSON: function(data, filename) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'decision-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      downloadCSV: function(data, filename) {
        if (!data || data.length === 0) return;
        var headers = Object.keys(data[0]);
        var csv = headers.join(',') + '\n';
        data.forEach(function(row) {
          csv += headers.map(function(h) {
            var val = row[h] || '';
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
              val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
          }).join(',') + '\n';
        });
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename || 'decision-data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    // --- Lazy load images ---
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
        img.src = img.getAttribute('src') || img.dataset.src;
      });
    }

  });
})();
