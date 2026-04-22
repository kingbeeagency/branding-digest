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

const SUBCATEGORY_LABELS = {
  whiskey: 'Виски', cognac: 'Коньяк', rum: 'Ром', tequila: 'Текила',
  mezcal: 'Мескаль', vodka: 'Водка', gin: 'Джин', liqueur: 'Ликёр',
  aperitif: 'Аперитив', beer: 'Пиво', cider: 'Сидр', sake: 'Саке', rtd: 'RTD',
};

const PERIOD_LABELS = {
  yesterday: 'вчера',
  '3d': '3 дня',
  '7d': '7 дней',
  '14d': '14 дней',
  'all': 'всё время',
};

const NEWS_TYPE_LABELS = {
  launch: 'Запуск',
  rebrand: 'Ребрендинг',
  ma: 'M&A',
  appointment: 'Назначение',
  trend: 'Тренд',
  award: 'Награда',
};

const ASIAN_REGIONS = new Set(['CN', 'JP', 'KR', 'IN', 'asia']);

// Правка 3: paywall-домены — ставят chip «подписка»
const PAYWALL_DOMAINS = [
  'shankennewsdaily.com', 'wsj.com', 'ft.com', 'winespectator.com',
  'bloomberg.com/news', 'economist.com', 'nytimes.com', 'washingtonpost.com',
  'thedrinksbusiness.com/paid', 'decanter.com/premium'
];

// Правка 4: домены могут быть недоступны в РФ без VPN — ставят chip «РФ: VPN»
const GEOBLOCKED_DOMAINS = [
  'inc.com', 'bloomberg.com', 'fastcompany.com', 'forbes.com', 'cnbc.com',
  'businessinsider.com', 'theinformation.com', 'axios.com'
];

function getDomain(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch { return ''; }
}

function isPaywalled(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return PAYWALL_DOMAINS.some(d => lower.includes(d));
}

