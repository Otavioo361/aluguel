const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let bancoDeDados = JSON.parse(localStorage.getItem('controle_aluguel_v3')) || {};
let meuGrafico = null;

function salvarPreferencias() {
  const ano = document.getElementById('anoSelect').value;
  const mesIndex = document.getElementById('mesSelect').value;
  const abaAtivaElement = document.querySelector('.tab-content.active');
  const abaAtiva = abaAtivaElement ? abaAtivaElement.id : 'abaAlugueis';
  localStorage.setItem('preferencias_visualizacao', JSON.stringify({ ano, mesIndex, abaAtiva }));
}

function abrirAba(idAba, botaoClicado) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  document.getElementById(idAba).classList.add('active');
  botaoClicado.classList.add('active');
  salvarPreferencias();
}

function inicializarInterface() {
  const selectAno = document.getElementById('anoSelect');
  const selectMes = document.getElementById('mesSelect');
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();
  
  for (let ano = 2024; ano <= 2035; ano++) {
    const option = document.createElement('option');
    option.value = ano; option.textContent = ano;
    selectAno.appendChild(option);
  }

  const prefsSalvas = JSON.parse(localStorage.getItem('preferencias_visualizacao')) || {};
  selectAno.value = prefsSalvas.ano ? prefsSalvas.ano : anoAtual;
  selectMes.value = prefsSalvas.mesIndex !== undefined ? prefsSalvas.mesIndex : dataAtual.getMonth();

  if (prefsSalvas.abaAtiva) {
    const botaoAba = document.querySelector('button[onclick*="' + prefsSalvas.abaAtiva + '"]');
    if (botaoAba) abrirAba(prefsSalvas.abaAtiva, botaoAba);
  }
}

function ObterChaveAtual() {
  return document.getElementById('anoSelect').value + '_' + document.getElementById('mesSelect').value;
}

function carregarData() {
  salvarPreferencias(); 
  const chave = ObterChaveAtual();
  const tabelaUnidades = document.getElementById('tabelaCorpoUnidades');
  const tabelaGastos = document.getElementById('tabelaCorpoGastos');

  tabelaUnidades.innerHTML = '';
  tabelaGastos.innerHTML = '';

  if (!bancoDeDados[chave]) {
    bancoDeDados[chave] = { unidades: [], gastos: [], linkDrive: '' };
  }

  document.getElementById('linkDrive').value = bancoDeDados[chave].linkDrive || '';

  if (bancoDeDados[chave].unidades.length === 0) {
    adicionarLinhaUnidade();
  } else {
    bancoDeDados[chave].unidades.forEach(item => {
      let val1 = item.valor1 !== undefined ? item.valor1 : item.valor;
      let m1 = item.modo1 || item.modo || 'Dinheiro';
      
      adicionarLinhaUnidadeComDados(
        item.apt, item.morador, item.valor, item.dataPagto || '', 
        item.pago, item.impresso, val1, m1, item.valor2 || '', item.modo2 || '', 
        item.salvoDrive || false, item.nomePix1 || '', item.nomePix2 || ''
      );
    });
  }

  if (bancoDeDados[chave].gastos.length === 0) {
    adicionarLinhaGasto();
  } else {
    bancoDeDados[chave].gastos.forEach(gasto => {
      adicionarLinhaGastoComDados(gasto.nome, gasto.valor);
    });
  }

  calcularTotais();
  renderizarAbaComprovantes();
}

function adicionarLinhaUnidade() {
  adicionarLinhaUnidadeComDados('', '', '', '', false, false, '', 'Dinheiro', '', '', false, '', '');
}

