// tracker.js — Panel de tracking de pedidos activos

const TrackerView = (() => {
  let confirmingId = null;
  let confirmTimeout = null;

  // ─── Render ──────────────────────────────────────────────────────────────────
  function render() {
    const orders = getActiveOrders();
    const container = document.getElementById('view-tracker');

    // Sort: oldest first (most urgent visible first)
    orders.sort((a, b) => a.createdAt - b.createdAt);

    const redCount = orders.filter(o => getOrderStatus(o.createdAt) === 'red').length;

    // Update red badge in navbar
    const badge = document.getElementById('red-badge');
    if (badge) {
      badge.textContent = redCount;
      badge.style.display = redCount > 0 ? 'inline-flex' : 'none';
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>Sin pedidos activos</h3>
          <p>Cuando llegue una comanda aparecerá aquí</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="tracker-header">
        <span class="orders-count">${orders.length} pedido${orders.length !== 1 ? 's' : ''} activo${orders.length !== 1 ? 's' : ''}</span>
        ${redCount > 0 ? `<span class="red-alert-banner">⚠️ ${redCount} pedido${redCount !== 1 ? 's' : ''} urgente${redCount !== 1 ? 's' : ''}</span>` : ''}
      </div>
      <div class="orders-grid">
        ${orders.map(order => renderCard(order)).join('')}
      </div>
    `;
  }

  function renderCard(order) {
    const status = getOrderStatus(order.createdAt);
    const elapsed = getElapsedSeconds(order.createdAt);
    const isConfirming = confirmingId === order.id;

    const typeLabel = order.type === 'sala'
      ? `🍽️ SALA${order.table ? ` · Mesa ${order.table}` : ''}`
      : '🛵 DELIVERY';

    const typeBadgeClass = order.type === 'sala' ? 'badge-sala' : 'badge-delivery';

    return `
      <div class="order-card status-${status} ${isConfirming ? 'confirming' : ''}" id="card-${order.id}" onclick="TrackerView.requestConfirm('${order.id}')">
        
        <!-- Status bar left -->
        <div class="card-status-bar"></div>

        <!-- Hero: origen + número — lo más visible -->
        <div class="card-hero">
          <span class="card-type-hero ${typeBadgeClass}">${typeLabel}</span>
          <span class="card-id-small">${order.id}</span>
        </div>

        <!-- Items — cuerpo principal -->
        <div class="card-items">
          ${order.items.map(i => `
            <div class="card-item">
              <span class="item-qty">${i.qty}×</span>
              <span class="item-name">${i.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Notes -->
        ${order.notes ? `<div class="card-notes">📝 ${order.notes}</div>` : ''}

        <!-- Footer: timer compacto -->
        <div class="card-footer status-footer-${status}">
          <span class="card-timer-small status-text-${status}" id="timer-${order.id}">⏱ ${formatDuration(elapsed)}</span>
          <span class="card-tap-hint">Toca para entregar</span>
        </div>

        <!-- Confirmation overlay -->
        ${isConfirming ? `
          <div class="confirm-overlay" onclick="event.stopPropagation()">
            <div class="confirm-content">
              <p class="confirm-title">¿Entregar ${order.id}?</p>
              <div class="confirm-timer-bar">
                <div class="confirm-timer-fill" id="confirm-bar-fill"></div>
              </div>
              <div class="confirm-buttons">
                <button class="btn-confirm-yes" onclick="event.stopPropagation(); TrackerView.confirmDelivery('${order.id}')">
                  ✓ ENTREGADO
                </button>
                <button class="btn-confirm-no" onclick="event.stopPropagation(); TrackerView.cancelConfirm()">
                  ✕
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─── Tick (called every second) ──────────────────────────────────────────────
  function tick() {
    const orders = getActiveOrders();
    orders.forEach(order => {
      const timerEl = document.getElementById(`timer-${order.id}`);
      const cardEl = document.getElementById(`card-${order.id}`);
      if (!timerEl || !cardEl) return;

      const status = getOrderStatus(order.createdAt);
      const elapsed = getElapsedSeconds(order.createdAt);

      timerEl.textContent = `⏱ ${formatDuration(elapsed)}`;
      timerEl.className = `card-timer-small status-text-${status}`;

      // Update card and footer status class
      cardEl.className = cardEl.className.replace(/status-(green|yellow|red)/g, `status-${status}`);
      const footerEl = cardEl.querySelector('.card-footer');
      if (footerEl) footerEl.className = `card-footer status-footer-${status}`;
    });

    // Update red badge
    const redCount = orders.filter(o => getOrderStatus(o.createdAt) === 'red').length;
    const badge = document.getElementById('red-badge');
    if (badge) {
      badge.textContent = redCount;
      badge.style.display = redCount > 0 ? 'inline-flex' : 'none';
    }

    // Update tab badge
    const tabBadge = document.getElementById('tab-tracker-badge');
    if (tabBadge) {
      tabBadge.textContent = orders.length;
      tabBadge.style.display = orders.length > 0 ? 'inline-flex' : 'none';
    }

    // Re-render if count changed (new order added from simulator)
    const grid = document.querySelector('.orders-grid');
    if (grid && grid.children.length !== orders.length) {
      render();
    }
  }

  // ─── Refresh (full re-render) ─────────────────────────────────────────────────
  function refresh() {
    render();
  }

  // ─── Confirmation flow ────────────────────────────────────────────────────────
  function requestConfirm(orderId) {
    if (confirmingId === orderId) return; // Already confirming this one
    cancelConfirm(); // Cancel any previous confirmation
    confirmingId = orderId;
    render();

    // Start 4-second timeout bar animation
    requestAnimationFrame(() => {
      const fill = document.getElementById('confirm-bar-fill');
      if (fill) {
        fill.style.transition = 'none';
        fill.style.width = '100%';
        requestAnimationFrame(() => {
          fill.style.transition = 'width 4s linear';
          fill.style.width = '0%';
        });
      }
    });

    confirmTimeout = setTimeout(() => {
      cancelConfirm();
    }, 4000);
  }

  function cancelConfirm() {
    if (confirmTimeout) {
      clearTimeout(confirmTimeout);
      confirmTimeout = null;
    }
    if (confirmingId) {
      confirmingId = null;
      render();
    }
  }

  function confirmDelivery(orderId) {
    if (confirmTimeout) {
      clearTimeout(confirmTimeout);
      confirmTimeout = null;
    }
    confirmingId = null;

    // Animate card out
    const card = document.getElementById(`card-${orderId}`);
    if (card) {
      card.classList.add('slide-out');
    }

    // Play confirmation sound
    playConfirmSound();

    // Close order after animation
    setTimeout(() => {
      closeOrder(orderId);
      render();
      // Refresh history if visible
      if (typeof HistoryView !== 'undefined') HistoryView.refresh();
      if (typeof DashboardView !== 'undefined') DashboardView.refreshKpis();
    }, 350);
  }

  return { render, tick, refresh, requestConfirm, cancelConfirm, confirmDelivery };
})();