function isGeoBlocked(url) {
  if (!url) return false;
  const domain = getDomain(url);
  return GEOBLOCKED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

function accessBadges(url) {
  const badges = [];
  if (isPaywalled(url)) badges.push('<span class="badge badge-access badge-paywall" title="Платная подписка">Подписка</span>');
  if (isGeoBlocked(url)) badges.push('<span class="badge badge-access badge-geoblock" title="Доступ из РФ только через VPN">РФ: VPN</span>');
  return badges.join('');
}

// Правка 2: плитки-бренды для источников (заглушка когда нет картинки)
const SOURCE_BRANDS = {
  'Brand New': { bg: '#E31837', fg: '#ffffff', mark: 'BN' },
  'UnderConsideration': { bg: '#E31837', fg: '#ffffff', mark: 'BN' },
  'The Dieline': { bg: '#FFD400', fg: '#1a1a1a', mark: 'TD' },
  'Dieline': { bg: '#FFD400', fg: '#1a1a1a', mark: 'TD' },
  'Pentawards': { bg: '#111111', fg: '#C9A961', mark: 'PW' },
  'Packaging of the World': { bg: '#2B2B2B', fg: '#ffffff', mark: 'POW' },
  'World Brand Design Society': { bg: '#0F4C81', fg: '#ffffff', mark: 'WBDS' },
  'World of Brand Design': { bg: '#0F4C81', fg: '#ffffff', mark: 'WBDS' },
  'Behance': { bg: '#1769FF', fg: '#ffffff', mark: 'Be' },
  'Topawards Asia': { bg: '#C1272D', fg: '#ffffff', mark: 'TA' },
  'The Spirits Business': { bg: '#00205B', fg: '#C9A961', mark: 'TSB' },
  'Drinks International': { bg: '#003865', fg: '#ffffff', mark: 'DI' },
  'The Drinks Business': { bg: '#7A1F2E', fg: '#ffffff', mark: 'TDB' },
  'Drinkhacker': { bg: '#2A2A2A', fg: '#F5A623', mark: 'DH' },
  'Decanter': { bg: '#6E1A2E', fg: '#ffffff', mark: 'Dec' },
  'VinePair': { bg: '#7A0019', fg: '#ffffff', mark: 'VP' },
  'Vinepair': { bg: '#7A0019', fg: '#ffffff', mark: 'VP' },
  'Wine Industry Advisor': { bg: '#4A3B4A', fg: '#ffffff', mark: 'WIA' },
  'Harpers': { bg: '#1F3A5F', fg: '#ffffff', mark: 'HP' },
  'Harpers Wine & Spirit': { bg: '#1F3A5F', fg: '#ffffff', mark: 'HP' },
  'Wine Spectator': { bg: '#8B0000', fg: '#ffffff', mark: 'WS' },
  'Fast Company': { bg: '#D7443E', fg: '#ffffff', mark: 'FC' },
  'Adweek': { bg: '#0A0A0A', fg: '#ffffff', mark: 'AW' },
  'The Drum': { bg: '#E60000', fg: '#ffffff', mark: 'TD' },
  'Campaign': { bg: '#FF3366', fg: '#ffffff', mark: 'Cmp' },
  'Campaign Live': { bg: '#FF3366', fg: '#ffffff', mark: 'Cmp' },
  'Design Week': { bg: '#00A4E4', fg: '#ffffff', mark: 'DW' },
  "It's Nice That": { bg: '#FF5AF2', fg: '#ffffff', mark: 'INT' },
  'Creative Review': { bg: '#000000', fg: '#FFD400', mark: 'CR' },
  'BranD': { bg: '#000000', fg: '#ffffff', mark: 'BD' },
  'Shift Japan': { bg: '#BC002D', fg: '#ffffff', mark: 'SJ' },
  'LinkedIn': { bg: '#0A66C2', fg: '#ffffff', mark: 'Li' },
  'Trend Hunter': { bg: '#00A859', fg: '#ffffff', mark: 'TH' },
  'Craft Spirits Magazine': { bg: '#3E2723', fg: '#D4AF37', mark: 'CSM' },
  'Shanken News Daily': { bg: '#1B1B1B', fg: '#D4AF37', mark: 'SND' },
  'Inc. Magazine': { bg: '#000000', fg: '#ffffff', mark: 'Inc' },
  'Inc. Magazine / Bloomberg': { bg: '#000000', fg: '#ffffff', mark: 'Inc' },
  'Bloomberg': { bg: '#000000', fg: '#FA7C1A', mark: 'Blm' },
  'Xinhua': { bg: '#C00000', fg: '#FFD700', mark: 'XH' },
  'Athletech News': { bg: '#00897B', fg: '#ffffff', mark: 'ATN' },
  'Fast Company / Athletech News': { bg: '#D7443E', fg: '#ffffff', mark: 'FC' },
  'LBBOnline': { bg: '#1A1A1A', fg: '#ffffff', mark: 'LBB' },
  'LBBOnline / Campaign US': { bg: '#1A1A1A', fg: '#ffffff', mark: 'LBB' },
  'Designboom': { bg: '#1A1A1A', fg: '#ffffff', mark: 'Db' },
  'Resident Magazine': { bg: '#8B7355', fg: '#ffffff', mark: 'Res' },
};

function getSourceBrand(source) {
  if (!source) return { bg: '#2a2a2a', fg: '#ffffff', mark: '?' };
  if (SOURCE_BRANDS[source]) return SOURCE_BRANDS[source];
  // Попробовать первый префикс до «/» или « — »
  const cleaned = source.split(/[\/—\-|]/)[0].trim();
  if (SOURCE_BRANDS[cleaned]) return SOURCE_BRANDS[cleaned];
  // Генерим: берём цвет от хеша и первые буквы
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  const mark = source.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 3).join('').toUpperCase() || '?';
  return { bg: `hsl(${hue}, 35%, 22%)`, fg: '#f5f0e6', mark };
}

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
  data: null,
  news: null,
  archiveIndex: null,
  currentDate: null,
  filters: {
    category: 'all',
    period: '7d',
    priority: 'all',
    region: 'all',
    subcategory_tag: 'all',
    search: '',
  },
  sort: 'relevance',
  calMonth: null,
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

