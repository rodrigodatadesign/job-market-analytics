// Utility functions
const hexToRGB = (h) => {
  let r = 0;
  let g = 0;
  let b = 0;
  if (h.length === 4) {
    r = `0x${h[1]}${h[1]}`;
    g = `0x${h[2]}${h[2]}`;
    b = `0x${h[3]}${h[3]}`;
  } else if (h.length === 7) {
    r = `0x${h[1]}${h[2]}`;
    g = `0x${h[3]}${h[4]}`;
    b = `0x${h[5]}${h[6]}`;
  }
  return `${+r},${+g},${+b}`;
};

const formatValue = (value) => Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumSignificantDigits: 3,
  notation: 'compact',
}).format(value);

// Define Chart.js default settings
Chart.defaults.font.family = '"Inter", sans-serif';
Chart.defaults.font.weight = 500;
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.displayColors = false;
Chart.defaults.plugins.tooltip.mode = 'nearest';
Chart.defaults.plugins.tooltip.intersect = false;
Chart.defaults.plugins.tooltip.position = 'nearest';
Chart.defaults.plugins.tooltip.caretSize = 0;
Chart.defaults.plugins.tooltip.caretPadding = 20;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 8;

// Function that generates a gradient for line charts
const chartAreaGradient = (ctx, chartArea, colorStops) => {
  if (!ctx || !chartArea || !colorStops || colorStops.length === 0) {
    return 'transparent';
  }
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  colorStops.forEach(({ stop, color }) => {
    gradient.addColorStop(stop, color);
  });
  return gradient;
};

// Init #dashboard-01 chart
const dashboardCard01 = () => {
  const ctx = document.getElementById('dashboard-card-01');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const tooltipBodyColor = { light: '#6B7280', dark: '#9CA3AF' };
  const tooltipBgColor = { light: '#ffffff', dark: '#374151' };
  const tooltipBorderColor = { light: '#E5E7EB', dark: '#4B5563' };

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          fill: true,
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            return chartAreaGradient(ctx, chartArea, [
              { stop: 0, color: `rgba(${hexToRGB('#6366f1')}, 0)` },
              { stop: 1, color: `rgba(${hexToRGB('#6366f1')}, 0.2)` }
            ]);
          },
          borderColor: '#6366f1',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: '#6366f1',
          pointHoverBackgroundColor: '#6366f1',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          clip: 20,
          tension: 0.2
        },
        {
          data: [],
          borderColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          clip: 20,
          tension: 0.2
        },
      ],
    },
    options: {
      layout: { padding: 20 },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { type: 'time', time: { parser: 'YYYY-MM', unit: 'month' }, display: false },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => false,
            label: (context) => `${context.parsed.y} vagas`,
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
        legend: { display: false },
      },
      interaction: { intersect: false, mode: 'nearest' },
      maintainAspectRatio: false,
    },
  });

  // Busca dados reais da API
  fetch('https://api.rodrigodatadesign.com.br/job-market/trends')
    .then(r => r.json())
    .then(data => {
      if (!data || !data.length) return;
      const brasil = data.filter(d => d.mercado === 'local_brasil');
      const global = data.filter(d => d.mercado === 'remoto_global');
      const meses = [...new Set(data.map(d => d.mes))].sort();
      const brasilMap = {};
      const globalMap = {};
      brasil.forEach(d => brasilMap[d.mes] = Number(d.total_vagas));
      global.forEach(d => globalMap[d.mes] = Number(d.total_vagas));
      chart.data.labels = meses;
      chart.data.datasets[0].data = meses.map(m => brasilMap[m] || 0);
      chart.data.datasets[1].data = meses.map(m => globalMap[m] || 0);
      chart.update();

      // Atualiza KPI total de vagas com soma real do trends
      const total = Object.values(brasilMap).reduce((a,b) => a+b, 0)
                  + Object.values(globalMap).reduce((a,b) => a+b, 0);
      const kpiEl = document.getElementById('kpi-total-vagas');
      if (kpiEl) kpiEl.textContent = total.toLocaleString('pt-BR');

      // Variação entre último e penúltimo mês
      if (meses.length >= 2) {
        const mesAtual = meses[meses.length - 1];
        const mesAnterior = meses[meses.length - 2];
        const totalAtual = (brasilMap[mesAtual] || 0) + (globalMap[mesAtual] || 0);
        const totalAnterior = (brasilMap[mesAnterior] || 0) + (globalMap[mesAnterior] || 0);
        if (totalAnterior > 0) {
          const variacao = Math.round((totalAtual - totalAnterior) / totalAnterior * 100);
          const badge = document.querySelector('#kpi-total-vagas')?.closest('.flex')?.querySelector('.rounded-full');
          if (badge) {
            badge.textContent = `${variacao > 0 ? '+' : ''}${variacao}%`;
            badge.style.backgroundColor = variacao >= 0 ? 'rgba(62,201,114,0.2)' : 'rgba(255,86,86,0.2)';
            badge.style.color = variacao >= 0 ? '#239f52' : '#E63939';
          }
        }
      }
    })
    .catch(e => console.warn('[Card01] API error:', e));

  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;
    } else {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;
    }
    chart.update('none');
  });
};
dashboardCard01();

