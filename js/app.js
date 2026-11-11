const app = (() => {
  const LS_LINKS = 'arcalar_links_v1';
  const LS_SESSIONS = 'arcalar_sessions_v1';
  const LS_WORKSPACE = 'arcalar_workspace_v1';

  const CATEGORIES = ['SAAS', 'CRM', 'E-ticaret', 'Panel', 'Geliştirici', 'İletişim', 'Finans', 'Depolama', 'Design', 'Pazarlama'];
  const WORDS = ['Akış', 'Bulut', 'Canlı', 'Digital', 'Ekibim', 'Finans', 'Gelişim', 'Hızlı', 'İş', 'Kare', 'Lider', 'Müşteri', 'Net', 'Optik', 'Pro', 'Quantum', 'Rota', 'Sana', 'Türkiye', 'Vizyon', 'Web', 'X', 'Yeni', 'Zeka'];

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function seedLinks() {
    const links = [];
    for (let i = 0; i < 400; i++) {
      const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const w1 = WORDS[Math.floor(Math.random() * WORDS.length)];
      const w2 = WORDS[Math.floor(Math.random() * WORDS.length)];
      const name = `${w1}${w2} ${i + 1}`;
      links.push({
        id: uid(),
        name,
        url: `https://${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
        category: cat,
        added: Date.now()
      });
    }
    return links;
  }

  let links = JSON.parse(localStorage.getItem(LS_LINKS));
  if (!links || !links.length) links = seedLinks();
  let sessions = JSON.parse(localStorage.getItem(LS_SESSIONS)) || [];
  let workspace = JSON.parse(localStorage.getItem(LS_WORKSPACE)) || [];

  function save() {
    localStorage.setItem(LS_LINKS, JSON.stringify(links));
    localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(LS_WORKSPACE, JSON.stringify(workspace));
  }

  const els = {};
  function $id(id) { return document.getElementById(id); }
  function initRefs() {
    ['workspace', 'cards', 'search-overlay', 'search-input', 'search-results', 'search-count',
     'tab-workspace', 'tab-links', 'tab-sessions', 'links-list', 'sessions-list',
     'modal', 'modal-content', 'modal-close', 'workspace-empty'].forEach(k => {
       els[k] = $id(k);
     });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function findLink(id) { return links.find(l => l.id === id); }
  function findSession(id) { return sessions.find(s => s.id === id); }

  /* ---------- Workspace ---------- */
  function renderWorkspace() {
    const empty = els['workspace-empty'];
    if (workspace.length === 0) {
      empty.style.display = 'block';
      els['cards'].style.display = 'none';
    } else {
      empty.style.display = 'none';
      els['cards'].style.display = 'grid';
    }
    els['cards'].innerHTML = '';
    workspace.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-favicon">${escapeHtml(item.name.charAt(0).toUpperCase())}</div>
        <div class="card-info">
          <div class="card-title">${escapeHtml(item.name)}</div>
          <div class="card-url">${escapeHtml(item.url)}</div>
        </div>
        <div class="card-actions">
          <button class="icon-btn" data-action="newtab" data-id="${escapeHtml(item.id)}" title="Yeni Sekmede Aç">↗</button>
          <button class="icon-btn remove" data-action="remove" data-id="${escapeHtml(item.id)}" title="Kaldır">×</button>
        </div>`;
      els['cards'].appendChild(card);
    });
  }

  els['cards'].addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'newtab') {
      window.open(findLink(id).url, '_blank');
    } else if (btn.dataset.action === 'remove') {
      workspace = workspace.filter(w => w.id !== id);
      save();
      renderWorkspace();
    }
  });

  /* ---------- Search overlay ---------- */
  let selectedIndex = -1;
  let filteredLinks = [];

  function openSearch() {
    els['search-overlay'].classList.remove('hidden');
    els['search-input'].value = '';
    els['search-input'].focus();
    renderSearch('');
  }
  function closeSearch() {
    els['search-overlay'].classList.add('hidden');
    selectedIndex = -1;
  }

  function renderSearch(query) {
    const q = query.toLowerCase();
    filteredLinks = links.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
    );
    els['search-count'].textContent = `${filteredLinks.length} bağlantı bulundu`;
    els['search-results'].innerHTML = '';
    selectedIndex = -1;
    filteredLinks.slice(0, 60).forEach((link, i) => {
      const li = document.createElement('li');
      li.className = 'search-result';
      li.dataset.id = link.id;
      li.innerHTML = `
        <div class="sr-left">
          <div class="sr-avatar">${escapeHtml(link.name.charAt(0).toUpperCase())}</div>
          <div class="sr-text">
            <div class="sr-name">${escapeHtml(link.name)}</div>
            <div class="sr-meta">${escapeHtml(link.category)} · ${escapeHtml(link.url)}</div>
          </div>
        </div>
        <div class="sr-hint">Shift+G</div>`;
      li.addEventListener('click', () => { openLinkInWorkspace(link); closeSearch(); });
      li.addEventListener('mouseenter', () => { selectedIndex = i; highlight(); });
      els['search-results'].appendChild(li);
    });
    highlight();
  }

  function highlight() {
    [...els['search-results'].children].forEach((li, i) => {
      li.classList.toggle('highlight', i === selectedIndex);
    });
    const active = els['search-results'].children[selectedIndex];
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function openLinkInWorkspace(link) {
    if (!workspace.some(w => w.id === link.id)) {
      workspace.push(link);
      save();
      renderWorkspace();
    }
  }

  els['search-input'].addEventListener('input', e => renderSearch(e.target.value));
  els['search-input'].addEventListener('keydown', e => {
    const max = Math.max(filteredLinks.length > 0 ? Math.min(60, filteredLinks.length) - 1 : -1, -1);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, max);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const li = els['search-results'].children[selectedIndex];
      if (li) { openLinkInWorkspace(findLink(li.dataset.id)); closeSearch(); }
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  window.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.shiftKey && e.key.toLowerCase() === 'g') {
      const li = els['search-results'].children[selectedIndex];
      if (li && !els['search-overlay'].classList.contains('hidden')) {
        openLinkInWorkspace(findLink(li.dataset.id));
      }
    }
  });

  /* ---------- Links tab ---------- */
  function renderLinks() {
    const list = els['links-list'];
    list.innerHTML = '';
    links.forEach(link => {
      const row = document.createElement('div');
      row.className = 'link-row';
      row.innerHTML = `
        <div class="lr-cell">${escapeHtml(link.name)}</div>
        <div class="lr-cell lr-url">${escapeHtml(link.url)}</div>
        <div class="lr-cell lr-cat">${escapeHtml(link.category)}</div>
        <div class="lr-cell lr-act">
          <button class="btn-ghost btn-sm" data-action="editlink" data-id="${escapeHtml(link.id)}">Düzenle</button>
          <button class="btn-ghost btn-sm btn-danger" data-action="deletelink" data-id="${escapeHtml(link.id)}">Sil</button>
        </div>`;
      list.appendChild(row);
    });
  }

  els['links-list'].addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'editlink') openLinkEditor(findLink(id));
    else if (btn.dataset.action === 'deletelink') {
      if (confirm('Bu bağlantıyı silmek istediğinize emin misiniz?')) {
        links = links.filter(l => l.id !== id);
        save();
        renderLinks();
        renderWorkspace();
      }
    }
  });

  $id('add-link').addEventListener('click', () => openLinkEditor(null));

  function openLinkEditor(link) {
    const isNew = !link;
    const data = link || { id: uid(), name: '', url: '', category: 'SAAS', added: Date.now() };
    const html = `
      <h3>${isNew ? 'Yeni Bağlantı' : 'Bağlantıyı Düzenle'}</h3>
      <form id="link-form">
        <label>Ad</label><input name="name" value="${escapeHtml(data.name)}" required>
        <label>URL</label><input name="url" value="${escapeHtml(data.url)}" placeholder="https://" required>
        <label>Kategori</label><select name="category">
          ${CATEGORIES.map(c => `<option ${c === data.category ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
        </select>
        <div class="actions">
          <button class="btn" type="submit">${isNew ? 'Ekle' : 'Kaydet'}</button>
          <button class="btn-ghost" type="button" id="link-cancel">İptal</button>
          ${!isNew ? `<button class="btn btn-danger" data-action="deletemodal" data-id="${escapeHtml(data.id)}">Sil</button>` : ''}
        </div>
      </form>`;
    openModal(html, () => {
      const form = document.getElementById('link-form');
      form.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(form);
        const entry = { name: fd.get('name'), url: fd.get('url'), category: fd.get('category'), added: Date.now() };
        if (isNew) links.push({ id: uid(), ...entry });
        else Object.assign(data, entry);
        save();
        renderLinks();
        renderWorkspace();
        closeModal();
      });
      document.getElementById('link-cancel').addEventListener('click', closeModal);
      const del = document.querySelector('[data-action="deletemodal"]');
      if (del) del.addEventListener('click', () => {
        links = links.filter(l => l.id !== data.id);
        save();
        renderLinks();
        renderWorkspace();
        closeModal();
      });
    });
  }

  /* ---------- Sessions tab ---------- */
  function renderSessions() {
    const list = els['sessions-list'];
    list.innerHTML = '';

    const saveBar = document.createElement('div');
    saveBar.className = 'session-item';
    saveBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px">
        <input id="new-session-name" placeholder="Oturum adı..." style="flex:1; padding:8px; border:1px solid #ccc; border-radius:6px;">
        <button class="btn btn-sm" id="save-session">Kaydet</button>
      </div>
      <div class="meta" style="font-size:12px; color:#666; margin-top:4px">Şu anda açık olan bağlantıları bir oturum olarak kaydet</div>`;
    list.appendChild(saveBar);

    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item';
      item.innerHTML = `
        <div>
          <div class="name">${escapeHtml(s.name)}</div>
          <div class="meta">${s.links.length} bağlantı · ${new Date(s.created).toLocaleString('tr-TR')}</div>
        </div>
        <div class="btns">
          <button class="btn btn-sm" data-action="loadsession" data-id="${escapeHtml(s.id)}">Oturumu Aç</button>
          <button class="btn-ghost btn-sm" data-action="editsession" data-id="${escapeHtml(s.id)}">Düzenle</button>
          <button class="btn-ghost btn-sm btn-danger" data-action="deletesession" data-id="${escapeHtml(s.id)}">Sil</button>
        </div>`;
      list.appendChild(item);
    });
  }

  els['sessions-list'].addEventListener('click', e => {
    const btn = e.target.closest('[data-action], #save-session');
    if (!btn) return;
    if (btn.id === 'save-session') {
      const name = document.getElementById('new-session-name').value.trim();
      if (!name) return alert('Lütfen oturum adı girin');
      sessions.push({ id: uid(), name, links: [...workspace], created: Date.now() });
      document.getElementById('new-session-name').value = '';
      save();
      renderSessions();
    } else {
      const id = btn.dataset.id;
      if (btn.dataset.action === 'loadsession') {
        workspace = [...findSession(id).links];
        save();
        renderWorkspace();
        showTab('workspace');
      } else if (btn.dataset.action === 'editsession') {
        openSessionEditor(findSession(id));
      } else if (btn.dataset.action === 'deletesession') {
        if (confirm('Bu oturumu silmek istediğinize emin misiniz?')) {
          sessions = sessions.filter(s => s.id !== id);
          save();
          renderSessions();
        }
      }
    }
  });

  function openSessionEditor(session) {
    const html = `
      <h3>Oturumu Düzenle</h3>
      <form id="session-form">
        <label>Ad</label><input name="name" value="${escapeHtml(session.name)}" required>
        <div class="actions" style="flex-direction: column; gap: 8px;">
          <button class="btn" type="submit">Kaydet</button>
          <button class="btn-ghost" type="button" id="session-cancel">İptal</button>
        </div>
      </form>`;
    openModal(html, () => {
      const form = document.getElementById('session-form');
      form.addEventListener('submit', e => {
        e.preventDefault();
        session.name = form.name.value.trim();
        save();
        renderSessions();
        closeModal();
      });
      document.getElementById('session-cancel').addEventListener('click', closeModal);
    });
  }

  /* ---------- Modal ---------- */
  function openModal(html, onReady) {
    els['modal-content'].innerHTML = html;
    els['modal'].classList.remove('hidden');
    if (onReady) onReady();
  }
  function closeModal() {
    els['modal'].classList.add('hidden');
    els['modal-content'].innerHTML = '';
  }
  els['modal-close'].addEventListener('click', closeModal);
  els['modal'].addEventListener('click', e => { if (e.target === els['modal']) closeModal(); });

  /* ---------- Tabs ---------- */
  function showTab(name) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    ['workspace', 'links', 'sessions'].forEach(t => {
      els['tab-' + t].classList.toggle('hidden', t !== name);
    });
    if (name === 'links') renderLinks();
    else if (name === 'sessions') renderSessions();
    else renderWorkspace();
  }
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.addEventListener('click', () => showTab(b.dataset.tab));
  });

  /* ---------- Init ---------- */
  initRefs();
  showTab('workspace');

  return { openLinkInWorkspace };
})();
