// ============================================================
// Kingbee Branding Digest Dashboard
// ============================================================

const MAX_CARDS = 32;
const CATEGORY_LABELS = {
  alcoholic: 'Алкоголь',
  wine: 'Вино',
  non_alcoholic: 'Безалкогольные',
  general: 'Брендинг',
};

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];
const MONTHS_RU_GENITIVE = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря'
];

// ===== State =====
const state = {
  data: null,           // current cases.json payload
  archiveIndex: null,   // list of available archive dates
  currentDate: null,    // null = "today"; YYYY-MM-DD for archive view
  filters: {
    category: 'all',
    period: '7d',
    priority: 'all',
    search: '',
  },
  sort: 'relevance',
  calMonth: null,       // Date at first of month being viewed
};

// ===== Utils =====
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateRu(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_RU_GENITIVE[m-1]} ${y}`;
}

function formatDateShort(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_RU_GENITIVE[m-1]}`;
}

function daysBetween(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = Date.UTC(ay, am-1, ad);
  const db = Date.UTC(by, bm-1, bd);
  return Math.round((db - da) / 86400000);
}

function escapeHTML(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ===== Data loading =====
async function loadData(dateKey = null) {
  const url = dateKey ? `archive/${dateKey}.json` : 'cases.json';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.data = data;
    state.currentDate = dateKey;
    render();
    renderArchiveBanner();
  } catch (err) {
    console.error('Failed to load data:', err);
    renderError('Не удалось загрузить данные. Попробуйте обновить страницу.');
  }
}

async function loadArchiveIndex() {
  try {
    const res = await fetch('archive/index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.archiveIndex = await res.json();
  } catch {
    // Fall back to listing just today if no index
    state.archiveIndex = [{ date: todayISO(), count: state.data ? state.data.total : 0 }];
  }
}

// ===== Filtering & sorting =====
function filterCases() {
  if (!state.data) return [];
  const { cases } = state.data;
  const { category, period, priority, search } = state.filters;
  const q = search.trim().toLowerCase();
  const today = state.currentDate || todayISO();

  return cases.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (priority !== 'all' && c.priority !== priority) return false;
    if (period !== 'all' && c.published_at) {
      const days = Math.abs(daysBetween(c.published_at, today));
      if (period === 'yesterday' && days > 1) return false;
      if (period === '3d' && days > 3) return false;
      if (period === '7d' && days > 7) return false;
      if (period === '14d' && days > 14) return false;
    } else if (period !== 'all' && !c.published_at) {
      // Cases without explicit date — include only if period is "all" or 14d
      if (period !== '14d') return false;
    }
    if (q) {
      const hay = [c.title, c.agency, c.description, c.source, ...(c.tags||[])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortCases(arr) {
  const pOrder = { A: 0, B: 1, C: 2 };
  const byDateDesc = (a, b) => (b.published_at || '').localeCompare(a.published_at || '');
  const byDateAsc = (a, b) => (a.published_at || '9').localeCompare(b.published_at || '9');

  switch (state.sort) {
    case 'date_desc':
      return [...arr].sort(byDateDesc);
    case 'date_asc':
      return [...arr].sort(byDateAsc);
    case 'priority':
      return [...arr].sort((a, b) => (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3) || byDateDesc(a, b));
    case 'title':
      return [...arr].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    case 'relevance':
    default:
      // Relevance = priority (A/B/C), then recency, then source tier
      return [...arr].sort((a, b) => {
        const p = (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3);
        if (p) return p;
        return byDateDesc(a, b);
      });
  }
}

// ===== Rendering =====
function renderStats() {
  if (!state.data) return;
  const host = $('#hero-stats');
  const total = state.data.total;
  const s = state.data.summary;
  const stats = [
    { label: 'Всего кейсов', value: total },
    { label: 'Алкоголь', value: s.alcoholic.count },
    { label: 'Вино', value: s.wine.count },
    { label: 'Безалк.', value: s.non_alcoholic.count },
    { label: 'Брендинг', value: s.general.count },
  ];
  host.innerHTML = stats.map(st => `
    <div class="stat" role="listitem">
      <div class="stat-value">${st.value}</div>
      <div class="stat-label">${st.label}</div>
    </div>
  `).join('');

  // Hero meta
  const meta = $('#hero-meta');
  if (state.currentDate) {
    meta.textContent = `Архив · ${formatDateRu(state.currentDate)}`;
  } else if (state.data.generated_at) {
    const d = new Date(state.data.generated_at);
    const hh = String(d.getUTCHours()+3).padStart(2,'0'); // MSK = UTC+3
    const mm = String(d.getUTCMinutes()).padStart(2,'0');
    meta.textContent = `Обновлено · ${formatDateRu(todayISO())} · ${hh}:${mm} МСК`;
  }
}

function renderArchiveBanner() {
  const banner = $('#archive-banner');
  if (state.currentDate) {
    banner.hidden = false;
    $('#archive-banner-date').textContent = formatDateRu(state.currentDate);
    $('#archive-label').textContent = formatDateShort(state.currentDate);
  } else {
    banner.hidden = true;
    $('#archive-label').textContent = 'Архив';
  }
}

function renderCards(cases) {
  const grid = $('#grid');
  const empty = $('#empty-state');
  const limited = cases.slice(0, MAX_CARDS);

  $('#results-count').textContent = `Найдено ${cases.length}`;
  $('#max-cards-hint').textContent = cases.length > MAX_CARDS
    ? `Показано ${MAX_CARDS} из ${cases.length} — уточните фильтры`
    : 'Максимум 32 карточки';

  if (cases.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    empty.hidden = false;
    return;
  }
  grid.hidden = false;
  empty.hidden = true;

  grid.innerHTML = limited.map(c => renderCardHTML(c)).join('');

  // Fallback placeholder on broken images
  $$('img[data-fallback]', grid).forEach(img => {
    img.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.className = 'card-media-placeholder';
      ph.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
      img.replaceWith(ph);
    }, { once: true });
  });

  // Attach click handlers
  $$('.card', grid).forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(el.dataset.id); }
    });
  });
}

