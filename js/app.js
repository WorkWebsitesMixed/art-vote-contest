// ══════════════════════════════════════════════
// app.js — Application logic for all pages
// ══════════════════════════════════════════════

/* ─────────────────────────────────────────────
   Guard: ensure CONFIG is loaded
───────────────────────────────────────────── */
if (typeof CONFIG === 'undefined') {
  console.error('CONFIG not found. Make sure config.js is loaded before app.js.');
}

/* ─────────────────────────────────────────────
   API helpers
   Uses Content-Type: text/plain to avoid CORS
   preflight on Google Apps Script endpoints.
───────────────────────────────────────────── */
const API = {
  /**
   * POST an action to the Apps Script web app.
   * Body is JSON encoded as text/plain (avoids preflight CORS issue).
   */
  async post(action, data = {}) {
    if (!isConfigured()) {
      throw new Error('El scriptURL en config.js aún no ha sido configurado. Sigue el README para obtener la URL de tu Apps Script.');
    }
    const body = JSON.stringify({ action, ...data });
    const res = await fetch(CONFIG.scriptURL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    return res.json();
  },

  /**
   * GET the results via query parameter (read-only, no preflight needed).
   */
  async getResults() {
    if (!isConfigured()) {
      throw new Error('El scriptURL en config.js aún no ha sido configurado.');
    }
    const url = `${CONFIG.scriptURL}?action=get_results`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};

/* ─────────────────────────────────────────────
   Shared utilities
───────────────────────────────────────────── */

function isConfigured() {
  return CONFIG.scriptURL &&
    CONFIG.scriptURL !== 'PASTE_YOUR_APPS_SCRIPT_URL_HERE' &&
    CONFIG.scriptURL.startsWith('https://');
}

function getCategoryName(cat) {
  return CONFIG[cat.nameKey] || cat.id;
}

function getPieceById(pieceId) {
  for (const cat of CONFIG.categories) {
    const piece = cat.pieces.find(p => p.id === pieceId);
    if (piece) return piece;
  }
  return null;
}

/**
 * Set an image src, falling back to .svg placeholder if .jpg not found,
 * and then to an inline data-URI placeholder as last resort.
 */
function setImageWithFallback(imgEl, piece) {
  imgEl.alt = piece.title || piece.id;
  imgEl.src = `images/${piece.id}.jpg`;

  imgEl.onerror = function () {
    this.onerror = null;
    // Try the SVG placeholder file
    const svgSrc = `images/${piece.id}.svg`;
    const probe = new Image();
    probe.onload = () => { this.src = svgSrc; };
    probe.onerror = () => { this.src = generateInlinePlaceholder(piece); };
    probe.src = svgSrc;
  };
}

/**
 * Generate an inline SVG data-URI placeholder when no image file exists.
 */
function generateInlinePlaceholder(piece) {
  const catId = piece.id.split('_')[0];
  const colors = {
    cat1: { bg: '#E8EEF8', accent: '#1B2A6B', text: '#1B2A6B' },
    cat2: { bg: '#FCE8F4', accent: '#E91E8C', text: '#8B0D53' }
  };
  const c = colors[catId] || { bg: '#F1F5F9', accent: '#94A3B8', text: '#475569' };

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">',
    `<rect width="300" height="300" fill="${c.bg}"/>`,
    `<rect x="30" y="30" width="240" height="180" rx="10" fill="${c.accent}" opacity="0.12"/>`,
    `<polygon points="50,190 110,120 170,155 210,110 250,190" fill="${c.accent}" opacity="0.25"/>`,
    `<circle cx="210" cy="90" r="25" fill="${c.accent}" opacity="0.2"/>`,
    `<rect y="228" width="300" height="72" fill="${c.accent}" opacity="0.85"/>`,
    `<text x="150" y="264" text-anchor="middle" font-family="Calibri,sans-serif" font-size="20" font-weight="bold" fill="white">${piece.title || piece.id}</text>`,
    `<text x="150" y="287" text-anchor="middle" font-family="Calibri,sans-serif" font-size="13" fill="rgba(255,255,255,0.7)">${piece.artist || ''}</text>`,
    '</svg>'
  ].join('');

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Show a styled alert inside an element.
 * type: 'error' | 'success' | 'info' | 'warning'
 */
function showAlert(boxEl, type, message) {
  const icons = {
    error: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    success: `<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    info: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    warning: `<svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>`
  };
  boxEl.className = `alert alert-${type}`;
  boxEl.innerHTML = (icons[type] || '') + `<span>${message}</span>`;
}

function setButtonLoading(btnEl, isLoading) {
  if (isLoading) {
    btnEl.disabled = true;
    btnEl.classList.add('loading');
  } else {
    btnEl.disabled = false;
    btnEl.classList.remove('loading');
  }
}

/* ─────────────────────────────────────────────
   INDEX PAGE — voter registration (index.html)
───────────────────────────────────────────── */
const IndexPage = {
  init() {
    const form      = document.getElementById('register-form');
    const alertBox  = document.getElementById('alert-box');
    const submitBtn = document.getElementById('submit-btn');

    if (!form) return;

    // Warn if not yet configured
    if (!isConfigured()) {
      showAlert(alertBox, 'warning',
        '<strong>Modo demostración:</strong> configura el <code>scriptURL</code> en <code>js/config.js</code> para activar la votación real. Consulta el README.');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name   = document.getElementById('name').value.trim();
      const email  = document.getElementById('email').value.trim().toLowerCase();
      const school = document.getElementById('school').value.trim();

      // Client-side validation
      if (!name || !email || !school) {
        showAlert(alertBox, 'error', 'Por favor completa todos los campos.');
        return;
      }
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRx.test(email)) {
        showAlert(alertBox, 'error', 'Ingresa un correo electrónico válido.');
        return;
      }

      setButtonLoading(submitBtn, true);
      alertBox.className = 'alert alert-hidden';

      // Demo mode: skip API call
      if (!isConfigured()) {
        sessionStorage.setItem('voter_name',   name);
        sessionStorage.setItem('voter_email',  email);
        sessionStorage.setItem('voter_school', school);
        showAlert(alertBox, 'info', 'Modo demostración — redirigiendo a votación...');
        setTimeout(() => { window.location.href = 'vote.html'; }, 1000);
        return;
      }

      try {
        const result = await API.post('check_email', { email });

        if (result.status === 'already_voted') {
          showAlert(alertBox, 'error',
            'Este correo ya fue utilizado para votar. Solo se permite un voto por persona.');
          setButtonLoading(submitBtn, false);
          return;
        }

        if (result.status !== 'ok') {
          throw new Error(result.message || 'Respuesta inesperada del servidor.');
        }

        sessionStorage.setItem('voter_name',   name);
        sessionStorage.setItem('voter_email',  email);
        sessionStorage.setItem('voter_school', school);

        showAlert(alertBox, 'success', '¡Verificado! Redirigiendo a la votación...');
        setTimeout(() => { window.location.href = 'vote.html'; }, 700);

      } catch (err) {
        showAlert(alertBox, 'error', `Error de conexión: ${err.message}`);
        setButtonLoading(submitBtn, false);
      }
    });
  }
};

/* ─────────────────────────────────────────────
   VOTE PAGE — ballot (vote.html)
───────────────────────────────────────────── */
const VotePage = {
  init() {
    const name   = sessionStorage.getItem('voter_name');
    const email  = sessionStorage.getItem('voter_email');
    const school = sessionStorage.getItem('voter_school');

    // Must arrive from index page
    if (!name || !email || !school) {
      window.location.href = 'index.html';
      return;
    }

    // Personalized greeting
    const greetEl = document.getElementById('voter-greeting');
    if (greetEl) {
      const firstName = name.split(' ')[0];
      greetEl.textContent =
        `¡Hola, ${firstName}! Asigna 1°, 2° y 3° lugar en cada categoría.`;
    }

    this.buildCategories();

    const submitBtn = document.getElementById('submit-vote-btn');
    const alertBox  = document.getElementById('alert-box');
    submitBtn.addEventListener('click', () =>
      this.submitVote(submitBtn, alertBox, { name, email, school }));
  },

  buildCategories() {
    const container = document.getElementById('vote-categories');
    if (!container) return;

    CONFIG.categories.forEach(cat => {
      const catName = getCategoryName(cat);

      const section = document.createElement('div');
      section.className = 'category-section card mb-0';
      section.setAttribute('data-category', cat.id);

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-badge">Categoría</span>
        <h3>${catName}</h3>`;

      const grid = document.createElement('div');
      grid.className = 'artwork-grid';

      cat.pieces.forEach(piece => {
        grid.appendChild(this.buildArtworkCard(piece, cat.id));
      });

      section.appendChild(header);
      section.appendChild(grid);
      container.appendChild(section);
    });
  },

  buildArtworkCard(piece, catId) {
    const card = document.createElement('div');
    card.className = 'artwork-card';
    card.setAttribute('data-piece', piece.id);

    // Image
    const imgWrap = document.createElement('div');
    imgWrap.className = 'artwork-img-wrap';
    const img = document.createElement('img');
    setImageWithFallback(img, piece);
    imgWrap.appendChild(img);

    // Info
    const info = document.createElement('div');
    info.className = 'artwork-info';
    info.innerHTML = `
      <div class="artwork-title">${piece.title}</div>
      <div class="artwork-artist">${piece.artist}</div>
      <div class="artwork-school">${piece.school}</div>`;

    // Place dropdown
    const select = document.createElement('select');
    select.className = 'place-select';
    select.setAttribute('data-piece', piece.id);
    select.setAttribute('data-cat', catId);
    select.innerHTML = `
      <option value="">— Elegir lugar —</option>
      <option value="1st">🥇 1er lugar  (3 pts)</option>
      <option value="2nd">🥈 2do lugar (2 pts)</option>
      <option value="3rd">🥉 3er lugar  (1 pt)</option>`;

    select.addEventListener('change', () => {
      this.updateConstraints(catId);
      this.updateCardHighlight(card, select.value);
      this.updateSelectStyle(select);
    });

    info.appendChild(select);
    card.appendChild(imgWrap);
    card.appendChild(info);
    return card;
  },

  /**
   * Disable already-chosen positions in sibling dropdowns within a category.
   */
  updateConstraints(catId) {
    const section = document.querySelector(`[data-category="${catId}"]`);
    if (!section) return;

    const selects = section.querySelectorAll('.place-select');
    const used = new Set();
    selects.forEach(s => { if (s.value) used.add(s.value); });

    selects.forEach(s => {
      const cur = s.value;
      Array.from(s.options).forEach(opt => {
        if (!opt.value) return;
        opt.disabled = used.has(opt.value) && opt.value !== cur;
      });
    });
  },

  updateCardHighlight(card, value) {
    card.classList.remove('selected-1st', 'selected-2nd', 'selected-3rd');
    if (value === '1st') card.classList.add('selected-1st');
    else if (value === '2nd') card.classList.add('selected-2nd');
    else if (value === '3rd') card.classList.add('selected-3rd');
  },

  updateSelectStyle(sel) {
    sel.classList.remove('has-1st', 'has-2nd', 'has-3rd');
    if (sel.value === '1st') sel.classList.add('has-1st');
    else if (sel.value === '2nd') sel.classList.add('has-2nd');
    else if (sel.value === '3rd') sel.classList.add('has-3rd');
  },

  collectVotes() {
    const votes = {};
    let complete = true;

    CONFIG.categories.forEach(cat => {
      const section = document.querySelector(`[data-category="${cat.id}"]`);
      const byPlace = {};

      if (section) {
        section.querySelectorAll('.place-select').forEach(sel => {
          if (sel.value) byPlace[sel.value] = sel.getAttribute('data-piece');
        });
      }

      if (!byPlace['1st'] || !byPlace['2nd'] || !byPlace['3rd']) {
        complete = false;
      }

      votes[`${cat.id}_1st`] = byPlace['1st'] || '';
      votes[`${cat.id}_2nd`] = byPlace['2nd'] || '';
      votes[`${cat.id}_3rd`] = byPlace['3rd'] || '';
    });

    return { votes, complete };
  },

  async submitVote(submitBtn, alertBox, voter) {
    const { votes, complete } = this.collectVotes();

    if (!complete) {
      showAlert(alertBox, 'error',
        'Por favor asigna 1°, 2° y 3° lugar en <strong>cada categoría</strong> antes de enviar.');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setButtonLoading(submitBtn, true);
    alertBox.className = 'alert alert-hidden';

    // Demo mode
    if (!isConfigured()) {
      showAlert(alertBox, 'info', 'Modo demostración — voto simulado correctamente.');
      sessionStorage.setItem('vote_success', 'true');
      setTimeout(() => { window.location.href = 'thankyou.html'; }, 1200);
      return;
    }

    try {
      const payload = {
        name:   voter.name,
        email:  voter.email,
        school: voter.school,
        ...votes
      };

      const result = await API.post('submit_vote', payload);

      if (result.status === 'already_voted') {
        showAlert(alertBox, 'error', 'Este correo ya fue registrado para votar.');
        setButtonLoading(submitBtn, false);
        return;
      }

      if (result.status === 'error') {
        throw new Error(result.message || 'Error al guardar el voto.');
      }

      sessionStorage.setItem('vote_success', 'true');
      window.location.href = 'thankyou.html';

    } catch (err) {
      showAlert(alertBox, 'error', `Error al enviar voto: ${err.message}`);
      setButtonLoading(submitBtn, false);
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
};

/* ─────────────────────────────────────────────
   THANK YOU PAGE (thankyou.html)
───────────────────────────────────────────── */
const ThankyouPage = {
  init() {
    // Guard: must arrive after a successful vote
    if (!sessionStorage.getItem('vote_success')) {
      window.location.href = 'index.html';
      return;
    }

    const name   = sessionStorage.getItem('voter_name')   || '';
    const school = sessionStorage.getItem('voter_school') || '';

    const summaryEl = document.getElementById('voter-summary');
    if (summaryEl && name) {
      summaryEl.textContent = `Votante: ${name}  ·  ${school}`;
    }

    // Clear session data
    sessionStorage.clear();
  }
};

/* ─────────────────────────────────────────────
   RESULTS PAGE (results.html)
───────────────────────────────────────────── */
const ResultsPage = {
  _pollTimer: null,

  init() {
    this.buildCategoryContainers();
    this.loadResults();
    this._pollTimer = setInterval(() => this.loadResults(), 30000);
  },

  /** Create a card + podium placeholder per category from CONFIG */
  buildCategoryContainers() {
    const root = document.getElementById('results-categories');
    if (!root) return;

    CONFIG.categories.forEach(cat => {
      const catName = getCategoryName(cat);
      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = `
        <div class="category-header" style="margin-bottom:4px">
          <span class="category-badge">Categoría</span>
          <h3>${catName}</h3>
        </div>
        <div id="podium-${cat.id}" class="podium-container">
          <div class="podium-empty">
            <svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Cargando resultados...
          </div>
        </div>`;

      root.appendChild(card);
    });
  },

  async loadResults() {
    try {
      const data = isConfigured()
        ? await API.getResults()
        : this.mockResults();

      this.render(data);

      const updEl = document.getElementById('last-updated');
      if (updEl) {
        updEl.textContent = 'Actualizado: ' +
          new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (err) {
      console.error('Error cargando resultados:', err);
      const updEl = document.getElementById('last-updated');
      if (updEl) updEl.textContent = 'Error al actualizar — reintentando...';
    }
  },

  /** Provide empty mock data when not yet configured */
  mockResults() {
    return {
      status: 'ok',
      voting_open: true,
      total_votes: 0,
      results: {}
    };
  },

  render(data) {
    const { voting_open, total_votes, results } = data;

    // Status badge
    const badge = document.getElementById('status-badge');
    if (badge) {
      if (voting_open) {
        badge.className = 'status-badge open';
        badge.innerHTML = '<span class="status-dot"></span>Votación en progreso';
      } else {
        badge.className = 'status-badge closed';
        badge.innerHTML = '<span class="status-dot"></span>Votación cerrada';
      }
    }

    // Voter count
    const countEl = document.getElementById('voter-count');
    if (countEl) {
      const n = total_votes || 0;
      countEl.textContent = `${n} ${n === 1 ? 'votante' : 'votantes'}`;
    }

    // Podiums per category
    CONFIG.categories.forEach(cat => {
      this.renderPodium(cat, results || {});
    });
  },

  renderPodium(cat, results) {
    const container = document.getElementById(`podium-${cat.id}`);
    if (!container) return;

    // Score each piece in this category
    const scored = cat.pieces.map(piece => {
      const t = results[piece.id] || {};
      return {
        ...piece,
        total:  t.total  || 0,
        first:  t.first  || 0,
        second: t.second || 0,
        third:  t.third  || 0
      };
    }).sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));

    if (scored.every(p => p.total === 0)) {
      container.innerHTML = `
        <div class="podium-empty">
          <svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          Aún no hay votos registrados para esta categoría.
        </div>`;
      return;
    }

    // Build podium: display order is [2nd, 1st, 3rd]
    const order = [
      { rank: 2, piece: scored[1], medal: '🥈', label: '2° Lugar' },
      { rank: 1, piece: scored[0], medal: '🥇', label: '1° Lugar' },
      { rank: 3, piece: scored[2], medal: '🥉', label: '3° Lugar' }
    ];

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'podium-wrap';

    order.forEach(({ rank, piece, medal, label }) => {
      if (!piece) return;

      const spot = document.createElement('div');
      spot.className = `podium-spot place-${rank}`;

      // Rank label above
      const rankLbl = document.createElement('div');
      rankLbl.className = 'podium-rank-label';
      rankLbl.textContent = label;

      // Card
      const cardEl = document.createElement('div');
      cardEl.className = 'podium-card';

      const img = document.createElement('img');
      img.className = 'podium-img';
      setImageWithFallback(img, piece);

      const body = document.createElement('div');
      body.className = 'podium-card-body';
      body.innerHTML = `
        <div class="podium-card-title">${piece.title}</div>
        <div class="podium-card-artist">${piece.artist}</div>
        <span class="podium-score-pill">${piece.total} pts</span>`;

      cardEl.appendChild(img);
      cardEl.appendChild(body);

      // Podium block (colored bar at bottom)
      const block = document.createElement('div');
      block.className = 'podium-block';
      block.textContent = medal;

      spot.appendChild(rankLbl);
      spot.appendChild(cardEl);
      spot.appendChild(block);
      wrap.appendChild(spot);
    });

    container.appendChild(wrap);
  }
};
