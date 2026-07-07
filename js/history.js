// history.js — Historial y métricas

const HistoryView = (() => {
  let sortKey = 'deliveredAt';
  let sortDir = 'desc';
  let filterType = 'all';
  let filterPeriod = 'today';

  function getFilteredOrders() {
    let orders = getHistory();

    // Period filter
    if (filterPeriod === 'today') {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      orders = orders.filter(o => o.createdAt >= todayStart.getTime());
    } else if (filterPeriod === 'week') {
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0, 0, 0, 0);
      orders = orders.filter(o => o.createdAt >= weekStart.getTime());
    }

    // Type filter
    if (filterType !== 'all') {
      orders = orders.filter(o => o.type === filterType);
    }

    // Sort
    orders.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return orders;
  }

  function setSortKey(key) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'desc';
    }
    render();
  }

  function setFilter(type, value) {
    if (type === 'period') filterPeriod = value;
    if (type === 'type') filterType = value;
    render();
  }

  function render() {
    const orders = getFilteredOrders();
    const allHistory = getHistory();
    const metrics = getMetrics(orders);
    const container = document.getElementById('view-history');

    // Color distribution
    const total = orders.length || 1;
    const gPct = Math.round((metrics.green / total) * 100);
    const yPct = Math.round((metrics.yellow / total) * 100);
    const rPct = Math.round((metrics.red / total) * 100);

    container.innerHTML = `
      <div class="history-layout">

        <!-- Metrics cards -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${formatDuration(metrics.avg)}</div>
            <div class="metric-label">Tiempo medio</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${orders.length}</div>
            <div class="metric-label">Pedidos entregados</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.fastest ? formatDuration(metrics.fastest.duration) : '--:--'}</div>
            <div class="metric-label">Más rápido</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.slowest ? formatDuration(metrics.slowest.duration) : '--:--'}</div>
            <div class="metric-label">Más lento</div>
          </div>
        </div>

        <!-- Distribution bar -->
        <div class="distribution-card">
          <div class="dist-title">Distribución de tiempos</div>
          <div class="dist-bar-container">
            <div class="dist-bar-segment dist-green" style="width: ${gPct}%"></div>
            <div class="dist-bar-segment dist-yellow" style="width: ${yPct}%"></div>
            <div class="dist-bar-segment dist-red" style="width: ${rPct}%"></div>
          </div>
          <div class="dist-legend">
            <span class="legend-dot green"></span> En tiempo (${gPct}%)
            <span class="legend-dot yellow"></span> Atención (${yPct}%)
            <span class="legend-dot red"></span> Urgente (${rPct}%)
          </div>
        </div>

        <!-- Filters + Export -->
        <div class="history-toolbar">
          <div class="filter-group">
            <button class="filter-btn ${filterPeriod === 'today' ? 'active' : ''}" onclick="HistoryView.setFilter('period','today')">Hoy</button>
            <button class="filter-btn ${filterPeriod === 'week' ? 'active' : ''}" onclick="HistoryView.setFilter('period','week')">Semana</button>
            <button class="filter-btn ${filterPeriod === 'all' ? 'active' : ''}" onclick="HistoryView.setFilter('period','all')">Todo</button>
          </div>
          <div class="filter-group">
            <button class="filter-btn ${filterType === 'all' ? 'active' : ''}" onclick="HistoryView.setFilter('type','all')">Todos</button>
            <button class="filter-btn ${filterType === 'sala' ? 'active' : ''}" onclick="HistoryView.setFilter('type','sala')">🍽️ Sala</button>
            <button class="filter-btn ${filterType === 'delivery' ? 'active' : ''}" onclick="HistoryView.setFilter('type','delivery')">🛵 Delivery</button>
          </div>
          <div class="action-group">
            <button class="btn-export" onclick="HistoryView.handleExport()">📥 Exportar CSV</button>
            <button class="btn-clear" onclick="HistoryView.handleClear()">🗑️ Limpiar</button>
          </div>
        </div>

        <!-- Table -->
        ${orders.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Sin registros</h3>
            <p>Los pedidos entregados aparecerán aquí</p>
          </div>
        ` : `
          <div class="table-wrapper">
            <table class="history-table">
              <thead>
                <tr>
                  <th onclick="HistoryView.setSortKey('id')" class="sortable">ID ${sortKey === 'id' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Tipo</th>
                  <th>Mesa</th>
                  <th>Items</th>
                  <th onclick="HistoryView.setSortKey('createdAt')" class="sortable">Comanda ${sortKey === 'createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onclick="HistoryView.setSortKey('deliveredAt')" class="sortable">Entregado ${sortKey === 'deliveredAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onclick="HistoryView.setSortKey('duration')" class="sortable">Duración ${sortKey === 'duration' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td class="td-id">${o.id}</td>
                    <td>
                      <span class="type-badge ${o.type === 'sala' ? 'badge-sala' : 'badge-delivery'} badge-sm">
                        ${o.type === 'sala' ? '🍽️ Sala' : '🛵 Delivery'}
                      </span>
                    </td>
                    <td>${o.table || '—'}</td>
                    <td class="td-items">${o.items.map(i => `${i.qty}× ${i.name}`).join(', ')}</td>
                    <td>${new Date(o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>${o.deliveredAt ? new Date(o.deliveredAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td class="td-duration">${formatDuration(o.duration)}</td>
                    <td>
                      <span class="status-pill pill-${o.finalStatus}">
                        ${o.finalStatus === 'green' ? '🟢 En tiempo' : o.finalStatus === 'yellow' ? '🟡 Atención' : '🔴 Urgente'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  function refresh() {
    if (document.getElementById('view-history').classList.contains('hidden')) return;
    render();
  }

  function handleExport() {
    const orders = getFilteredOrders();
    if (orders.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }
    exportCSV(orders);
  }

  function handleClear() {
    const confirm = window.confirm('¿Seguro que quieres borrar todo el historial? Esta acción no se puede deshacer.');
    if (confirm) {
      clearHistory();
      render();
    }
  }

  return { render, refresh, setSortKey, setFilter, handleExport, handleClear };
})();