function renderCardHTML(c) {
  const catLabel = CATEGORY_LABELS[c.category] || c.category;
  const mediaHTML = c.image_url
    ? `<img src="${escapeHTML(c.image_url)}" alt="${escapeHTML(c.title)}" loading="lazy" data-fallback="1">`
    : `<div class="card-media-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;

  const dateStr = c.published_at ? formatDateShort(c.published_at) : 'Дата не указана';
  const tags = (c.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

  return `
    <article class="card" data-id="${escapeHTML(c.id)}" tabindex="0" role="button" aria-label="${escapeHTML(c.title)}">
      <div class="card-media">
        ${mediaHTML}
        <div class="card-badges">
          <span class="badge badge-category">${escapeHTML(catLabel)}</span>
          <span class="badge badge-priority-${c.priority}">${c.priority}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>${dateStr}</span>
          <span class="card-meta-divider">·</span>
          <span>${escapeHTML(c.source || '')}</span>
        </div>
        <h3 class="card-title">${escapeHTML(c.title)}</h3>
        ${c.agency ? `<div class="card-agency">${escapeHTML(c.agency)}</div>` : ''}
        <p class="card-description">${escapeHTML(c.description || '')}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
      </div>
    </article>
  `;
}

function renderError(msg) {
  $('#grid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--color-text-muted)">${escapeHTML(msg)}</div>`;
}

function render() {
  renderStats();
  const filtered = filterCases();
  const sorted = sortCases(filtered);
  renderCards(sorted);
}