function adicionarLinhaUnidadeComDados(apt = '', morador = '', valorTotal = '', dataPagto = '', pago = false, impresso = false, valor1 = '', modo1 = 'Dinheiro', valor2 = '', modo2 = '', salvoDrive = false, nomePix1 = '', nomePix2 = '') {
  const tabela = document.getElementById('tabelaCorpoUnidades');
  const tr = document.createElement('tr');

  if (pago) tr.classList.add('linha-paga');

  // Amarramos as informações ocultas na linha para não se perderem ao excluir ou mover
  tr.setAttribute('data-salvodrive', salvoDrive);
  tr.setAttribute('data-nomepix1', nomePix1);
  tr.setAttribute('data-nomepix2', nomePix2);

  let htmlLinha = '<td><input type="text" placeholder="Apt 101" value="' + apt + '" oninput="salvarEstado()"><\/td>';
  htmlLinha += '<td><input type="text" placeholder="Nome" value="' + morador + '" oninput="salvarEstado()"><\/td>';
  
  htmlLinha += '<td><input type="number" step="0.01" class="valor-total" placeholder="1500.00" value="' + valorTotal + '" oninput="salvarEstado();"><\/td>';

  htmlLinha += '<td>';
  htmlLinha += '<div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #ccc;">';
  htmlLinha += '<div style="display:flex; gap:4px; align-items:center;">';
  htmlLinha += '<span style="font-size:10px; font-weight:bold;">1:<\/span>';
  htmlLinha += '<input type="number" step="0.01" class="valor-1" placeholder="R$" value="' + valor1 + '" oninput="salvarEstado(); calcularTotais();" style="width: 65px;">';
  htmlLinha += '<select class="modo-1" onchange="alterarModoPagamento(this, 1); salvarEstado(); calcularTotais();" style="width: 75px;">';
  htmlLinha += '<option value="Dinheiro" ' + (modo1 === 'Dinheiro' ? 'selected' : '') + '>Dinheiro<\/option>';
  htmlLinha += '<option value="Pix" ' + (modo1 === 'Pix' ? 'selected' : '') + '>Pix<\/option>';
  htmlLinha += '<option value="Cheque" ' + (modo1 === 'Cheque' ? 'selected' : '') + '>Cheque<\/option>';
  htmlLinha += '<option value="Cartão" ' + (modo1 === 'Cartão' ? 'selected' : '') + '>Cartão<\/option>';
  htmlLinha += '<option value="Boleto" ' + (modo1 === 'Boleto' ? 'selected' : '') + '>Boleto<\/option>';
  htmlLinha += '<\/select><\/div><div class="pix-area-1"><\/div><\/div>';
  
  htmlLinha += '<div style="display:flex; gap:4px; align-items:center;">';
  htmlLinha += '<span style="font-size:10px; font-weight:bold;">2:<\/span>';
  htmlLinha += '<input type="number" step="0.01" class="valor-2" placeholder="R$" value="' + valor2 + '" oninput="salvarEstado(); calcularTotais();" style="width: 65px;">';
  htmlLinha += '<select class="modo-2" onchange="alterarModoPagamento(this, 2); salvarEstado(); calcularTotais();" style="width: 75px;">';
  htmlLinha += '<option value="" ' + (modo2 === '' ? 'selected' : '') + '>Nenhum<\/option>';
  htmlLinha += '<option value="Dinheiro" ' + (modo2 === 'Dinheiro' ? 'selected' : '') + '>Dinheiro<\/option>';
  htmlLinha += '<option value="Pix" ' + (modo2 === 'Pix' ? 'selected' : '') + '>Pix<\/option>';
  htmlLinha += '<option value="Cheque" ' + (modo2 === 'Cheque' ? 'selected' : '') + '>Cheque<\/option>';
  htmlLinha += '<option value="Cartão" ' + (modo2 === 'Cartão' ? 'selected' : '') + '>Cartão<\/option>';
  htmlLinha += '<option value="Boleto" ' + (modo2 === 'Boleto' ? 'selected' : '') + '>Boleto<\/option>';
  htmlLinha += '<\/select><\/div><div class="pix-area-2"><\/div>';
  htmlLinha += '<\/td>';
  
  htmlLinha += '<td><input type="date" value="' + dataPagto + '" onchange="salvarEstado()"><\/td>';
  
  htmlLinha += '<td><div class="status-container"><input type="checkbox" class="check-pago" ' + (pago ? 'checked' : '') + ' onchange="atualizarStatusPago(this); salvarEstado(); calcularTotais();">';
  htmlLinha += '<span class="status-texto ' + (pago ? 'status-pago' : 'status-pendente') + '">' + (pago ? 'Pago' : 'Pendente') + '<\/span><\/div><\/td>';
  
  htmlLinha += '<td><div class="status-container"><input type="checkbox" class="check-impresso" ' + (impresso ? 'checked' : '') + ' onchange="atualizarStatusImpresso(this); salvarEstado();">';
  htmlLinha += '<span class="status-texto ' + (impresso ? 'status-pago' : 'status-pendente') + '">' + (impresso ? 'Sim' : 'Não') + '<\/span><\/div><\/td>';

  htmlLinha += '<td class="no-print"><div class="acoes-cell"><button class="btn-recibo" onclick="gerarReciboLinha(this)">📜 Recibo<\/button>';
  htmlLinha += '<button class="btn-danger" onclick="removerLinha(this)">Excluir<\/button><\/div><\/td>';

  tr.innerHTML = htmlLinha;
  tabela.appendChild(tr);
  
  alterarModoPagamento(tr.querySelector('.modo-1'), 1);
  alterarModoPagamento(tr.querySelector('.modo-2'), 2);
}