// Init #dashboard-02 chart
const dashboardCard02 = () => {
  const ctx = document.getElementById('dashboard-card-02');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const tooltipBodyColor = { light: '#6B7280', dark: '#9CA3AF' };
  const tooltipBgColor = { light: '#ffffff', dark: '#374151' };
  const tooltipBorderColor = { light: '#E5E7EB', dark: '#4B5563' };

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          fill: true,
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            return chartAreaGradient(ctx, chartArea, [
              { stop: 0, color: `rgba(${hexToRGB('#8b5cf6')}, 0)` },
              { stop: 1, color: `rgba(${hexToRGB('#8b5cf6')}, 0.2)` }
            ]);
          },
          borderColor: '#8b5cf6',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: '#8b5cf6',
          pointHoverBackgroundColor: '#8b5cf6',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          clip: 20,
          tension: 0.2
        },
        {
          data: [],
          borderColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          clip: 20,
          tension: 0.2
        },
      ],
    },
    options: {
      layout: { padding: 20 },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { type: 'time', time: { parser: 'YYYY-MM', unit: 'month' }, display: false },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => false,
            label: (context) => `${context.parsed.y} skills`,
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
        legend: { display: false },
      },
      interaction: { intersect: false, mode: 'nearest' },
      maintainAspectRatio: false,
    },
  });

  // Busca dados reais da API
  fetch('https://api.rodrigodatadesign.com.br/job-market/skills-by-month')
    .then(r => r.json())
    .then(data => {
      if (!data || !data.length) return;
      const brasilMap = {};
      const globalMap = {};
      data.filter(d => d.mercado === 'local_brasil').forEach(d => brasilMap[d.mes] = Number(d.total_skills));
      data.filter(d => d.mercado === 'remoto_global').forEach(d => globalMap[d.mes] = Number(d.total_skills));
      const meses = [...new Set(data.map(d => d.mes))].sort();
      chart.data.labels = meses;
      chart.data.datasets[0].data = meses.map(m => brasilMap[m] || 0);
      chart.data.datasets[1].data = meses.map(m => globalMap[m] || 0);
      chart.update();

      // Atualiza KPI total de skills
      const total = Object.values(brasilMap).reduce((a,b) => a+b, 0)
                  + Object.values(globalMap).reduce((a,b) => a+b, 0);
      const kpiEl = document.getElementById('kpi-total-skills');
      if (kpiEl) kpiEl.textContent = total.toLocaleString('pt-BR');
    })
    .catch(e => console.warn('[Card02] API error:', e));

  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;
    } else {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;
    }
    chart.update('none');
  });
};
dashboardCard02();

