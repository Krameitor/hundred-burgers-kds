// storage.js — Capa de persistencia con localStorage

const STORAGE_KEYS = {
  ACTIVE_ORDERS: 'hb_active_orders',
  HISTORY: 'hb_history',
  ORDER_COUNTER: 'hb_order_counter',
};

// ─── Order counter ────────────────────────────────────────────────────────────
function getNextOrderId() {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.ORDER_COUNTER) || '0', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, String(next));
  return `#${String(next).padStart(3, '0')}`;
}

// ─── Active orders ────────────────────────────────────────────────────────────
function getActiveOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDERS) || '[]');
  } catch {
    return [];
  }
}

function saveActiveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDERS, JSON.stringify(orders));
}

function addOrder(orderData) {
  const orders = getActiveOrders();
  const order = {
    id: getNextOrderId(),
    type: orderData.type,           // 'sala' | 'delivery'
    table: orderData.table || null, // string or null
    items: orderData.items,         // [{ name, qty }]
    notes: orderData.notes || '',
    createdAt: Date.now(),
    deliveredAt: null,
    duration: null,
    finalStatus: null,              // 'green' | 'yellow' | 'red'
  };
  orders.push(order);
  saveActiveOrders(orders);
  return order;
}

function closeOrder(orderId) {
  const orders = getActiveOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  const order = orders[idx];
  const deliveredAt = Date.now();
  const durationSec = Math.floor((deliveredAt - order.createdAt) / 1000);

  // Determine final color status
  let finalStatus = 'green';
  if (durationSec >= 900) finalStatus = 'red';       // >= 15 min
  else if (durationSec >= 600) finalStatus = 'yellow'; // >= 10 min

  const closedOrder = {
    ...order,
    deliveredAt,
    duration: durationSec,
    finalStatus,
  };

  // Remove from active
  orders.splice(idx, 1);
  saveActiveOrders(orders);

  // Add to history
  const history = getHistory();
  history.unshift(closedOrder);
  saveHistory(history);

  return closedOrder;
}

// ─── History ──────────────────────────────────────────────────────────────────
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
function getMetrics(orders) {
  if (!orders || orders.length === 0) {
    return { avg: 0, fastest: null, slowest: null, green: 0, yellow: 0, red: 0 };
  }
  const durations = orders.map(o => o.duration);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const fastest = orders.reduce((a, b) => a.duration < b.duration ? a : b);
  const slowest = orders.reduce((a, b) => a.duration > b.duration ? a : b);
  const green = orders.filter(o => o.finalStatus === 'green').length;
  const yellow = orders.filter(o => o.finalStatus === 'yellow').length;
  const red = orders.filter(o => o.finalStatus === 'red').length;
  return { avg, fastest, slowest, green, yellow, red };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(orders) {
  const headers = ['ID', 'Tipo', 'Mesa', 'Items', 'Hora Comanda', 'Hora Entrega', 'Duración (seg)', 'Estado'];
  const rows = orders.map(o => [
    o.id,
    o.type === 'sala' ? 'Sala' : 'Delivery',
    o.table || '-',
    o.items.map(i => `${i.qty}x ${i.name}`).join(' | '),
    new Date(o.createdAt).toLocaleString('es-ES'),
    o.deliveredAt ? new Date(o.deliveredAt).toLocaleString('es-ES') : '-',
    o.duration || '-',
    o.finalStatus === 'green' ? 'En tiempo' : o.finalStatus === 'yellow' ? 'Atención' : 'Urgente',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hundred-burgers-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  if (seconds == null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getOrderStatus(createdAt) {
  const elapsed = Math.floor((Date.now() - createdAt) / 1000);
  if (elapsed >= 900) return 'red';
  if (elapsed >= 600) return 'yellow';
  return 'green';
}

function getElapsedSeconds(createdAt) {
  return Math.floor((Date.now() - createdAt) / 1000);
}