function adicionarLinhaGasto() { adicionarLinhaGastoComDados('', ''); }

function adicionarLinhaGastoComDados(nome = '', valor = '') {
  const tabela = document.getElementById('tabelaCorpoGastos');
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><input type="text" placeholder="Ex: Conta de Luz" value="' + nome + '" oninput="salvarEstado()"><\/td>' +
                 '<td><input type="number" step="0.01" class="gasto-valor" placeholder="250.00" value="' + valor + '" oninput="salvarEstado(); calcularTotais();"><\/td>' +
                 '<td class="no-print"><button class="btn-danger" onclick="removerLinha(this)">Excluir<\/button><\/td>';
  tabela.appendChild(tr);
}

function atualizarStatusPago(checkbox) {
  const tr = checkbox.closest('tr');
  const statusTexto = checkbox.nextElementSibling;
  if (checkbox.checked) {
    tr.classList.add('linha-paga');
    statusTexto.textContent = 'Pago';
    statusTexto.className = 'status-texto status-pago';
  } else {
    tr.classList.remove('linha-paga');
    statusTexto.textContent = 'Pendente';
    statusTexto.className = 'status-texto status-pendente';
  }
}

function atualizarStatusImpresso(checkbox) {
  const statusTexto = checkbox.nextElementSibling;
  if (checkbox.checked) {
    statusTexto.textContent = 'Sim';
    statusTexto.className = 'status-texto status-pago';
  } else {
    statusTexto.textContent = 'Não';
    statusTexto.className = 'status-texto status-pendente';
  }
}

// Atualizada: Removeu o input file. Apenas exibe a mensagem amigável.
function alterarModoPagamento(selectElement, numParte) {
  const td = selectElement.closest('td');
  const pixArea = td.querySelector('.pix-area-' + numParte);

  if (selectElement.value === 'Pix') {
    pixArea.innerHTML = '<div class="pix-container"><span class="info-badge no-print" style="color: #2980b9; font-weight: bold;">👉 Conferir na aba Comprovantes<\/span><\/div>';
  } else {
    pixArea.innerHTML = '';
  }
  
  renderizarAbaComprovantes();
}

function removerLinha(btn) {
  const tr = btn.closest('tr');
  tr.remove();
  salvarEstado();
  calcularTotais();
  renderizarAbaComprovantes();
}

// ----------------------------------------------------
// LÓGICA DA ABA DE COMPROVANTES E GOOGLE DRIVE
// ----------------------------------------------------

function abrirDrive() {
  const link = document.getElementById('linkDrive').value;
  if (link && link.startsWith('http')) {
    window.open(link, '_blank');
  } else {
    alert('Por favor, cole um link válido do Google Drive primeiro!');
  }
}

function atualizarNomePix(index, parte, novoNome) {
  const linhasUnidades = document.querySelectorAll('#tabelaCorpoUnidades tr');
  if (linhasUnidades[index]) {
    linhasUnidades[index].setAttribute('data-nomepix' + parte, novoNome);
    salvarEstado();
  }
}

