// cronograma.js

window.addEventListener('DOMContentLoaded', () => {
  const excelDataDiv = document.getElementById('excelData');
  const filtroTerminal = document.getElementById('filtroTerminal');
  const filtroEncarregada = document.getElementById('filtroEncarregada');
  const filtroMes = document.getElementById('filtroMes');
  const filtroData = document.getElementById('filtroData');

  let dadosOriginais = [];

  function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569 + 1);
    const utc_value = utc_days * 86400 * 1000;
    return new Date(utc_value);
  }

  function formatDateBR(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function parseDate(dataStr) {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function preencherOpcoes(select, valores, textoTodos = 'Todos') {
    const valorAtual = select.value;
    select.innerHTML = '';
    const optionPadrao = document.createElement('option');
    optionPadrao.value = '';
    optionPadrao.textContent = textoTodos;
    select.appendChild(optionPadrao);

    valores.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (v === valorAtual) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function atualizarFiltros() {
    const terminais = new Set();
    const datas = new Set();

    dadosOriginais.forEach(linha => {
      if (linha.TERMINAL) terminais.add(linha.TERMINAL);
      if (linha.DATA) datas.add(linha.DATA);
    });

    const datasUnicas = Array.from(datas).sort((a, b) => parseDate(a) - parseDate(b));
    preencherOpcoes(filtroTerminal, [...terminais]);

    // Define mês atual
    const mesAtual = new Date().getMonth(); // 0 = janeiro
    filtroMes.value = mesAtual.toString();

    atualizarFiltroDataPorMes(datasUnicas);
    atualizarFiltroEncarregada();
  }

  function atualizarFiltroDataPorMes(datasUnicas) {
    const mesSelecionado = filtroMes.value;
    let datasDoMesSelecionado = datasUnicas;

    if (mesSelecionado !== '') {
      datasDoMesSelecionado = datasUnicas.filter(dataStr => {
        const [dia, mes, ano] = dataStr.split('/').map(Number);
        return mes - 1 === parseInt(mesSelecionado);
      });
    }

    preencherOpcoes(filtroData, datasDoMesSelecionado, 'Todas');
  }

  function atualizarFiltroEncarregada() {
    const mesSelecionado = filtroMes.value;
    let dadosFiltrados = dadosOriginais;

    if (mesSelecionado !== '') {
      dadosFiltrados = dadosOriginais.filter(linha => parseDate(linha.DATA).getMonth() === parseInt(mesSelecionado));
    }

    const encarregadas = new Set(dadosFiltrados.map(l => l.ENCARREGADA).filter(e => e));
    preencherOpcoes(filtroEncarregada, [...encarregadas]);
  }

  function aplicarFiltros() {
    const terminal = filtroTerminal.value;
    const encarregada = filtroEncarregada.value;
    const mesSelecionado = filtroMes.value;
    const dataSelecionada = filtroData.value;

    const dadosFiltrados = dadosOriginais.filter(linha => {
      const condTerminal = terminal === '' || linha.TERMINAL === terminal;
      const condEncarregada = encarregada === '' || linha.ENCARREGADA === encarregada;
      const condMes = mesSelecionado === '' || parseDate(linha.DATA).getMonth() === parseInt(mesSelecionado);
      const condData = dataSelecionada === '' || linha.DATA === dataSelecionada;
      return condTerminal && condEncarregada && condMes && condData;
    });

    desenharTabela(dadosFiltrados);
  }

  function desenharTabela(dados) {
    if (dados.length === 0) {
      excelDataDiv.innerHTML = '<p>Nenhum dado encontrado.</p>';
      return;
    }

    let html = `<table><thead><tr><th>DATA</th><th>TERMINAL</th><th>ENC.</th></tr></thead><tbody>`;
    dados.forEach(linha => {
      html += `<tr><td>${linha.DATA}</td><td>${linha.TERMINAL}</td><td>${linha.ENCARREGADA}</td></tr>`;
    });
    html += '</tbody></table>';
    excelDataDiv.innerHTML = html;
  }

  function carregarExcel() {
    fetch('dados/cronograma.xlsx')
      .then(resp => {
        if (!resp.ok) throw new Error("Arquivo Excel não encontrado");
        return resp.arrayBuffer();
      })
      .then(data => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        dadosOriginais = json.map(row => {
          let dataFormatada = row['DATA'];
          if (typeof dataFormatada === 'number') {
            dataFormatada = formatDateBR(excelDateToJSDate(dataFormatada));
          }
          return {
            DATA: dataFormatada,
            TERMINAL: row['TERMINAL'] || '',
            ENCARREGADA: row['ENCARREGADA'] || ''
          };
        });

        atualizarFiltros();
        aplicarFiltros();
      })
      .catch(err => {
        console.error('Erro ao carregar Excel:', err);
        excelDataDiv.innerText = 'Erro ao carregar a planilha.';
      });
  }

  // Eventos
  filtroTerminal.addEventListener('change', aplicarFiltros);
  filtroEncarregada.addEventListener('change', aplicarFiltros);
  filtroMes.addEventListener('change', () => {
    const datas = new Set(dadosOriginais.map(l => l.DATA));
    atualizarFiltroDataPorMes(Array.from(datas).sort((a, b) => parseDate(a) - parseDate(b)));
    atualizarFiltroEncarregada();
    aplicarFiltros();
  });
  filtroData.addEventListener('change', aplicarFiltros);

  // Botões de limpar (ícones de borracha)
  document.querySelectorAll('.clear-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const select = document.getElementById(targetId);
      if (select) {
        select.value = '';
        select.dispatchEvent(new Event('change'));
      }
    });
  });

  carregarExcel();
});