// Init #dashboard-03 chart
const dashboardCard03 = () => {
  const ctx = document.getElementById('dashboard-card-03');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const tooltipBodyColor = { light: '#6B7280', dark: '#9CA3AF' };
  const tooltipBgColor = { light: '#ffffff', dark: '#374151' };
  const tooltipBorderColor = { light: '#E5E7EB', dark: '#4B5563' };

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          fill: true,
          backgroundColor: function(context) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return 'transparent';
            return chartAreaGradient(ctx, chartArea, [
              { stop: 0, color: `rgba(${hexToRGB('#2dd4bf')}, 0)` },
              { stop: 1, color: `rgba(${hexToRGB('#2dd4bf')}, 0.2)` }
            ]);
          },
          borderColor: '#2dd4bf',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: '#2dd4bf',
          pointHoverBackgroundColor: '#2dd4bf',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
          clip: 20,
          tension: 0.2
        },
        {
          data: [],
          borderColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointBackgroundColor: `rgba(${hexToRGB('#6B7280')}, 0.25)`,
          clip: 20,
          tension: 0.2
        },
      ],
    },
    options: {
      layout: { padding: 20 },
      scales: {
        y: { display: false, beginAtZero: false },
        x: { type: 'time', time: { parser: 'YYYY-MM', unit: 'month' }, display: false },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => false,
            label: (context) => `R$ ${Math.round(context.parsed.y / 12).toLocaleString('pt-BR')}`,
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
        legend: { display: false },
      },
      interaction: { intersect: false, mode: 'nearest' },
      maintainAspectRatio: false,
    },
  });

  // Busca evolução do salário médio BR por mês
  fetch('https://api.rodrigodatadesign.com.br/job-market/salary-trends')
    .then(r => r.json())
    .then(data => {
      if (!data || !data.length) return;
      const brasil = data.filter(d => d.mercado === 'local_brasil');
      const meses = brasil.map(d => d.mes).sort();
      const salarios = brasil.reduce((acc, d) => { acc[d.mes] = Number(d.salario_medio); return acc; }, {});
      chart.data.labels = meses;
      chart.data.datasets[0].data = meses.map(m => salarios[m] || null);
      // Linha cinza como referência (média geral)
      chart.update();
    })
    .catch(e => console.warn('[Card03] API error:', e));

  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;
    } else {
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;
    }
    chart.update('none');
  });
};
dashboardCard03();