function renderizarAbaComprovantes() {
  const tabela = document.getElementById('tabelaCorpoComprovantes');
  tabela.innerHTML = '';
  
  const mesIndex = document.getElementById('mesSelect').value;
  const ano = document.getElementById('anoSelect').value;
  const nomeMes = nomesMeses[mesIndex];

  const linhasUnidades = document.querySelectorAll('#tabelaCorpoUnidades tr');

  linhasUnidades.forEach((linha, index) => {
    const modo1 = linha.querySelector('.modo-1').value;
    const modo2 = linha.querySelector('.modo-2').value;

    if (modo1 === 'Pix' || modo2 === 'Pix') {
      const inputsTexto = linha.querySelectorAll('input[type="text"]');
      const apt = inputsTexto[0].value || 'Unidade';
      const morador = inputsTexto[1].value || 'Morador';
      
      const salvo = linha.getAttribute('data-salvodrive') === 'true';

      let inputsHtml = '';
      if (modo1 === 'Pix') {
        let nome1 = linha.getAttribute('data-nomepix1');
        if (!nome1) nome1 = '[PIX-P1-' + nomeMes + '-' + ano + ']_' + apt + '_' + morador;
        inputsHtml += '<input type="text" value="' + nome1 + '" onchange="atualizarNomePix(' + index + ', 1, this.value)" style="width: 100%; margin-bottom: 5px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; padding: 4px; border-radius: 3px;" placeholder="Nome do arquivo no drive">';
      }
      if (modo2 === 'Pix') {
        let nome2 = linha.getAttribute('data-nomepix2');
        if (!nome2) nome2 = '[PIX-P2-' + nomeMes + '-' + ano + ']_' + apt + '_' + morador;
        inputsHtml += '<input type="text" value="' + nome2 + '" onchange="atualizarNomePix(' + index + ', 2, this.value)" style="width: 100%; font-family: monospace; font-size: 12px; border: 1px solid #ccc; padding: 4px; border-radius: 3px;" placeholder="Nome do arquivo no drive">';
      }

      const tr = document.createElement('tr');
      
      let html = '<td>' + apt + '<\/td>';
      html += '<td>' + morador + '<\/td>';
      html += '<td>' + inputsHtml + '<\/td>'; 
      
      html += '<td><div class="status-container"><input type="checkbox" ' + (salvo ? 'checked' : '') + ' onchange="marcarDrive(' + index + ', this.checked)">';
      html += '<span class="status-texto ' + (salvo ? 'status-pago' : 'status-pendente') + '">' + (salvo ? 'Sim' : 'Não') + '<\/span><\/div><\/td>';
      
      tr.innerHTML = html;
      tabela.appendChild(tr);
    }
  });
}

function marcarDrive(indexUnidade, isChecked) {
  const linhasUnidades = document.querySelectorAll('#tabelaCorpoUnidades tr');
  if (linhasUnidades[indexUnidade]) {
    linhasUnidades[indexUnidade].setAttribute('data-salvodrive', isChecked);
    salvarEstado();
    renderizarAbaComprovantes(); 
  }
}

// ----------------------------------------------------

function salvarEstado() {
  const chave = ObterChaveAtual();
  const unidades = [];
  
  document.querySelectorAll('#tabelaCorpoUnidades tr').forEach(linha => {
    const inputsTexto = linha.querySelectorAll('input[type="text"]');
    const apt = inputsTexto[0] ? inputsTexto[0].value : '';
    const morador = inputsTexto[1] ? inputsTexto[1].value : '';
    
    const valorTotal = linha.querySelector('.valor-total') ? linha.querySelector('.valor-total').value : '';
    const valor1 = linha.querySelector('.valor-1') ? linha.querySelector('.valor-1').value : '';
    const modo1 = linha.querySelector('.modo-1') ? linha.querySelector('.modo-1').value : 'Dinheiro';
    const valor2 = linha.querySelector('.valor-2') ? linha.querySelector('.valor-2').value : '';
    const modo2 = linha.querySelector('.modo-2') ? linha.querySelector('.modo-2').value : '';
    
    const dataPagto = linha.querySelector('input[type="date"]') ? linha.querySelector('input[type="date"]').value : '';
    
    const pago = linha.querySelector('.check-pago') ? linha.querySelector('.check-pago').checked : false;
    const impresso = linha.querySelector('.check-impresso') ? linha.querySelector('.check-impresso').checked : false;
    
    const salvoDrive = linha.getAttribute('data-salvodrive') === 'true';
    const nomePix1 = linha.getAttribute('data-nomepix1') || '';
    const nomePix2 = linha.getAttribute('data-nomepix2') || '';

    if (apt || morador || valorTotal || valor1 || valor2) {
      unidades.push({ apt, morador, valor: valorTotal, valor1, modo1, valor2, modo2, dataPagto, modo: modo1, pago, impresso, salvoDrive, nomePix1, nomePix2 });
    }
  });

  const gastos = [];
  document.querySelectorAll('#tabelaCorpoGastos tr').forEach(linha => {
    const nome = linha.querySelector('input[type="text"]') ? linha.querySelector('input[type="text"]').value : '';
    const valor = linha.querySelector('.gasto-valor') ? linha.querySelector('.gasto-valor').value : '';
    if (nome || valor) gastos.push({ nome, valor });
  });

  const linkDrive = document.getElementById('linkDrive').value;

  bancoDeDados[chave] = { unidades, gastos, linkDrive };
  localStorage.setItem('controle_aluguel_v3', JSON.stringify(bancoDeDados));
}

