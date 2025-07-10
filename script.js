window.addEventListener('load', () => {
  let groupedData = {};
  let abaAtual = 'enxoval';

  const dataInicioInput = document.getElementById('dataInicio');
  const dataFimInput = document.getElementById('dataFim');
  const excelDataDiv = document.getElementById('excelData');
  const tituloTabela = document.getElementById('tituloTabela');

  // Mostrar mensagem inicial
  excelDataDiv.innerHTML = '<p>Carregando dados...</p>';

  function excelDateToJSDate(serial) {
    const utc_days = Math.floor(serial - 25569 + 1);
    const utc_value = utc_days * 86400 * 1000;
    return new Date(utc_value);
  }

  function formatDateBRFromDateObj(dateObj) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function parseDateBRToDateObj(dataStr) {
    const [day, month, year] = dataStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  function sortDatesBR(a, b) {
    return parseDateBRToDateObj(a) - parseDateBRToDateObj(b);
  }

  function filtrarEDesenharTabela() {
  const dataInicioVal = dataInicioInput.value
    ? new Date(dataInicioInput.value)
    : null;

  const dataFimVal = dataFimInput.value
    ? new Date(new Date(dataFimInput.value).setHours(23, 59, 59, 999))
    : null;

  if (!dataInicioVal && !dataFimVal) {
    excelDataDiv.innerHTML = '<p>Por favor, preencha o filtro de datas para exibir os dados.</p>';
    atualizarFechamento(0, 0, 0, 0);
    return;
  }

  const datasFiltradas = Object.keys(groupedData).filter(dataStr => {
    const dataObj = parseDateBRToDateObj(dataStr);
    if (dataInicioVal && dataObj < dataInicioVal) return false;
    if (dataFimVal && dataObj > dataFimVal) return false;
    return true;
  }).sort(sortDatesBR);

  if (datasFiltradas.length === 0) {
    excelDataDiv.innerHTML = '<p>Nenhum dado encontrado para o filtro selecionado.</p>';
    atualizarFechamento(0, 0, 0, 0);
    return;
  }

  const primeiroDia = datasFiltradas[0];
  const ultimoDia = datasFiltradas[datasFiltradas.length - 1];

  let html = `<table><thead>
    <tr>
      <th>Data</th>
      <th>Sujo (KG's)</th>
      <th>Limpo (KG's)</th>
      <th>Pendência c/ 10% (KG's)</th>
    </tr></thead><tbody>`;

  let totalSujo = 0;
  let totalLimpo = 0;
  let pendenciaTotalAcumulada = 0;

  datasFiltradas.forEach((dataAtual, i) => {
    const sujoVal = groupedData[dataAtual]?.sujo || 0;
    const limpoVal = groupedData[dataAtual]?.limpo || 0;

    let sujo = sujoVal > 0 ? sujoVal.toFixed(1).replace('.', ',') : '-';
    let limpo = limpoVal > 0 ? limpoVal.toFixed(1).replace('.', ',') : '-';
    let pendencia = '-';

    if (dataAtual === primeiroDia) limpo = '-';
    else if (dataAtual === ultimoDia) sujo = '-';

    if (i > 0) {
      const diaAnterior = datasFiltradas[i - 1];
      const sujoAnterior = groupedData[diaAnterior]?.sujo || 0;
      const pendenciaCalc = limpoVal - sujoAnterior * 0.9;
      pendencia = pendenciaCalc.toFixed(1).replace('.', ',');
    }

    html += `<tr>
      <td>${dataAtual}</td>
      <td>${sujo}</td>
      <td>${limpo}</td>
      <td>${pendencia}</td>
    </tr>`;

    if (sujo !== '-') totalSujo += sujoVal;
    if (limpo !== '-') totalLimpo += limpoVal;
    if (pendencia !== '-') pendenciaTotalAcumulada += parseFloat(pendencia.replace(',', '.'));
  });

  const pendenciaTotal = totalSujo - totalLimpo;
  const pendenciaTotalExibida = -pendenciaTotal;
  const pendenciaTotal10 = totalLimpo - totalSujo * 0.9;

  html += '</tbody></table>';
  excelDataDiv.innerHTML = html;

  atualizarFechamento(totalSujo, totalLimpo, pendenciaTotalExibida, pendenciaTotal10);
}

    const pendenciaTotal = totalSujo - totalLimpo;
    const pendenciaTotalExibida = -pendenciaTotal;
    const pendenciaTotal10 = totalLimpo - totalSujo * 0.9;

    html += '</tbody></table>';
    excelDataDiv.innerHTML = html;

    atualizarFechamento(totalSujo, totalLimpo, pendenciaTotalExibida, pendenciaTotal10);
  }

  function atualizarFechamento(sujo, limpo, pendencia, pendencia10) {
    const formatar = n => n.toFixed(1).replace('.', ',');
    const comSinal = n => `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n).toFixed(1).replace('.', ',')}`;

    document.getElementById('totalSujo').innerText = formatar(sujo);
    document.getElementById('totalLimpo').innerText = formatar(limpo);
    document.getElementById('pendenciaTotal').innerText = comSinal(pendencia);
    document.getElementById('pendenciaTotal10').innerText = comSinal(pendencia10);

    document.getElementById('pendenciaTotal').style.color = pendencia > 0 ? 'green' : pendencia < 0 ? 'red' : 'inherit';
    document.getElementById('pendenciaTotal10').style.color = pendencia10 > 0 ? 'green' : pendencia10 < 0 ? 'red' : 'inherit';
  }

  function carregarDadosDaAba(nomeAba) {
    excelDataDiv.innerHTML = '<p>Carregando dados...</p>';

    fetch(`dados/dados.xlsx?v=${Date.now()}`)
      .then(resp => {
        if (!resp.ok) throw new Error("Arquivo Excel não encontrado");
        return resp.arrayBuffer();
      })
      .then(data => {
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[nomeAba];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        groupedData = {};
        jsonData.forEach(row => {
          let data = row['DATA'];
          let dataFormatada = typeof data === 'number'
            ? formatDateBRFromDateObj(excelDateToJSDate(data))
            : data;

          const kg = parseFloat(row['KG TOTAL']) || 0;
          const tipo = row['ENVIO OU RETORNO?'].toLowerCase();

          if (!groupedData[dataFormatada]) {
            groupedData[dataFormatada] = { sujo: 0, limpo: 0 };
          }

          if (tipo.includes('enviado')) {
            groupedData[dataFormatada].sujo += kg;
          } else if (tipo.includes('recebido')) {
            groupedData[dataFormatada].limpo += kg;
          }
        });

        // Só desenha se filtro estiver preenchido
        if (dataInicioInput.value || dataFimInput.value) {
          filtrarEDesenharTabela();
        } else {
          excelDataDiv.innerHTML = '<p>Por favor, preencha o filtro de datas para exibir os dados.</p>';
          atualizarFechamento(0, 0, 0, 0);
        }
      })
      .catch(err => {
        excelDataDiv.innerText = 'Erro ao carregar a planilha.';
        console.error('Erro ao carregar Excel:', err);
      });
  }

  // Alternar abas
  document.querySelectorAll('input[name="relatorio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        abaAtual = radio.value;
        tituloTabela.textContent = `${radio.labels[0].textContent} - registros`;
        carregarDadosDaAba(abaAtual);
      }
    });
  });

  // Inicializar
  document.getElementById('rel-enxoval').checked = true;
  tituloTabela.textContent = 'Enxoval - registros';
  carregarDadosDaAba(abaAtual);

  // Filtros de data
  dataInicioInput.addEventListener('change', filtrarEDesenharTabela);
  dataFimInput.addEventListener('change', filtrarEDesenharTabela);

  // Exportar PDF com logo correta
  document.getElementById("btnExportarPDF").addEventListener("click", () => {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.add(isMobile ? 'print-mobile' : 'print-desktop');

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-mobile', 'print-desktop');
      }, 1000);
    }, 100);
  });

  // Exportar Excel
  document.getElementById("btnExportarExcel").addEventListener("click", () => {
    const tabela = document.querySelector("#excelData table");
    if (!tabela) return alert("Nenhuma tabela para exportar.");

    const linhas = Array.from(tabela.querySelectorAll("tr"));
    const dados = linhas.map(l => Array.from(l.querySelectorAll("th, td")).map(td => td.innerText));

    const worksheet = XLSX.utils.aoa_to_sheet(dados);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) cell.s = { alignment: { horizontal: "center", vertical: "center" } };
      }
    }

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 }
    ];

    const tipoRelatorio = abaAtual || "dados";
    const dataInicioStr = dataInicioInput.value?.replace(/-/g, '') || 'inicio';
    const dataFimStr = dataFimInput.value?.replace(/-/g, '') || 'fim';
    const nomeArquivo = `relatorio_${tipoRelatorio}_${dataInicioStr}_${dataFimStr}.xlsx`;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, nomeArquivo);
  });

  // Efeito glow
  const trackedElements = document.querySelectorAll('.tracked-glow');
  window.addEventListener('mousemove', e => {
    trackedElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--x', `${x}%`);
      el.style.setProperty('--y', `${y}%`);
    });
  });
});