function isAsian(region) {
  return region && ASIAN_REGIONS.has(region);
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
    // Also try to load matching news snapshot for this date
    await loadNews(dateKey);
    render();
    renderNews();
    renderArchiveBanner();
  } catch (err) {
    console.error('Failed to load data:', err);
    renderError('Не удалось загрузить данные. Попробуйте обновить страницу.');
  }
}

async function loadNews(dateKey = null) {
  const url = dateKey ? `archive/news-${dateKey}.json` : 'data/news.json';
  try {
    const res = await fetch(url);
    if (!res.ok) { state.news = null; return; }
    state.news = await res.json();
  } catch {
    state.news = null;
  }
}

async function loadArchiveIndex() {
  try {
    const res = await fetch('archive/index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Support both { dates: [...] } and plain array formats
    state.archiveIndex = Array.isArray(data) ? data : (data.dates || []);
  } catch {
    state.archiveIndex = [{ date: todayISO(), count: state.data ? state.data.total : 0 }];
  }
}

// ===== Filtering & sorting =====
function filterCasesBase(cases) {
  // Applies period filter only — used to compute hero stats
  const { period } = state.filters;
  const today = state.currentDate || todayISO();

  return cases.filter(c => {
    if (period !== 'all' && c.published_at) {
      const days = Math.abs(daysBetween(c.published_at, today));
      if (period === 'yesterday' && days > 1) return false;
      if (period === '3d' && days > 3) return false;
      if (period === '7d' && days > 7) return false;
      if (period === '14d' && days > 14) return false;
    } else if (period !== 'all' && !c.published_at) {
      if (period !== '14d') return false;
    }
    return true;
  });
}

function filterCases() {
  if (!state.data) return [];
  const { cases } = state.data;
  const { category, priority, region, subcategory_tag, search } = state.filters;
  const q = search.trim().toLowerCase();

  // First apply period filter (shared with hero stats)
  const periodFiltered = filterCasesBase(cases);

  return periodFiltered.filter(c => {
    if (category !== 'all' && c.category !== category) return false;
    if (priority !== 'all' && c.priority !== priority) return false;
    if (region === 'asia' && !isAsian(c.region)) return false;
    if (category === 'alcoholic' && subcategory_tag !== 'all' && c.subcategory_tag !== subcategory_tag) return false;
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
    case 'date_desc': return [...arr].sort(byDateDesc);
    case 'date_asc': return [...arr].sort(byDateAsc);
    case 'priority':
      return [...arr].sort((a, b) => (pOrder[a.priority] ?? 3) - (pOrder[b.priority] ?? 3) || byDateDesc(a, b));
    case 'title':
      return [...arr].sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    case 'relevance':
    default:
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

  // Правка #5: Пересчитываем статистику с учётом активного фильтра периода
  const periodFiltered = filterCasesBase(state.data.cases);

  const counts = { all: periodFiltered.length, alcoholic: 0, wine: 0, non_alcoholic: 0, general: 0 };
  periodFiltered.forEach(c => {
    if (counts[c.category] !== undefined) counts[c.category]++;
  });

  const stats = [
    { label: 'Всего кейсов', value: counts.all },
    { label: 'Алкоголь', value: counts.alcoholic },
    { label: 'Вино', value: counts.wine },
    { label: 'Безалк.', value: counts.non_alcoholic },
    { label: 'Брендинг', value: counts.general },
  ];
  host.innerHTML = stats.map(st => `
    <div class="stat" role="listitem">
      <div class="stat-value">${st.value}</div>
      <div class="stat-label">${st.label}</div>
    </div>
  `).join('');

  // Hero period label
  const heroPeriod = $('#hero-period');
  if (heroPeriod) {
    const p = state.filters.period;
    if (p === 'yesterday') heroPeriod.textContent = 'вчерашний день';
    else if (p === '3d') heroPeriod.textContent = 'последние 3 дня';
    else if (p === '7d') heroPeriod.textContent = 'последние 7 дней';
    else if (p === '14d') heroPeriod.textContent = 'последние 14 дней';
    else heroPeriod.textContent = 'всё время';
  }

  // Hero meta
  const meta = $('#hero-meta');
  if (state.currentDate) {
    meta.textContent = `Архив · ${formatDateRu(state.currentDate)}`;
  } else if (state.data.generated_at) {
    const d = new Date(state.data.generated_at);
    const hh = String(d.getUTCHours()+3).padStart(2,'0');
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

// ===== News rendering =====
function renderNews() {
  const section = $('#news-section');
  const grid = $('#news-grid');
  const meta = $('#news-meta');
  if (!section || !grid) return;

  const items = (state.news && state.news.news) || [];
  if (!items.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const top = items.slice(0, 10);
  if (meta) {
    meta.textContent = state.news.period ? `Период: ${state.news.period}` : '';
  }
  grid.innerHTML = top.map(n => renderNewsCardHTML(n)).join('');
}

function renderNewsCardHTML(n) {
  const dateStr = n.date ? formatDateShort(n.date) : '—';
  const typeLabel = NEWS_TYPE_LABELS[n.type] || '';
  const hasImage = !!n.image_url;
  const href = n.source_url || '#';

  // Правка #1: плашка-заглушка если нет картинки (в news-body уже есть заголовок — плашку упрощаем)
  const mediaHTML = hasImage
    ? `<img src="${escapeHTML(n.image_url)}" alt="${escapeHTML(n.title_ru)}" loading="lazy" data-fallback="1">`
    : renderNewsPlaceholderHTML(n.source);

  return `
    <a class="news-card" href="${escapeHTML(href)}" target="_blank" rel="noopener" aria-label="${escapeHTML(n.title_ru)}">
      <div class="news-card-media">
        ${mediaHTML}
        <div class="card-badges">
          ${typeLabel ? `<span class="badge badge-category">${escapeHTML(typeLabel)}</span>` : ''}
          ${n.priority ? `<span class="badge badge-priority-${n.priority}">${n.priority}</span>` : ''}
        </div>
      </div>
      <div class="news-card-body">
        <div class="card-meta">
          <span>${dateStr}</span>
          <span class="card-meta-divider">·</span>
          <span>${escapeHTML(n.source || '')}</span>
        </div>
        <h3 class="news-card-title">${escapeHTML(n.title_ru)}</h3>
        <p class="news-card-summary">${escapeHTML(n.summary_ru || '')}</p>
      </div>
    </a>
  `;
}

function renderNewsPlaceholderHTML(source) {
  // Правка 2: яркая плитка-бренд источника
  const b = getSourceBrand(source);
  return `
    <div class="source-tile" style="--tile-bg:${b.bg};--tile-fg:${b.fg}">
      <div class="source-tile-mark">${escapeHTML(b.mark)}</div>
      <div class="source-tile-source">${escapeHTML(source || '')}</div>
    </div>
  `;
}

function renderPlaceholderHTML(title, source) {
  // Плитка на карточке: только монограмма (текст ниже дублирует карточку)
  const b = getSourceBrand(source);
  return `
    <div class="source-tile source-tile-case" style="--tile-bg:${b.bg};--tile-fg:${b.fg}">
      <div class="source-tile-mark">${escapeHTML(b.mark)}</div>
    </div>
  `;
}

function renderPlaceholderLargeHTML(title, source) {
  // Крупная плашка для детальной модалки (Правка 5)
  const b = getSourceBrand(source);
  return `
    <div class="source-tile source-tile-large" style="--tile-bg:${b.bg};--tile-fg:${b.fg}">
      <div class="source-tile-mark source-tile-mark-large">${escapeHTML(b.mark)}</div>
      <div class="source-tile-case-title">${escapeHTML(title || 'Кейс')}</div>
      ${source ? `<div class="source-tile-source">${escapeHTML(source)}</div>` : ''}
    </div>
  `;
}

function renderCards(cases) {
  const grid = $('#grid');
  const empty = $('#empty-state');
  const limited = cases.slice(0, MAX_CARDS);

  // Правка #4: явная подпись активных фильтров
  const parts = [`Найдено ${cases.length}`];
  const p = state.filters.period;
  if (p && p !== 'all') parts.push(`период ${PERIOD_LABELS[p] || p}`);
  if (state.filters.category !== 'all') parts.push(`категория: ${CATEGORY_LABELS[state.filters.category] || state.filters.category}`);
  if (state.filters.category === 'alcoholic' && state.filters.subcategory_tag !== 'all') {
    parts.push(`подкатегория: ${SUBCATEGORY_LABELS[state.filters.subcategory_tag] || state.filters.subcategory_tag}`);
  }
  if (state.filters.priority !== 'all') parts.push(`приоритет ${state.filters.priority}`);
  if (state.filters.region === 'asia') parts.push('регион: Азия');
  if (state.filters.search) parts.push(`поиск: «${state.filters.search}»`);

  $('#results-count').innerHTML = `<strong>${parts[0]}</strong>` + (parts.length > 1 ? ' · ' + parts.slice(1).join(' · ') : '');
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

  // Fallback placeholder on broken images — сохраняем кликабельность
  $$('img[data-fallback]', grid).forEach(img => {
    img.addEventListener('error', () => {
      const card = img.closest('.card');
      const c = card ? state.data.cases.find(x => x.id === card.dataset.id) : null;
      const ph = document.createElement('div');
      ph.innerHTML = renderPlaceholderHTML(c ? c.title : '', c ? c.source : '');
      img.replaceWith(ph.firstElementChild);
    }, { once: true });
  });

  // Attach click handlers for detail modal
  $$('.card', grid).forEach(el => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(el.dataset.id); }
    });
  });
}

function renderCardHTML(c) {
  const catLabel = CATEGORY_LABELS[c.category] || c.category;

  // Правка #1: для битых картинок — плашка с названием, источником и CTA
  const mediaHTML = c.image_url
    ? `<img src="${escapeHTML(c.image_url)}" alt="${escapeHTML(c.title)}" loading="lazy" data-fallback="1">`
    : renderPlaceholderHTML(c.title, c.source);

  const dateStr = c.published_at ? formatDateShort(c.published_at) : 'Дата не указана';
  const tags = (c.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

  // Правка #3: маленький значок региона для азиатских
  const regionBadge = isAsian(c.region)
    ? `<span class="badge badge-region" title="Азиатский дизайн">Азия</span>`
    : '';

  // Правки 3–4: значки «Подписка» / «РФ: VPN» на карточке
  const accessRow = accessBadges(c.source_url);

  return `
    <article class="card" data-id="${escapeHTML(c.id)}" tabindex="0" role="button" aria-label="${escapeHTML(c.title)}">
      <div class="card-media">
        ${mediaHTML}
        <div class="card-badges">
          <span class="badge badge-category">${escapeHTML(catLabel)}</span>
          ${regionBadge}
          <span class="badge badge-priority-${c.priority}">${c.priority}</span>
        </div>
        ${accessRow ? `<div class="card-access-badges">${accessRow}</div>` : ''}
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
  renderAlcoFilter();
  const filtered = filterCases();
  const sorted = sortCases(filtered);
  renderCards(sorted);
}

// Правка #6: показывать подкатегории только для алкоголя
function renderAlcoFilter() {
  const row = $('#filters-alco');
  if (!row) return;
  if (state.filters.category === 'alcoholic') {
    row.hidden = false;
  } else {
    row.hidden = true;
    if (state.filters.subcategory_tag !== 'all') {
      state.filters.subcategory_tag = 'all';
      $$('[data-filter="subcategory_tag"]').forEach(b =>
        b.classList.toggle('is-active', b.dataset.value === 'all')
      );
    }
  }
}

// ===== Detail modal =====
function openDetail(id) {
  const c = state.data.cases.find(x => x.id === id);
  if (!c) return;

  const inner = $('#detail-inner');
  const catLabel = CATEGORY_LABELS[c.category] || c.category;
  // Правка 5: крупная hero-картинка/плашка в детали
  const mediaHTML = c.image_url
    ? `<img src="${escapeHTML(c.image_url)}" alt="${escapeHTML(c.title)}" data-detail-fallback="1">`
    : renderPlaceholderLargeHTML(c.title, c.source);

  // Правка #2: also_covered_by — кликабельные ссылки, если есть URL
  let coveredHTML = '';
  if (c.also_covered_by && c.also_covered_by.length) {
    const items = c.also_covered_by.map(item => {
      // Поддержка обоих форматов: строка или объект {source, url}
      if (typeof item === 'string') {
        return `<span>${escapeHTML(item)}</span>`;
      }
      if (item && item.url) {
        return `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener" class="covered-link">
          ${escapeHTML(item.source || item.url)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>
        </a>`;
      }
      return `<span>${escapeHTML((item && item.source) || '')}</span>`;
    }).join(' · ');
    coveredHTML = `<div class="detail-covered">Также освещали: ${items}</div>`;
  }

  // Правка #3: бейдж региона в деталях
  const regionBadge = isAsian(c.region)
    ? `<span class="badge badge-region">Азиатский дизайн${c.region && c.region !== 'asia' ? ' · ' + c.region : ''}</span>`
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
          ${regionBadge}
          ${accessBadges(c.source_url)}
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
            ${c.source_url ? `<a href="${escapeHTML(c.source_url)}" target="_blank" rel="noopener" class="detail-primary-link">
              ${escapeHTML(c.source || 'Перейти к источнику')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/></svg>
            </a>` : `<span>${escapeHTML(c.source || '')}</span>`}
            ${coveredHTML}
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

  // Замена битых картинок в детальном окне на крупную плашку
  const detailImg = inner.querySelector('img[data-detail-fallback]');
  if (detailImg) {
    detailImg.addEventListener('error', () => {
      const ph = document.createElement('div');
      ph.innerHTML = renderPlaceholderLargeHTML(c.title, c.source);
      detailImg.replaceWith(ph.firstElementChild);
    }, { once: true });
  }
}

// ===== Archive modal =====
function buildArchiveIndex() {
  if (state.archiveIndex && state.archiveIndex.length) return state.archiveIndex;
  return [{ date: todayISO(), count: state.data ? state.data.total : 0 }];
}

function renderArchiveList() {
  const list = $('#archive-list');
  const index = buildArchiveIndex();
  const recent = index.slice(0, 10);

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

  const firstDay = new Date(year, month, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;

  const prevLastDay = new Date(year, month, 0).getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    cells.push({ day: d, otherMonth: true, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, otherMonth: false, date: dateStr });
  }
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
  $$('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      state.filters[filter] = value;
      $$(`[data-filter="${filter}"]`).forEach(b => b.classList.toggle('is-active', b.dataset.value === value));
      render();
    });
  });

  const search = $('#search');
  let searchTimer;
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.search = search.value;
      render();
    }, 160);
  });

  $('#sort').addEventListener('change', e => {
    state.sort = e.target.value;
    render();
  });

  $('#btn-reset').addEventListener('click', resetFilters);
  $('#btn-reset-empty').addEventListener('click', resetFilters);
}

function resetFilters() {
  state.filters = { category: 'all', period: '7d', priority: 'all', region: 'all', subcategory_tag: 'all', search: '' };
  state.sort = 'relevance';
  $('#search').value = '';
  $('#sort').value = 'relevance';
  $$('[data-filter]').forEach(b => {
    const f = b.dataset.filter;
    const v = b.dataset.value;
    b.classList.toggle('is-active',
      (f === 'category' && v === 'all') ||
      (f === 'period' && v === '7d') ||
      (f === 'priority' && v === 'all') ||
      (f === 'region' && v === 'all') ||
      (f === 'subcategory_tag' && v === 'all')
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