function calcularTotais() {
  let totalDinheiro = 0, totalPix = 0, totalCheque = 0, totalReceitaPaga = 0, totalGastos = 0;

  document.querySelectorAll('#tabelaCorpoUnidades tr').forEach(linha => {
    const pago = linha.querySelector('.check-pago') ? linha.querySelector('.check-pago').checked : false;
    const v1 = parseFloat(linha.querySelector('.valor-1').value) || 0;
    const m1 = linha.querySelector('.modo-1').value;
    const v2 = parseFloat(linha.querySelector('.valor-2').value) || 0;
    const m2 = linha.querySelector('.modo-2').value;

    if (pago) {
      totalReceitaPaga += (v1 + v2);
      if (m1 === 'Dinheiro') totalDinheiro += v1;
      else if (m1 === 'Pix') totalPix += v1;
      else if (m1 === 'Cheque') totalCheque += v1;
      
      if (m2 === 'Dinheiro') totalDinheiro += v2;
      else if (m2 === 'Pix') totalPix += v2;
      else if (m2 === 'Cheque') totalCheque += v2;
    }
  });

  document.querySelectorAll('#tabelaCorpoGastos tr').forEach(linha => {
    const valor = parseFloat(linha.querySelector('.gasto-valor').value) || 0;
    totalGastos += valor;
  });

  const saldoFinal = totalReceitaPaga - totalGastos;

  document.getElementById('resumoDinheiro').textContent = formatarMoeda(totalDinheiro);
  document.getElementById('resumoPix').textContent = formatarMoeda(totalPix);
  document.getElementById('resumoCheque').textContent = formatarMoeda(totalCheque);
  document.getElementById('resumoReceita').textContent = formatarMoeda(totalReceitaPaga);
  document.getElementById('resumoGastos').textContent = formatarMoeda(totalGastos);
  document.getElementById('resumoSaldo').textContent = formatarMoeda(saldoFinal);

  const elSaldo = document.getElementById('resumoSaldo');
  if (saldoFinal < 0) elSaldo.style.color = '#e74c3c';
  else elSaldo.style.color = '#27ae60';

  atualizarGraficoPizza(totalDinheiro, totalPix, totalCheque, totalGastos);
}