// Init #dashboard-04 chart
const dashboardCard04 = () => {
  const ctx = document.getElementById('dashboard-card-04');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const textColor = { light: '#9CA3AF', dark: '#6B7280' };
  const gridColor = { light: '#F3F4F6', dark: `rgba(${hexToRGB('#374151')}, 0.6)` };
  const tooltipBodyColor = { light: '#6B7280', dark: '#9CA3AF' };
  const tooltipBgColor = { light: '#ffffff', dark: '#374151' };
  const tooltipBorderColor = { light: '#E5E7EB', dark: '#4B5563' };

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'SQL',
          data: [],
          backgroundColor: '#6366f1',
          hoverBackgroundColor: '#4f46e5',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          borderRadius: 4,
        },
        {
          label: 'Power BI',
          data: [],
          backgroundColor: '#8b5cf6',
          hoverBackgroundColor: '#7c3aed',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          borderRadius: 4,
        },
      ],
    },
    options: {
      layout: { padding: { top: 12, bottom: 16, left: 20, right: 20 } },
      scales: {
        y: {
          border: { display: false },
          ticks: { maxTicksLimit: 5, callback: (value) => Number(value).toLocaleString('pt-BR'), color: darkMode ? textColor.dark : textColor.light },
          grid: { color: darkMode ? gridColor.dark : gridColor.light },
        },
        x: {
          type: 'time',
          time: { parser: 'YYYY-MM', unit: 'month' },
adapters: {
  date: {
    locale: 'pt-BR',
  }
},
          border: { display: false },
          grid: { display: false },
          ticks: { 
  color: darkMode ? textColor.dark : textColor.light,
  callback: function(value) {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }
},
        },
      },
      plugins: {
        legend: { display: false },
        htmlLegend: { containerID: 'dashboard-card-04-legend' },
        tooltip: {
          callbacks: {
            title: () => false,
            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')} menções`,
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
      },
      interaction: { intersect: false, mode: 'nearest' },
      animation: { duration: 200 },
      maintainAspectRatio: false,
    },
    plugins: [{
      id: 'htmlLegend',
      afterUpdate(c, args, options) {
        const legendContainer = document.getElementById(options.containerID);
        const ul = legendContainer.querySelector('ul');
        if (!ul) return;
        while (ul.firstChild) ul.firstChild.remove();
        const items = c.options.plugins.legend.labels.generateLabels(c);
        items.forEach((item) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.style.display = 'inline-flex';
          button.style.alignItems = 'center';
          button.style.opacity = item.hidden ? '.3' : '';
          button.onclick = () => { c.setDatasetVisibility(item.datasetIndex, !c.isDatasetVisible(item.datasetIndex)); c.update(); };
          const box = document.createElement('span');
          box.style.display = 'block'; box.style.width = '12px'; box.style.height = '12px';
          box.style.borderRadius = '9999px'; box.style.marginRight = '8px';
          box.style.borderWidth = '3px'; box.style.borderColor = item.fillStyle;
          box.style.pointerEvents = 'none';
          const labelContainer = document.createElement('span');
          labelContainer.style.display = 'flex'; labelContainer.style.alignItems = 'center';
          const value = document.createElement('span');
          value.classList.add('text-gray-800', 'dark:text-gray-100');
          value.style.fontSize = '1.88rem'; value.style.lineHeight = '1.33';
          value.style.fontWeight = '700'; value.style.marginRight = '8px';
          value.style.pointerEvents = 'none';
          const label = document.createElement('span');
          label.classList.add('text-gray-500', 'dark:text-gray-400');
          label.style.fontSize = '0.875rem'; label.style.lineHeight = '1.5715';
          const theValue = c.data.datasets[item.datasetIndex].data.reduce((a, b) => a + b, 0);
          value.appendChild(document.createTextNode(theValue.toLocaleString('pt-BR')));
          label.appendChild(document.createTextNode(item.text));
          li.appendChild(button); button.appendChild(box); button.appendChild(labelContainer);
          labelContainer.appendChild(value); labelContainer.appendChild(label);
          ul.appendChild(li);
        });
      },
    }],
  });

  // Busca dados reais da API
  fetch('https://api.rodrigodatadesign.com.br/job-market/skills-trend')
    .then(r => r.json())
    .then(data => {
      if (!data || !data.length) return;
      const meses = [...new Set(data.map(d => d.mes))].sort();
      const skills = [...new Set(data.map(d => d.skill))];
      const top2 = skills.slice(0, 2);
      const colors = ['#6366f1', '#8b5cf6'];
      const hoverColors = ['#4f46e5', '#7c3aed'];

      chart.data.labels = meses;
      chart.data.datasets = top2.map((skill, i) => ({
        label: skill.toUpperCase(),
        data: meses.map(m => {
          const row = data.find(d => d.skill === skill && d.mes === m);
          return row ? Number(row.mencoes) : 0;
        }),
        backgroundColor: colors[i],
        hoverBackgroundColor: hoverColors[i],
        barPercentage: 0.7,
        categoryPercentage: 0.7,
        borderRadius: 4,
      }));
      chart.update();
    })
    .catch(e => console.warn('[Card04] API error:', e));

  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.scales.x.ticks.color = textColor.dark;
      chart.options.scales.y.ticks.color = textColor.dark;
      chart.options.scales.y.grid.color = gridColor.dark;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;
    } else {
      chart.options.scales.x.ticks.color = textColor.light;
      chart.options.scales.y.ticks.color = textColor.light;
      chart.options.scales.y.grid.color = gridColor.light;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;
    }
    chart.update('none');
  });
};
dashboardCard04();



