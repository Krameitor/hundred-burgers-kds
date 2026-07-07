// simulator.js — Simulador de comandas

const SimulatorView = (() => {
  let selectedItems = {}; // { itemId: qty }
  let orderType = 'sala';

  // ─── Random order generator ─────────────────────────────────────────────────
  const RANDOM_NAMES = ['Mesa 1','Mesa 2','Mesa 3','Mesa 4','Mesa 5','Mesa 6','Mesa 7','Mesa 8'];

  function generateRandomOrder() {
    const type = Math.random() > 0.3 ? 'sala' : 'delivery';
    const table = type === 'sala' ? String(Math.floor(Math.random() * 10) + 1) : null;
    const numBurgers = Math.floor(Math.random() * 3) + 1;
    const items = [];

    // Always pick some burgers
    const burgersCopy = [...MENU.burgers];
    for (let i = 0; i < numBurgers; i++) {
      const idx = Math.floor(Math.random() * burgersCopy.length);
      const burger = burgersCopy.splice(idx, 1)[0];
      items.push({ name: burger.name, qty: 1 });
    }

    // Maybe add sides
    if (Math.random() > 0.3) {
      const side = MENU.sides[Math.floor(Math.random() * MENU.sides.length)];
      items.push({ name: side.name, qty: numBurgers });
    }

    // Maybe add drinks
    if (Math.random() > 0.4) {
      const drink = MENU.bebidas[Math.floor(Math.random() * MENU.bebidas.length)];
      items.push({ name: drink.name, qty: Math.floor(Math.random() * 3) + 1 });
    }

    const noteOptions = ['', '', '', 'Sin cebolla', 'Sin gluten (avisa a cocina)', 'Alergia a frutos secos', 'Muy hecha la carne', 'Extra salsa'];
    const notes = noteOptions[Math.floor(Math.random() * noteOptions.length)];

    return { type, table, items, notes };
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  function render() {
    const container = document.getElementById('view-simulator');
    container.innerHTML = `
      <div class="simulator-layout">
        <!-- Left: Form -->
        <div class="sim-form-panel">
          <h2 class="section-title">Nueva Comanda</h2>

          <!-- Type selector -->
          <div class="sim-type-selector">
            <button id="btn-type-sala" class="type-btn ${orderType === 'sala' ? 'active' : ''}" onclick="SimulatorView.setType('sala')">
              <span class="type-icon">🍽️</span>
              <span>SALA</span>
            </button>
            <button id="btn-type-delivery" class="type-btn ${orderType === 'delivery' ? 'active' : ''}" onclick="SimulatorView.setType('delivery')">
              <span class="type-icon">🛵</span>
              <span>DELIVERY</span>
            </button>
          </div>

          <!-- Table number -->
          <div class="sim-field ${orderType === 'delivery' ? 'hidden' : ''}" id="table-field">
            <label class="field-label">Número de Mesa</label>
            <input type="number" id="table-number" class="field-input" placeholder="Ej: 5" min="1" max="99" value="">
          </div>

          <!-- Notes -->
          <div class="sim-field">
            <label class="field-label">Notas / Alergias</label>
            <textarea id="order-notes" class="field-input field-textarea" placeholder="Sin cebolla, alergia a frutos secos..."></textarea>
          </div>

          <!-- Action buttons -->
          <div class="sim-actions">
            <button class="btn-send" onclick="SimulatorView.sendOrder()">
              ✓ ENVIAR COMANDA
            </button>
            <button class="btn-random" onclick="SimulatorView.sendRandom()">
              🎲 Pedido Aleatorio
            </button>
          </div>

          <!-- Send feedback -->
          <div id="sim-feedback" class="sim-feedback hidden"></div>
        </div>

        <!-- Right: Menu picker -->
        <div class="sim-menu-panel">
          <div class="menu-summary-bar">
            <span id="items-count-label">0 items seleccionados</span>
            <button class="btn-clear-items" onclick="SimulatorView.clearItems()">Limpiar</button>
          </div>

          ${MENU_CATEGORIES.map(cat => `
            <div class="menu-category">
              <h3 class="menu-cat-title">${cat.label}</h3>
              <div class="menu-items-grid">
                ${MENU[cat.key].map(item => `
                  <div class="menu-item ${selectedItems[item.id] ? 'selected' : ''}" id="mi-${item.id}">
                    <div class="menu-item-name">${item.name}</div>
                    <div class="menu-item-desc">${item.desc}</div>
                    <div class="menu-item-controls">
                      <button class="qty-btn" onclick="SimulatorView.changeQty('${item.id}', -1)">−</button>
                      <span class="qty-display" id="qty-${item.id}">${selectedItems[item.id] || 0}</span>
                      <button class="qty-btn" onclick="SimulatorView.changeQty('${item.id}', 1)">+</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────
  function setType(type) {
    orderType = type;
    document.getElementById('btn-type-sala').classList.toggle('active', type === 'sala');
    document.getElementById('btn-type-delivery').classList.toggle('active', type === 'delivery');
    document.getElementById('table-field').classList.toggle('hidden', type === 'delivery');
  }

  function changeQty(itemId, delta) {
    const current = selectedItems[itemId] || 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      delete selectedItems[itemId];
    } else {
      selectedItems[itemId] = next;
    }

    // Update qty display
    const qtyEl = document.getElementById(`qty-${itemId}`);
    if (qtyEl) qtyEl.textContent = next;

    // Update card selection state
    const cardEl = document.getElementById(`mi-${itemId}`);
    if (cardEl) cardEl.classList.toggle('selected', next > 0);

    // Update summary bar
    updateSummaryBar();
  }

  function updateSummaryBar() {
    const total = Object.values(selectedItems).reduce((a, b) => a + b, 0);
    const el = document.getElementById('items-count-label');
    if (el) el.textContent = `${total} item${total !== 1 ? 's' : ''} seleccionado${total !== 1 ? 's' : ''}`;
  }

  function clearItems() {
    selectedItems = {};
    render();
  }

  function sendOrder() {
    const items = Object.entries(selectedItems).map(([id, qty]) => {
      const item = getItemById(id);
      return { name: item ? item.name : id, qty };
    });

    if (items.length === 0) {
      showFeedback('⚠️ Añade al menos un item', 'error');
      return;
    }

    const table = orderType === 'sala' ? (document.getElementById('table-number')?.value || '?') : null;
    const notes = document.getElementById('order-notes')?.value || '';

    const order = addOrder({ type: orderType, table, items, notes });
    showFeedback(`✓ Comanda ${order.id} enviada`, 'success');

    // Reset form
    selectedItems = {};
    setTimeout(() => render(), 1200);

    // Notify tracker
    if (typeof TrackerView !== 'undefined') TrackerView.refresh();
  }

  function sendRandom() {
    const data = generateRandomOrder();
    const order = addOrder(data);
    showFeedback(`✓ Comanda aleatoria ${order.id} enviada`, 'success');
    setTimeout(() => render(), 1200);
    if (typeof TrackerView !== 'undefined') TrackerView.refresh();
  }

  function showFeedback(msg, type) {
    const el = document.getElementById('sim-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `sim-feedback ${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2500);
  }

  return { render, setType, changeQty, clearItems, sendOrder, sendRandom };
})();