function atualizarGraficoPizza(dinheiro, pix, cheque, gastos) {
  const ctx = document.getElementById('graficoPizza').getContext('2d');
  if (meuGrafico) meuGrafico.destroy();

  meuGrafico = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Dinheiro', 'Pix', 'Cheque', 'Gastos'],
      datasets: [{
        data: [dinheiro, pix, cheque, gastos],
        backgroundColor: ['#f1c40f', '#3498db', '#e67e22', '#e74c3c'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Distribuição Financeira' } }
    }
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function numeroParaExtenso(valor) {
  if (!valor || valor <= 0) return "zero reais";
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converterBloco(n) {
    if (n === 100) return "cem";
    let c = Math.floor(n / 100);
    let d = Math.floor((n % 100) / 10);
    let u = n % 10;
    let str = "";
    if (c > 0) str += centenas[c];
    if (d === 1) str += (str ? " e " : "") + especiais[u];
    else {
      if (d > 0) str += (str ? " e " : "") + dezenas[d];
      if (u > 0) str += (str ? " e " : "") + unidades[u];
    }
    return str;
  }

  let formatado = parseFloat(valor).toFixed(2).split('.');
  let inteiro = Number(formatado[0]);
  let centavos = formatado[1] ? Number(formatado[1]) : 0;
  let res = "";

  if (inteiro > 0) {
    let mil = Math.floor(inteiro / 1000);
    let resto = inteiro % 1000;
    if (mil > 0) res += (mil === 1 ? "um mil" : converterBloco(mil) + " mil");
    if (resto > 0) res += (res ? " e " : "") + converterBloco(resto);
    res += (inteiro === 1 ? " real" : " reais");
  }

  if (centavos > 0) {
    let textCentavos = converterBloco(centavos) + (centavos === 1 ? " centavo" : " centavos");
    res += (res ? " e " : "") + textCentavos;
  }
  return res;
}

function gerarReciboLinha(btn) {
  const tr = btn.closest('tr');
  const inputsTexto = tr.querySelectorAll('input[type="text"]');
  
  const nomeApt = inputsTexto[0].value || 'Residencial Clemenceau';
  const morador = inputsTexto[1].value || '___________________________';
  
  const v1 = parseFloat(tr.querySelector('.valor-1').value) || 0;
  const v2 = parseFloat(tr.querySelector('.valor-2').value) || 0;
  const valorTotalParaRecibo = v1 + v2;
  
  const valorFormatado = formatarMoeda(valorTotalParaRecibo);
  const valorExtenso = numeroParaExtenso(valorTotalParaRecibo);

  const dataInput = tr.querySelector('input[type="date"]').value;
  let dataFormatada = '____/____/________';
  if (dataInput) {
    const partes = dataInput.split('-');
    dataFormatada = partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  const mesIndex = document.getElementById('mesSelect').value;
  const anoSelect = document.getElementById('anoSelect').value;
  const nomeMes = nomesMeses[mesIndex];

  const janelaRecibo = window.open('', '_blank', 'width=800,height=600');
  
  let htmlRecibo = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo de Aluguel<\/title>';
  htmlRecibo += '<style>body{font-family:Arial,sans-serif;padding:40px;color:#000}.recibo-box{border:2px solid #000;padding:30px;max-width:700px;margin:0 auto;border-radius:6px}h2{text-align:center;margin-top:0;text-transform:uppercase;letter-spacing:1px;text-decoration:underline}.conteudo{font-size:16px;line-height:1.8;margin-top:25px;text-align:justify}.campo-linha{margin-top:15px;font-weight:bold}.rodape{margin-top:40px;font-style:italic}.assinatura{margin-top:60px;text-align:center}.linha-assinatura{border-top:1px solid #000;width:300px;margin:0 auto 5px auto}@media print{button{display:none}}<\/style><\/head><body>';
  
  htmlRecibo += '<div class="recibo-box"><h2>RECIBO DE ALUGUEL<\/h2><div class="conteudo">';
  htmlRecibo += 'Recebi(emos) de <b>' + morador + '<\/b>, inquilino, a quantia de <b>' + valorFormatado + ' (' + valorExtenso + ')<\/b>, referente ao pagamento do aluguel mensal do <b>' + nomeApt + '<\/b>.<\/div>';
  
  htmlRecibo += '<div class="campo-linha">Data do pagamento: <u>' + dataFormatada + '<\/u><\/div>';
  htmlRecibo += '<div class="campo-linha">Referente ao mês de: <u>' + nomeMes + ' / ' + anoSelect + '<\/u><\/div>';
  htmlRecibo += '<div class="rodape">Declaro que o valor acima foi pago integralmente.<\/div>';
  htmlRecibo += '<div class="assinatura"><div class="linha-assinatura"><\/div><span>Assinatura do Locador / Administrador<\/span><\/div><\/div><br>';
  htmlRecibo += '<div style="text-align:center;"><button onclick="window.print()" style="padding:10px 20px;font-size:16px;cursor:pointer;background:#27ae60;color:#fff;border:none;border-radius:4px;">🖨️ Imprimir / Salvar PDF<\/button><\/div><\/body><\/html>';

  janelaRecibo.document.write(htmlRecibo);
  janelaRecibo.document.close();
  
  const checkImpresso = tr.querySelector('.check-impresso');
  if (checkImpresso && !checkImpresso.checked) {
    checkImpresso.checked = true;
    atualizarStatusImpresso(checkImpresso);
    salvarEstado();
  }
}

function duplicarParaMesesSeguintes() {
  const ano = document.getElementById('anoSelect').value;
  const mesIndex = parseInt(document.getElementById('mesSelect').value);
  const chaveAtual = ObterChaveAtual();
  salvarEstado();

  const dadosOrigem = bancoDeDados[chaveAtual];
  if (!dadosOrigem || dadosOrigem.unidades.length === 0) {
    alert("Não há imóveis cadastrados neste mês para copiar."); return;
  }
  if (mesIndex === 11) { alert("Você já está em Dezembro."); return; }

  const nomeMesAtual = nomesMeses[mesIndex];
  if (confirm('Deseja copiar a lista de imóveis/valores de ' + nomeMesAtual + ' para os meses SEGUINTES de ' + ano + '?')) {
    for (let m = mesIndex + 1; m < 12; m++) {
      const chaveDestino = ano + '_' + m;
      if (!bancoDeDados[chaveDestino]) bancoDeDados[chaveDestino] = { unidades: [], gastos: [], linkDrive: '' };

      bancoDeDados[chaveDestino].unidades = dadosOrigem.unidades.map(function(item) {
        return {
          apt: item.apt, morador: item.morador, valor: item.valor,
          valor1: item.valor1, modo1: item.modo1,
          valor2: item.valor2, modo2: item.modo2,
          dataPagto: '', pago: false, impresso: false, salvoDrive: false, nomePix1: '', nomePix2: ''
        };
      });
    }
    localStorage.setItem('controle_aluguel_v3', JSON.stringify(bancoDeDados));
    alert('Os imóveis foram copiados com sucesso para os meses seguintes!');
  }
}

function gerarPDF() {
  salvarEstado();
  const mesIndex = document.getElementById('mesSelect').value;
  const ano = document.getElementById('anoSelect').value;
  const nomeMes = nomesMeses[mesIndex];

  const conteudos = document.querySelectorAll('.tab-content');
  conteudos.forEach(c => c.style.display = 'block');
  const elemento = document.getElementById('areaRelatorio');

  const opt = {
    margin: [10, 10, 10, 10], filename: 'Relatorio_Aluguel_' + nomeMes + '_' + ano + '.pdf',
    image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(elemento).save().then(() => {
    const abaAtiva = document.querySelector('.tab-button.active');
    if (abaAtiva) {
      const matchResult = abaAtiva.getAttribute('onclick').match(/'([^']+)'/);
      if(matchResult) abrirAba(matchResult[1], abaAtiva);
    }
  });
}

function exportarDadosNuvem() {
  salvarEstado();
  const dados = localStorage.getItem('controle_aluguel_v3');
  if (!dados || dados === '{}') { alert('Não há dados para exportar.'); return; }
  
  const blob = new Blob([dados], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dados.json';
  a.click();
  URL.revokeObjectURL(url);
  alert("Arquivo baixado! Coloque este arquivo 'dados.json' na pasta do seu projeto e faça o PUSH para o GitHub.");
}

async function sincronizarDoGitHub() {
  try {
    const urlBusca = 'dados.json?nocache=' + new Date().getTime();
    const resposta = await fetch(urlBusca);
    if (!resposta.ok) { alert("Ainda não existe um arquivo 'dados.json' no seu GitHub."); return; }
    const dadosNuvem = await resposta.json();
    localStorage.setItem('controle_aluguel_v3', JSON.stringify(dadosNuvem));
    bancoDeDados = dadosNuvem;
    carregarData();
    alert('Sincronizado com sucesso! Os dados foram atualizados.');
  } catch (error) {
    alert("Erro ao sincronizar. Verifique a internet ou se o arquivo 'dados.json' já está no GitHub.");
  }
}

inicializarInterface();
carregarData();