// Init #dashboard-06 chart
const dashboardCard06 = () => {
  const ctx = document.getElementById('dashboard-card-06');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const tooltipTitleColor = {
    light: '#1F2937',
    dark: '#F3F4F6'
  };

  const tooltipBodyColor = {
    light: '#6B7280',
    dark: '#9CA3AF'
  };

  const tooltipBgColor = {
    light: '#ffffff',
    dark: '#374151'
  };

  const tooltipBorderColor = {
    light: '#E5E7EB',
    dark: '#4B5563'
  }; 

  // eslint-disable-next-line no-unused-vars
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['BI / Analytics', 'Eng. de Dados', 'Data Science', 'Product Design'],
      datasets: [
        {
          label: 'Vagas por Área',
          data: [
            52, 26, 12, 10,
          ],
          backgroundColor: [
            '#6366f1',
            '#8b5cf6',
            '#2dd4bf',
            '#f472b6',
          ],
          hoverBackgroundColor: [
            '#4f46e5',
            '#7c3aed',
            '#14b8a6',
            '#ec4899',
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: '80%',
      layout: {
        padding: 24,
      },
      plugins: {
        legend: {
          display: false,
        },
        htmlLegend: {
          // ID of the container to put the legend in
          containerID: 'dashboard-card-06-legend',
        },
        tooltip: {
          titleColor: darkMode ? tooltipTitleColor.dark : tooltipTitleColor.light,
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },        
      },
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      animation: {
        duration: 200,
      },
      maintainAspectRatio: false,
    },
    plugins: [{
      id: 'htmlLegend',
      afterUpdate(c, args, options) {
        const legendContainer = document.getElementById(options.containerID);
        const ul = legendContainer.querySelector('ul');
        if (!ul) return;
        // Remove old legend items
        while (ul.firstChild) {
          ul.firstChild.remove();
        }
        // Reuse the built-in legendItems generator
        const items = c.options.plugins.legend.labels.generateLabels(c);
        items.forEach((item) => {
          const li = document.createElement('li');
          li.style.margin = '4px';
          // Button element
          const button = document.createElement('button');
          button.classList.add('btn-xs', 'bg-white', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'shadow-sm', 'shadow-black/[0.08]', 'rounded-full');
          button.style.opacity = item.hidden ? '.3' : '';
          button.onclick = () => {
            c.toggleDataVisibility(item.index, !item.index);
            c.update();
          };
          // Color box
          const box = document.createElement('span');
          box.style.display = 'block';
          box.style.width = '8px';
          box.style.height = '8px';
          box.style.backgroundColor = item.fillStyle;
          box.style.borderRadius = '2px';
          box.style.marginRight = '4px';
          box.style.pointerEvents = 'none';
          // Label
          const label = document.createElement('span');
          label.style.display = 'flex';
          label.style.alignItems = 'center';
          const labelText = document.createTextNode(item.text);
          label.appendChild(labelText);
          li.appendChild(button);
          button.appendChild(box);
          button.appendChild(label);
          ul.appendChild(li);
        });
      },
    }],
  });
  
  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.plugins.tooltip.titleColor = tooltipTitleColor.dark;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;      
    } else {
      chart.options.plugins.tooltip.titleColor = tooltipTitleColor.light;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;      
    }
    chart.update('none');
  }); 
};
dashboardCard06();

