// dashboard.js — Dashboard analítico (datos simulados de Ágora)

const DashboardView = (() => {
  let charts = {};

  // ─── Simulate Ágora data ─────────────────────────────────────────────────────
  function generateAgoraSimData() {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const orders = [];

    // Realistic hourly distribution for a burger restaurant
    const hourlyWeights = {
      12: 6, 13: 18, 14: 22, 15: 14, 16: 5,
      17: 4, 18: 6, 19: 12, 20: 18, 21: 20, 22: 14, 23: 8
    };

    const totalSimulated = 110 + Math.floor(Math.random() * 40);
    const hourKeys = Object.keys(hourlyWeights).map(Number);
    const weightSum = Object.values(hourlyWeights).reduce((a, b) => a + b, 0);

    for (let i = 0; i < totalSimulated; i++) {
      // Pick hour based on weight
      let rand = Math.random() * weightSum;
      let chosenHour = hourKeys[0];
      for (const h of hourKeys) {
        rand -= hourlyWeights[h];
        if (rand <= 0) { chosenHour = h; break; }
      }

      // Only include past hours
      if (chosenHour > now.getHours()) continue;

      const minute = Math.floor(Math.random() * 60);
      const createdAt = new Date(todayStart);
      createdAt.setHours(chosenHour, minute, Math.floor(Math.random() * 60));

      // Duration: normally distributed around 8 min, higher variance at peak hours
      const isPeak = (chosenHour >= 13 && chosenHour <= 15) || (chosenHour >= 20 && chosenHour <= 22);
      const baseDuration = isPeak ? 520 : 420; // seconds
      const variance = isPeak ? 180 : 120;
      const duration = Math.max(120, Math.round(baseDuration + (Math.random() - 0.5) * 2 * variance));

      const type = Math.random() > 0.35 ? 'sala' : 'delivery';
      const numItems = Math.floor(Math.random() * 4) + 1;
      const allItems = Object.values(MENU).flat();
      const items = [];
      for (let j = 0; j < numItems; j++) {
        const item = allItems[Math.floor(Math.random() * allItems.length)];
        items.push({ name: item.name, qty: Math.floor(Math.random() * 2) + 1 });
      }

      let finalStatus = 'green';
      if (duration >= 900) finalStatus = 'red';
      else if (duration >= 600) finalStatus = 'yellow';

      orders.push({
        id: `#SIM-${String(i).padStart(3, '0')}`,
        type,
        table: type === 'sala' ? String(Math.floor(Math.random() * 10) + 1) : null,
        items,
        notes: '',
        createdAt: createdAt.getTime(),
        deliveredAt: createdAt.getTime() + duration * 1000,
        duration,
        finalStatus,
      });
    }

    return orders.filter(o => o.createdAt <= Date.now());
  }

  // Merge simulated + real history
  function getAllData() {
    const real = getHistory();
    const simulated = generateAgoraSimData();
    return [...real, ...simulated];
  }

  // ─── Heatmap data (weekly, simulated) ────────────────────────────────────────
  function generateHeatmapData() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const data = [];
    const peakMultipliers = { 5: 1.4, 6: 1.6 }; // Sat, Sun busier

    days.forEach((day, di) => {
      hours.forEach(h => {
        const base = { 12: 5, 13: 15, 14: 20, 15: 12, 16: 4, 17: 3, 18: 5, 19: 10, 20: 16, 21: 18, 22: 12, 23: 6 }[h] || 0;
        const mult = peakMultipliers[di] || 1;
        const val = Math.round(base * mult * (0.7 + Math.random() * 0.6));
        data.push({ day, hour: h, value: val });
      });
    });
    return { days, hours, data };
  }

  // ─── Top items ────────────────────────────────────────────────────────────────
  function getTopItems(orders) {
    const counts = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.qty;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }

  // ─── Hourly avg times ─────────────────────────────────────────────────────────
  function getHourlyAvg(orders) {
    const byHour = {};
    orders.forEach(o => {
      const h = new Date(o.createdAt).getHours();
      if (!byHour[h]) byHour[h] = [];
      byHour[h].push(o.duration);
    });
    const result = [];
    for (let h = 12; h <= 23; h++) {
      const arr = byHour[h] || [];
      const avg = arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      result.push({ hour: `${h}:00`, avg: avg ? Math.round(avg / 60 * 10) / 10 : null });
    }
    return result;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  function render() {
    const container = document.getElementById('view-dashboard');
    const allOrders = getAllData();
    const metrics = getMetrics(allOrders);
    const activeOrders = getActiveOrders();
    const redCount = activeOrders.filter(o => getOrderStatus(o.createdAt) === 'red').length;
    const total = allOrders.length;
    const salaOrders = allOrders.filter(o => o.type === 'sala');
    const deliveryOrders = allOrders.filter(o => o.type === 'delivery');
    const salaMetrics = getMetrics(salaOrders);
    const deliveryMetrics = getMetrics(deliveryOrders);
    const topItems = getTopItems(allOrders);
    const maxItemCount = topItems[0]?.[1] || 1;

    container.innerHTML = `
      <div class="dashboard-layout">

        <!-- Ágora banner -->
        <div class="agora-banner">
          <span class="agora-dot"></span>
          <span>🔌 Modo simulación activo — En producción, estos datos vendrán de la API de Ágora en tiempo real</span>
        </div>

        <!-- KPI cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">⏱</div>
            <div class="kpi-value">${formatDuration(metrics.avg)}</div>
            <div class="kpi-label">Tiempo medio hoy</div>
          </div>
          <div class="kpi-card kpi-green">
            <div class="kpi-icon">🟢</div>
            <div class="kpi-value">${total > 0 ? Math.round((metrics.green / total) * 100) : 0}%</div>
            <div class="kpi-label">Pedidos en tiempo</div>
            <div class="kpi-sub">${metrics.green} de ${total}</div>
          </div>
          <div class="kpi-card kpi-red">
            <div class="kpi-icon">🔴</div>
            <div class="kpi-value">${redCount}</div>
            <div class="kpi-label">Urgentes ahora</div>
            <div class="kpi-sub">pedidos > 15 min</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">📦</div>
            <div class="kpi-value">${total + activeOrders.length}</div>
            <div class="kpi-label">Comandas totales hoy</div>
            <div class="kpi-sub">${activeOrders.length} activas</div>
          </div>
        </div>

        <!-- Charts row -->
        <div class="charts-row">

          <!-- Line chart: avg time by hour -->
          <div class="chart-card chart-wide">
            <h3 class="chart-title">Tiempo medio por hora</h3>
            <div class="chart-subtitle">Minutos — picos esperados en comida (13-15h) y cena (20-22h)</div>
            <canvas id="chart-hourly" height="220"></canvas>
          </div>

          <!-- Donut: Sala vs Delivery -->
          <div class="chart-card chart-narrow">
            <h3 class="chart-title">Sala vs. Delivery</h3>
            <canvas id="chart-donut" height="220"></canvas>
            <div class="donut-legend">
              <div class="donut-row">
                <span class="donut-dot donut-sala"></span>
                <span>Sala — Media ${formatDuration(salaMetrics.avg)}</span>
              </div>
              <div class="donut-row">
                <span class="donut-dot donut-delivery"></span>
                <span>Delivery — Media ${formatDuration(deliveryMetrics.avg)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Heatmap + Top items row -->
        <div class="charts-row">

          <!-- Heatmap -->
          <div class="chart-card chart-wide">
            <h3 class="chart-title">Heatmap semanal de carga</h3>
            <div class="chart-subtitle">Número de pedidos por día y hora</div>
            <div id="heatmap-container" class="heatmap-container"></div>
          </div>

          <!-- Top products -->
          <div class="chart-card chart-narrow">
            <h3 class="chart-title">Top productos hoy</h3>
            <div class="top-items-list">
              ${topItems.map(([name, count], i) => `
                <div class="top-item-row">
                  <span class="top-rank">${i + 1}</span>
                  <div class="top-item-info">
                    <div class="top-item-name">${name}</div>
                    <div class="top-bar-wrap">
                      <div class="top-bar-fill" style="width: ${Math.round((count / maxItemCount) * 100)}%"></div>
                    </div>
                  </div>
                  <span class="top-count">${count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;

    // Render charts after DOM is ready
    requestAnimationFrame(() => {
      renderHourlyChart(allOrders);
      renderDonutChart(salaOrders.length, deliveryOrders.length);
      renderHeatmap();
    });
  }

  function renderHourlyChart(orders) {
    const ctx = document.getElementById('chart-hourly');
    if (!ctx || typeof Chart === 'undefined') return;
    if (charts.hourly) charts.hourly.destroy();

    const hourlyData = getHourlyAvg(orders);
    const labels = hourlyData.map(d => d.hour);
    const values = hourlyData.map(d => d.avg);

    charts.hourly = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Tiempo medio (min)',
          data: values,
          borderColor: '#00E676',
          backgroundColor: 'rgba(0,230,118,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: values.map(v => {
            if (v === null) return 'transparent';
            if (v >= 15) return '#FF1744';
            if (v >= 10) return '#FFD600';
            return '#00E676';
          }),
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          fill: true,
          spanGaps: true,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16213E',
            borderColor: '#2a3a5c',
            borderWidth: 1,
            callbacks: {
              label: ctx => ctx.parsed.y !== null ? `${ctx.parsed.y} min` : 'Sin datos',
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8892B0' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8892B0', callback: v => `${v}m` },
            min: 0,
          },
        },
        // Annotation lines for 10 and 15 min thresholds
        animation: { duration: 600, easing: 'easeOutQuart' },
      },
    });

    // Draw threshold lines manually via plugin
    Chart.register({
      id: 'thresholdLines',
      afterDraw(chart) {
        if (chart.canvas.id !== 'chart-hourly') return;
        const { ctx: c, chartArea, scales } = chart;
        [[10, '#FFD600', '10 min'], [15, '#FF1744', '15 min']].forEach(([val, color, label]) => {
          const y = scales.y.getPixelForValue(val);
          c.save();
          c.setLineDash([5, 5]);
          c.strokeStyle = color;
          c.lineWidth = 1;
          c.globalAlpha = 0.5;
          c.beginPath();
          c.moveTo(chartArea.left, y);
          c.lineTo(chartArea.right, y);
          c.stroke();
          c.setLineDash([]);
          c.globalAlpha = 0.8;
          c.fillStyle = color;
          c.font = '11px Inter, sans-serif';
          c.fillText(label, chartArea.right - 42, y - 4);
          c.restore();
        });
      },
    });
  }

  function renderDonutChart(salaCount, deliveryCount) {
    const ctx = document.getElementById('chart-donut');
    if (!ctx || typeof Chart === 'undefined') return;
    if (charts.donut) charts.donut.destroy();

    charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sala', 'Delivery'],
        datasets: [{
          data: [salaCount || 1, deliveryCount || 1],
          backgroundColor: ['#42A5F5', '#FF7043'],
          borderColor: '#16213E',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16213E',
            borderColor: '#2a3a5c',
            borderWidth: 1,
          },
        },
        animation: { duration: 600 },
      },
    });
  }

  function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    const { days, hours, data } = generateHeatmapData();
    const maxVal = Math.max(...data.map(d => d.value));

    const hourLabels = hours.map(h => `${h}h`);

    let html = `<div class="heatmap-grid" style="grid-template-columns: 40px repeat(${hours.length}, 1fr)">`;

    // Header row
    html += '<div class="hm-cell hm-empty"></div>';
    hourLabels.forEach(h => { html += `<div class="hm-cell hm-header">${h}</div>`; });

    // Data rows
    days.forEach(day => {
      html += `<div class="hm-cell hm-day-label">${day}</div>`;
      hours.forEach(h => {
        const cell = data.find(d => d.day === day && d.hour === h);
        const val = cell?.value || 0;
        const intensity = maxVal > 0 ? val / maxVal : 0;
        const alpha = 0.1 + intensity * 0.9;
        const bg = `rgba(0, 230, 118, ${alpha.toFixed(2)})`;
        html += `<div class="hm-cell hm-data" style="background: ${bg}" title="${day} ${h}h: ${val} pedidos">${val > 0 ? val : ''}</div>`;
      });
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function refreshKpis() {
    // Only re-render if dashboard is visible
    const el = document.getElementById('view-dashboard');
    if (el && !el.classList.contains('hidden')) {
      render();
    }
  }

  return { render, refreshKpis };
})();
