'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, Save, User, Phone, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2, Camera, MapPin, Hash
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [isOnline, setIsOnline] = useState(true)
  
  // ESTADO DO FORMULÁRIO COM TODOS OS CAMPOS SOLICITADOS
  const [form, setForm] = useState({ 
    razao_social: '',
    solicitante: '',
    endereco: '',
    documento: '', // CNPJ ou CPF
    maquina: '',
    descricao: '',
    quantidade: '1',
    valor_unitario: '',
    desconto: '0',
    observacao: '',
    foto_url: '' // Campo para URL da foto (opcional)
  })

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarOrcamentos()
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    setOrcamentos(data || [])
    setCarregando(false)
  }

  async function salvarOrcamento() {
    if (!form.razao_social) return alert('A Razão Social é obrigatória!')
    
    const vUnit = parseFloat(form.valor_unitario) || 0
    const qtd = parseFloat(form.quantidade) || 0
    const desc = parseFloat(form.desconto) || 0
    const vTotal = (vUnit * qtd) - desc

    const { error } = await supabase.from('orçamentos').insert([{
      cliente: form.razao_social,
      solicitante: form.solicitante,
      endereco: form.endereco,
      documento: form.documento,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      quantidade: qtd,
      valor_unitario: vUnit,
      valor_total: vTotal,
      desconto: desc,
      observacao: form.observacao,
      valor_estimado: vTotal // Mantendo compatibilidade com campo antigo se houver
    }])

    if (!error) {
      setModalAberto(false)
      setForm({ razao_social: '', solicitante: '', endereco: '', documento: '', maquina: '', descricao: '', quantidade: '1', valor_unitario: '', desconto: '0', observacao: '', foto_url: '' })
      carregarOrcamentos()
    }
  }

  async function exportarPDF(orc: any) {
    setGerandoPdf(true)
    const element = document.getElementById(`temp-pdf-${orc.id}`)
    if (!element) return

    try {
      element.style.display = 'block'
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297) // Ajuste A4
      const pdfBlob = pdf.output('blob')
      element.style.display = 'none'

      const file = new File([pdfBlob], `Orcamento_${orc.cliente}.pdf`, { type: 'application/pdf' })

      if (navigator.share) {
        await navigator.share({ files: [file], title: 'Orçamento Tornearia Divisa' })
      } else {
        pdf.save(`Orcamento_${orc.cliente}.pdf`)
      }
    } catch (err) {
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPdf(false)
    }
  }

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black italic">ORÇAMENTOS</h1>
            <p className="text-xs font-bold uppercase opacity-50">Tornearia Divisa</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="p-3 rounded-xl bg-blue-600 text-white shadow-lg active:scale-90">
            <Plus size={22} strokeWidth={3} />
          </button>
        </div>

        {/* LISTA */}
        <div className="space-y-4">
          {orcamentos.map((orc) => (
            <div key={orc.id} className={`p-5 rounded-3xl border relative ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
              <button onClick={() => exportarPDF(orc)} className="absolute top-4 right-4 p-2 bg-emerald-500/10 text-emerald-500 rounded-full">
                {gerandoPdf ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
              </button>
              
              <p className="text-sm font-black uppercase truncate pr-10">{orc.cliente}</p>
              <p className="text-[10px] opacity-60 mb-2">{orc.maquina || 'SEM MÁQUINA'}</p>
              
              <div className="flex justify-between items-end mt-4">
                <span className="text-[10px] font-bold opacity-30">Válido por 7 dias</span>
                <span className="text-lg font-black text-emerald-500">R$ {orc.valor_total?.toLocaleString('pt-BR')}</span>
              </div>

              {/* TEMPLATE PDF OCULTO (IDÊNTICO À IMAGEM) */}
              <div id={`temp-pdf-${orc.id}`} style={{ display: 'none', width: '210mm', height: '297mm', backgroundColor: 'white', color: 'black', padding: '10mm', fontFamily: 'Arial' }}>
                {/* HEADER DO PDF */}
                <div style={{ display: 'flex', border: '1px solid black', marginBottom: '5px' }}>
                  <div style={{ width: '35%', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '26pt', fontWeight: 'bold', color: '#1a4a8e', fontStyle: 'italic' }}>Divisa</div>
                    <div style={{ fontSize: '8pt', fontWeight: 'bold', letterSpacing: '3px' }}>TORNEARIA</div>
                  </div>
                  <div style={{ width: '65%', backgroundColor: '#1a4a8e', color: 'white', padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>TORNEARIA DIVISA COMERCIO E SERVIÇO LTDA</div>
                    <div style={{ fontSize: '7.5pt', marginTop: '5px' }}>
                      AV. 22, QD. 25, LT. 01 PRIMAVERA DO OESTE, ROSÁRIO-BA<br />
                      CELULAR: (62) 99929-2829 / (62) 99618-6262 | CNPJ: 11.190.449/0001-86
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', padding: '2px' }}>DADOS DO CLIENTE</div>
                <div style={{ border: '1px solid black', fontSize: '8pt', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                        <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px', fontWeight: 'bold' }}>RAZÃO SOCIAL:</div>
                        <div style={{ width: '80%', padding: '4px' }}>{orc.cliente}</div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                        <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px', fontWeight: 'bold' }}>ENDEREÇO:</div>
                        <div style={{ width: '80%', padding: '4px' }}>{orc.endereco}</div>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                        <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px', fontWeight: 'bold' }}>CNPJ/CPF:</div>
                        <div style={{ width: '30%', padding: '4px' }}>{orc.documento}</div>
                        <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px', fontWeight: 'bold' }}>SOLICITANTE:</div>
                        <div style={{ width: '30%', padding: '4px' }}>{orc.solicitante}</div>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ width: '20%', backgroundColor: '#d9d9d9', padding: '4px', fontWeight: 'bold' }}>MÁQUINA:</div>
                        <div style={{ width: '80%', padding: '4px' }}>{orc.maquina}</div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#2b5797', color: 'white', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold', padding: '2px' }}>ORÇAMENTO</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#a6a6a6' }}>
                      <th style={{ border: '1px solid black', padding: '4px' }}>DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                      <th style={{ border: '1px solid black', padding: '4px' }}>QUANT.</th>
                      <th style={{ border: '1px solid black', padding: '4px' }}>UNITÁRIO</th>
                      <th style={{ border: '1px solid black', padding: '4px' }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ height: '60px' }}>
                      <td style={{ border: '1px solid black', padding: '5px', verticalAlign: 'top' }}>{orc.descricao_servico}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>{orc.quantidade}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>R$ {orc.valor_unitario?.toFixed(2)}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>R$ {(orc.valor_unitario * orc.quantidade)?.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* OBSERVAÇÃO E TOTAIS */}
                <div style={{ display: 'flex', border: '1px solid black', marginTop: '-1px' }}>
                    <div style={{ width: '70%', padding: '5px', borderRight: '1px solid black' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '7pt' }}>OBSERVAÇÕES:</div>
                        <div style={{ fontSize: '8pt', marginTop: '5px' }}>{orc.observacao}</div>
                        {/* CAMPO PARA FOTO NO PDF */}
                        <div style={{ marginTop: '10px', border: '1px dashed #ccc', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '7pt' }}>
                            {orc.foto_url ? <img src={orc.foto_url} style={{maxHeight: '100%'}} /> : "[ FOTO DO SERVIÇO ]"}
                        </div>
                    </div>
                    <div style={{ width: '30%' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                            <div style={{ width: '60%', backgroundColor: '#2b5797', color: 'white', padding: '8px', fontSize: '7pt', fontWeight: 'bold' }}>TOTAL</div>
                            <div style={{ width: '40%', padding: '8px', textAlign: 'center', fontSize: '8pt' }}>R$ {(orc.valor_unitario * orc.quantidade)?.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', borderBottom: '1px solid black' }}>
                            <div style={{ width: '60%', backgroundColor: '#c00000', color: 'white', padding: '8px', fontSize: '7pt', fontWeight: 'bold' }}>DESCONTO</div>
                            <div style={{ width: '40%', padding: '8px', textAlign: 'center', fontSize: '8pt' }}>R$ {orc.desconto?.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '60%', backgroundColor: '#2b5797', color: 'white', padding: '8px', fontSize: '7pt', fontWeight: 'bold' }}>FINAL</div>
                            <div style={{ width: '40%', padding: '8px', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold' }}>R$ {orc.valor_total?.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold' }}>
                    VALIDADE DO ORÇAMENTO: 07 DIAS • EMISSÃO: {new Date(orc.created_at).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '20px', borderTop: '1px solid black', width: '200px', margin: '40px auto 0', textAlign: 'center', fontSize: '8pt' }}>Assinatura Responsável</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MENU INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${clean ? 'bg-white' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto grid grid-cols-5 px-2">
          <MenuItem titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem ativo titulo="Orçam." Icone={FileText} onClick={() => router.push('/orcamento')} />
          <MenuItem titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL COM TODOS OS CAMPOS SOLICITADOS */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center">
          <div className={`w-full max-w-md h-[90vh] overflow-y-auto rounded-t-[40px] p-6 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic">NOVO ORÇAMENTO</h2>
              <button onClick={() => setModalAberto(false)} className="p-2 opacity-50"><X /></button>
            </div>

            <div className="space-y-3 pb-10">
              <p className="text-[10px] font-bold uppercase opacity-40">Dados do Cliente</p>
              <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v: any) => setForm({...form, razao_social: v})} />
              <InputIcon Icone={Phone} placeholder="Solicitante" value={form.solicitante} onChange={(v: any) => setForm({...form, solicitante: v})} />
              <InputIcon Icone={MapPin} placeholder="Endereço" value={form.endereco} onChange={(v: any) => setForm({...form, endereco: v})} />
              <InputIcon Icone={Hash} placeholder="CNPJ ou CPF" value={form.documento} onChange={(v: any) => setForm({...form, documento: v})} />
              <InputIcon Icone={Monitor} placeholder="Máquina / Equipamento" value={form.maquina} onChange={(v: any) => setForm({...form, maquina: v})} />
              
              <p className="text-[10px] font-bold uppercase opacity-40 mt-4">Serviço e Valores</p>
              <textarea 
                className={`w-full p-4 rounded-2xl text-xs h-20 border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`}
                placeholder="Descrição do serviço..."
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <InputIcon Icone={Hash} placeholder="Qtd" value={form.quantidade} onChange={(v: any) => setForm({...form, quantidade: v})} />
                <InputIcon Icone={CircleDollarSign} placeholder="V. Unitário" value={form.valor_unitario} onChange={(v: any) => setForm({...form, valor_unitario: v})} />
              </div>
              <InputIcon Icone={CircleDollarSign} placeholder="Desconto (R$)" value={form.desconto} onChange={(v: any) => setForm({...form, desconto: v})} />
              
              <p className="text-[10px] font-bold uppercase opacity-40 mt-4">Extras</p>
              <textarea 
                className={`w-full p-4 rounded-2xl text-xs h-16 border ${clean ? 'bg-slate-50' : 'bg-slate-900 border-slate-700'}`}
                placeholder="Observações adicionais..."
                value={form.observacao}
                onChange={e => setForm({...form, observacao: e.target.value})}
              />
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-dashed opacity-50 justify-center">
                <Camera size={18} /> <span className="text-xs">Foto do Serviço (Opcional)</span>
              </div>

              <button onClick={salvarOrcamento} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg mt-4">
                Gerar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ titulo, Icone, ativo, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 ${ativo ? 'text-blue-500' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-bold uppercase">{titulo}</span>
    </button>
  )
}

function InputIcon({ Icone, placeholder, value, onChange }: any) {
  return (
    <div className="relative">
      <Icone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
      <input 
        className="w-full py-4 pl-12 pr-4 rounded-2xl text-xs outline-none border bg-slate-900 border-slate-700"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}