// ===== Detail modal =====
function openDetail(id) {
  const c = state.data.cases.find(x => x.id === id);
  if (!c) return;

  const inner = $('#detail-inner');
  const catLabel = CATEGORY_LABELS[c.category] || c.category;
  const mediaHTML = c.image_url
    ? `<img src="${escapeHTML(c.image_url)}" alt="${escapeHTML(c.title)}">`
    : `<div class="card-media-placeholder" style="min-height:320px;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>`;

  const covered = (c.also_covered_by || []).length
    ? `<div class="detail-covered">Также освещали: ${(c.also_covered_by).map(escapeHTML).join(' · ')}</div>`
    : '';

  inner.innerHTML = `
    <div class="detail-grid">
      <div class="detail-media">${mediaHTML}</div>
      <div class="detail-content">
        <button class="btn btn-icon detail-close" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="detail-meta">
          <span class="badge badge-category">${escapeHTML(catLabel)}</span>
          <span class="badge badge-priority-${c.priority}">Приоритет ${c.priority}</span>
          ${c.subcategory_label ? `<span class="badge badge-category">${escapeHTML(c.subcategory_label)}</span>` : ''}
        </div>
        <h2 class="detail-title">${escapeHTML(c.title)}</h2>
        ${c.agency ? `<div class="detail-agency">${escapeHTML(c.agency)}</div>` : ''}
        <p class="detail-description">${escapeHTML(c.description || '')}</p>

        <div class="detail-section">
          <div class="detail-section-title">Дата публикации</div>
          <div>${c.published_at ? formatDateRu(c.published_at) : 'Не указана'}</div>
        </div>

        ${(c.tags && c.tags.length) ? `
          <div class="detail-section">
            <div class="detail-section-title">Теги</div>
            <div class="detail-tags">${c.tags.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>
          </div>` : ''}

        <div class="detail-section">
          <div class="detail-section-title">Источник</div>
          <div class="detail-sources">
            ${c.source_url ? `<a href="${escapeHTML(c.source_url)}" target="_blank" rel="noopener">
              ${escapeHTML(c.source || 'Перейти к источнику')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>
            </a>` : `<span>${escapeHTML(c.source || '')}</span>`}
            ${covered}
          </div>
        </div>

        <div class="detail-actions">
          ${c.source_url ? `<a class="btn btn-primary" href="${escapeHTML(c.source_url)}" target="_blank" rel="noopener">Открыть кейс</a>` : ''}
          <button class="btn btn-ghost" data-close>Закрыть</button>
        </div>
      </div>
    </div>
  `;

  const modal = $('#detail-modal');
  modal.showModal();
  inner.querySelector('.detail-close').addEventListener('click', () => modal.close());
  inner.querySelector('[data-close]')?.addEventListener('click', () => modal.close());
}

// ===== Archive modal =====
function buildArchiveIndex() {
  // If server-provided index is available, use it; otherwise synthesize single "today"
  if (state.archiveIndex && state.archiveIndex.length) return state.archiveIndex;
  return [{ date: todayISO(), count: state.data ? state.data.total : 0 }];
}

function renderArchiveList() {
  const list = $('#archive-list');
  const index = buildArchiveIndex();
  const recent = index.slice(0, 10); // last 10

  if (!recent.length) {
    list.innerHTML = '<li style="padding:12px;color:var(--color-text-muted);font-size:var(--text-sm)">Архив пока пуст</li>';
    return;
  }

  list.innerHTML = recent.map(entry => {
    const isToday = entry.date === todayISO();
    const isActive = (state.currentDate === entry.date) || (!state.currentDate && isToday);
    const label = isToday ? 'Сегодня' : formatDateRu(entry.date);
    return `<li>
      <button class="archive-item ${isActive ? 'is-active' : ''}" data-date="${entry.date}" ${isToday ? 'data-today="1"' : ''}>
        <span>${label}</span>
        <span class="archive-item-count">${entry.count} кейсов</span>
      </button>
    </li>`;
  }).join('');

  $$('.archive-item', list).forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      const isToday = btn.dataset.today === '1';
      closeArchive();
      loadData(isToday ? null : date);
    });
  });
}