// Init #dashboard-09 chart
const dashboardCard09 = () => {
  const ctx = document.getElementById('dashboard-card-09');
  if (!ctx) return;

  const darkMode = localStorage.getItem('dark-mode') === 'true';

  const textColor = { light: '#9CA3AF', dark: '#6B7280' };
  const gridColor = { light: '#F3F4F6', dark: `rgba(${hexToRGB('#374151')}, 0.6)` };
  const tooltipBodyColor = { light: '#6B7280', dark: '#9CA3AF' };
  const tooltipBgColor = { light: '#ffffff', dark: '#374151' };
  const tooltipBorderColor = { light: '#E5E7EB', dark: '#4B5563' };

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Sênior',
          data: [],
          backgroundColor: '#6366f1',
          hoverBackgroundColor: '#4f46e5',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          borderRadius: 4,
        },
        {
          label: 'Pleno',
          data: [],
          backgroundColor: '#8b5cf6',
          hoverBackgroundColor: '#7c3aed',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          borderRadius: 4,
        },
        {
          label: 'Júnior',
          data: [],
          backgroundColor: '#2dd4bf',
          hoverBackgroundColor: '#14b8a6',
          barPercentage: 0.7,
          categoryPercentage: 0.7,
          borderRadius: 4,
        },
      ],
    },
    options: {
      layout: { padding: { top: 12, bottom: 16, left: 20, right: 20 } },
      scales: {
        y: {
          stacked: true,
          border: { display: false },
          beginAtZero: true,
          ticks: {
            maxTicksLimit: 5,
            callback: (value) => Number(value).toLocaleString('pt-BR'),
            color: darkMode ? textColor.dark : textColor.light,
          },
          grid: { color: darkMode ? gridColor.dark : gridColor.light },
        },
        x: {
          stacked: true,
          type: 'time',
          time: { parser: 'YYYY-MM', unit: 'month' },
          border: { display: false },
          grid: { display: false },
          ticks: {
            autoSkipPadding: 48,
            maxRotation: 0,
            color: darkMode ? textColor.dark : textColor.light,
            callback: function(value) {
              const date = new Date(value);
              return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            }
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: () => false,
            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString('pt-BR')} vagas`,
          },
          bodyColor: darkMode ? tooltipBodyColor.dark : tooltipBodyColor.light,
          backgroundColor: darkMode ? tooltipBgColor.dark : tooltipBgColor.light,
          borderColor: darkMode ? tooltipBorderColor.dark : tooltipBorderColor.light,
        },
      },
      interaction: { intersect: false, mode: 'nearest' },
      animation: { duration: 200 },
      maintainAspectRatio: false,
    },
  });

  // Busca dados reais da API
  fetch('https://api.rodrigodatadesign.com.br/job-market/distribution-by-month')
    .then(r => r.json())
    .then(data => {
      if (!data || !data.length) return;

      const meses = [...new Set(data.map(d => d.mes))].sort();

      const getTotal = (mes, seniority) => {
        const row = data.find(d => d.mes === mes && d.seniority === seniority);
        return row ? Number(row.total_vagas) : 0;
      };

      chart.data.labels = meses;
      chart.data.datasets[0].data = meses.map(m => getTotal(m, 'Senior'));
      chart.data.datasets[1].data = meses.map(m => getTotal(m, 'Pleno'));
      chart.data.datasets[2].data = meses.map(m => getTotal(m, 'Junior'));
      chart.update();
    })
    .catch(e => console.warn('[Card09] API error:', e));

  document.addEventListener('darkMode', (e) => {
    const { mode } = e.detail;
    if (mode === 'on') {
      chart.options.scales.x.ticks.color = textColor.dark;
      chart.options.scales.y.ticks.color = textColor.dark;
      chart.options.scales.y.grid.color = gridColor.dark;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.dark;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.dark;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.dark;
    } else {
      chart.options.scales.x.ticks.color = textColor.light;
      chart.options.scales.y.ticks.color = textColor.light;
      chart.options.scales.y.grid.color = gridColor.light;
      chart.options.plugins.tooltip.bodyColor = tooltipBodyColor.light;
      chart.options.plugins.tooltip.backgroundColor = tooltipBgColor.light;
      chart.options.plugins.tooltip.borderColor = tooltipBorderColor.light;
    }
    chart.update('none');
  });
};
dashboardCard09();    