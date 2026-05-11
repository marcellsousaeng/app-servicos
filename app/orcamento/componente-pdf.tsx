// Este é o HTML que o navegador vai usar para imprimir
export const templateHTMLDivisa = (dados: any) => `
  <div id="print-area" style="font-family: Arial; padding: 20px; color: #333;">
    <div style="display: flex; border: 1px solid #003366; align-items: center; margin-bottom: 10px;">
      <div style="width: 30%; text-align: center; padding: 10px;">
        <img src="/logo-divisa.png" style="max-width: 150px;" />
      </div>
      <div style="width: 70%; background-color: #003366; color: white; padding: 15px;">
        <h1 style="margin: 0; font-size: 22px;">TORNEARIA DIVISA</h1>
        <p style="margin: 5px 0; font-weight: bold;">COMERCIO E SERVIÇO LTDA</p>
        <p style="margin: 2px 0; font-size: 12px;">AV.22, QD.25, LT.01 PRIMAVERA DO OESTE, ROSÁRIO-BA</p>
        <p style="margin: 2px 0; font-size: 12px;">CELULAR: (62) 99929-2829 / (62) 99618-6262</p>
        <p style="margin: 2px 0; font-size: 12px;">CNPJ: 11.190.449/0001-86</p>
      </div>
    </div>

    <div style="background: #003366; color: white; text-align: center; padding: 5px; font-weight: bold; margin-bottom: 5px;">DADOS DO CLIENTE</div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
      <tr>
        <td style="border: 1px solid #000; padding: 8px; background: #eee; width: 20%;">RAZÃO SOCIAL:</td>
        <td style="border: 1px solid #000; padding: 8px;" colspan="3">${dados.cliente}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; background: #eee;">CNPJ/CPF:</td>
        <td style="border: 1px solid #000; padding: 8px;">${dados.documento || ''}</td>
        <td style="border: 1px solid #000; padding: 8px; background: #eee;">FONE:</td>
        <td style="border: 1px solid #000; padding: 8px;">${dados.telefone || ''}</td>
      </tr>
    </table>

    <div style="background: #003366; color: white; text-align: center; padding: 5px; font-weight: bold;">ORÇAMENTO</div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #eee;">
          <th style="border: 1px solid #000; padding: 10px;">DESCRIÇÃO</th>
          <th style="border: 1px solid #000; padding: 10px;">QTD</th>
          <th style="border: 1px solid #000; padding: 10px;">UNITÁRIO</th>
          <th style="border: 1px solid #000; padding: 10px;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #000; padding: 15px; height: 100px; vertical-align: top;">${dados.descricao_servico}</td>
          <td style="border: 1px solid #000; padding: 10px; text-align: center;">${dados.quantidade}</td>
          <td style="border: 1px solid #000; padding: 10px; text-align: center;">R$ ${dados.valor_unitario}</td>
          <td style="border: 1px solid #000; padding: 10px; text-align: center; font-weight: bold;">R$ ${dados.valor_total}</td>
        </tr>
      </tbody>
    </table>

    <div style="display: flex; margin-top: 10px;">
      <div style="width: 60%; border: 1px solid #000; padding: 10px;">
        <strong>OBSERVAÇÕES:</strong><br>${dados.observacao || 'N/A'}
      </div>
      <div style="width: 40%;">
        <div style="display: flex; justify-content: space-between; border: 1px solid #000; padding: 5px; background: #003366; color: white;">
          <span>VALOR TOTAL:</span> <span>R$ ${dados.valor_total}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border: 1px solid #000; padding: 5px; background: #cc0000; color: white;">
          <span>DESCONTO:</span> <span>R$ ${dados.desconto || '0,00'}</span>
        </div>
      </div>
    </div>
  </div>
`;