function renderCalendar() {
  if (!state.calMonth) {
    const today = new Date();
    state.calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const year = state.calMonth.getFullYear();
  const month = state.calMonth.getMonth();
  $('#cal-month').textContent = `${MONTHS_RU[month]} ${year}`;

  const index = buildArchiveIndex();
  const available = new Set(index.map(e => e.date));
  const countMap = Object.fromEntries(index.map(e => [e.date, e.count]));

  // First day of month, weekday (Mon=0)
  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7; // Mon=0

  // Last day of previous month
  const prevLastDay = new Date(year, month, 0).getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  // Leading days (previous month)
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    cells.push({ day: d, otherMonth: true, date: null });
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, otherMonth: false, date: dateStr });
  }
  // Trailing days (to fill 6 rows of 7)
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - firstWeekday + 1, otherMonth: true, date: null });
  }

  const today = todayISO();
  const activeDate = state.currentDate || today;

  $('#cal-grid').innerHTML = cells.map(cell => {
    const classes = ['cal-day'];
    if (cell.otherMonth) classes.push('is-other-month');
    const has = cell.date && available.has(cell.date);
    if (has) classes.push('has-digest');
    if (cell.date === activeDate && !cell.otherMonth && has) classes.push('is-active');

    if (has) {
      return `<button class="${classes.join(' ')}" data-date="${cell.date}" title="${countMap[cell.date]} кейсов">${cell.day}</button>`;
    }
    return `<span class="${classes.join(' ')}">${cell.day}</span>`;
  }).join('');

  $$('#cal-grid .has-digest').forEach(btn => {
    btn.addEventListener('click', () => {
      const date = btn.dataset.date;
      const isToday = date === todayISO();
      closeArchive();
      loadData(isToday ? null : date);
    });
  });
}

function openArchive() {
  $('#archive-modal').showModal();
  renderArchiveList();
  renderCalendar();
}

function closeArchive() {
  $('#archive-modal').close();
}

// ===== Theme toggle =====
function setupTheme() {
  const btn = $('[data-theme-toggle]');
  const root = document.documentElement;

  function updateIcon() {
    const d = root.getAttribute('data-theme');
    btn.innerHTML = d === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  updateIcon();
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme');
    root.setAttribute('data-theme', cur === 'dark' ? 'light' : 'dark');
    updateIcon();
  });
}

// ===== Filter UI =====
function setupFilters() {
  // Chips
  $$('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      state.filters[filter] = value;
      // Toggle active
      $$(`[data-filter="${filter}"]`).forEach(b => b.classList.toggle('is-active', b.dataset.value === value));
      render();
    });
  });

  // Search
  const search = $('#search');
  let searchTimer;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = search.value;
      render();
    }, 160);
  });

  // Sort
  $('#sort').addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  // Reset
  $('#btn-reset').addEventListener('click', resetFilters);
  $('#btn-reset-empty').addEventListener('click', resetFilters);
}

function resetFilters() {
  state.filters = { category: 'all', period: '7d', priority: 'all', search: '' };
  state.sort = 'relevance';
  $('#search').value = '';
  $('#sort').value = 'relevance';
  // Reset chip active state
  $$('[data-filter]').forEach(b => {
    const f = b.dataset.filter;
    const v = b.dataset.value;
    b.classList.toggle('is-active',
      (f === 'category' && v === 'all') ||
      (f === 'period' && v === '7d') ||
      (f === 'priority' && v === 'all')
    );
  });
  render();
}

// ===== Archive UI =====
function setupArchive() {
  $('#btn-archive').addEventListener('click', openArchive);
  $('#btn-archive-close').addEventListener('click', closeArchive);
  $('#archive-modal').addEventListener('click', e => {
    if (e.target === $('#archive-modal')) closeArchive();
  });

  $('#btn-archive-back').addEventListener('click', () => {
    loadData(null);
  });

  $('#cal-prev').addEventListener('click', () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  $('#cal-next').addEventListener('click', () => {
    state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1);
    renderCalendar();
  });
}

// ===== PDF Export =====
function setupExport() {
  $('#btn-export').addEventListener('click', () => {
    window.print();
  });
}

// ===== Init =====
async function init() {
  setupTheme();
  setupFilters();
  setupArchive();
  setupExport();

  await loadData();
  await loadArchiveIndex();
}

document.addEventListener('DOMContentLoaded', init);
