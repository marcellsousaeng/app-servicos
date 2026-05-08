'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  LayoutGrid, ClipboardList, CircleDollarSign, Settings,
  Plus, Save, User, Phone, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2, Camera, MapPin, Hash, Edit3, Trash2
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // ESTADOS
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const [form, setForm] = useState({ 
    razao_social: '', solicitante: '', endereco: '', documento: '',
    maquina: '', descricao: '', quantidade: '1', valor_unitario: '',
    desconto: '0', observacao: '', foto_preview: ''
  })

  useEffect(() => {
    carregarOrcamentos()
    const handleStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleStatus)
    window.addEventListener('offline', handleStatus)
    return () => {
      window.removeEventListener('online', handleStatus)
      window.removeEventListener('offline', handleStatus)
    }
  }, [])

  async function carregarOrcamentos() {
    setCarregando(true)
    const { data, error } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    if (!error) setOrcamentos(data || [])
    setCarregando(false)
  }

  // CAPTURA DE FOTO (CÂMERA/ARQUIVO)
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setForm({ ...form, foto_preview: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  // SALVAR OU ATUALIZAR
  async function salvarOrcamento() {
    if (!form.razao_social || !form.valor_unitario) {
      alert('Por favor, preencha a Razão Social e o Valor Unitário.')
      return
    }
    
    const vUnit = parseFloat(form.valor_unitario) || 0
    const qtd = parseFloat(form.quantidade) || 1
    const desc = parseFloat(form.desconto) || 0
    const vTotal = (vUnit * qtd) - desc

    const dados = {
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
      foto_url: form.foto_preview // Base64 para visualização
    }

    try {
      if (editandoId) {
        await supabase.from('orçamentos').update(dados).eq('id', editandoId)
      } else {
        await supabase.from('orçamentos').insert([dados])
      }
      fecharModal()
      carregarOrcamentos()
    } catch (error) {
      alert('Erro ao processar solicitação.')
    }
  }

  // EDITAR
  function abrirEdicao(orc: any) {
    setEditandoId(orc.id)
    setForm({
      razao_social: orc.cliente || '',
      solicitante: orc.solicitante || '',
      endereco: orc.endereco || '',
      documento: orc.documento || '',
      maquina: orc.maquina || '',
      descricao: orc.descricao_servico || '',
      quantidade: orc.quantidade?.toString() || '1',
      valor_unitario: orc.valor_unitario?.toString() || '',
      desconto: orc.desconto?.toString() || '0',
      observacao: orc.observacao || '',
      foto_preview: orc.foto_url || ''
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm({ 
      razao_social: '', solicitante: '', endereco: '', documento: '',
      maquina: '', descricao: '', quantidade: '1', valor_unitario: '',
      desconto: '0', observacao: '', foto_preview: ''
    })
  }

  // GERAR PDF (ESTILO OFICIAL DA IMAGEM)
  async function exportarPDF(orc: any) {
    setGerandoPdf(true)
    const element = document.getElementById(`temp-pdf-${orc.id}`)
    if (!element) return

    element.style.display = 'block'
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      
      const pdfBlob = pdf.output('blob')
      const file = new File([pdfBlob], `Orcamento_${orc.cliente}.pdf`, { type: 'application/pdf' })

      if (navigator.share) {
        await navigator.share({ files: [file], title: 'Tornearia Divisa - Orçamento' })
      } else {
        pdf.save(`Orcamento_${orc.cliente}.pdf`)
      }
    } catch (err) {
      alert("Erro ao gerar PDF")
    }
    element.style.display = 'none'
    setGerandoPdf(false)
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-32">
      <main className="max-w-md mx-auto px-5 pt-6">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black italic">ORÇAMENTOS</h1>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Tornearia Divisa</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-4 rounded-2xl shadow-lg active:scale-95">
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4">
          {carregando ? (
            <div className="flex justify-center py-20 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className="bg-[#0d1726] border border-slate-800 p-5 rounded-4xl relative">
              <div className="flex justify-between mb-4">
                <div onClick={() => abrirEdicao(orc)} className="flex-1 cursor-pointer">
                  <p className="text-[10px] font-black text-blue-500 uppercase">Proposta #{orc.id.toString().slice(-4)}</p>
                  <p className="font-bold uppercase text-sm truncate w-40">{orc.cliente}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEdicao(orc)} className="p-2 bg-slate-800 rounded-full text-slate-400"><Edit3 size={18} /></button>
                  <button onClick={() => exportarPDF(orc)} className="p-2 bg-emerald-500 text-white rounded-full"><Share2 size={18} /></button>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold opacity-30 uppercase">{orc.maquina || 'Geral'}</p>
                <p className="text-xl font-black text-emerald-400">R$ {orc.valor_total?.toFixed(2)}</p>
              </div>

              {/* TEMPLATE PDF OCULTO (IDENTICO À IMAGEM) */}
              <div id={`temp-pdf-${orc.id}`} style={{ display: 'none', width: '210mm', backgroundColor: 'white', color: 'black', padding: '10mm', fontFamily: 'Arial' }}>
                <div style={{ display: 'flex', border: '1px solid black', marginBottom: '5px' }}>
                    <div style={{ width: '35%', padding: '10px', textAlign: 'center' }}>
                        <h1 style={{ color: '#1a4a8e', fontStyle: 'italic', margin: 0 }}>Divisa</h1>
                        <p style={{ fontSize: '8pt', margin: 0, letterSpacing: '2px' }}>TORNEARIA</p>
                    </div>
                    <div style={{ width: '65%', backgroundColor: '#1a4a8e', color: 'white', padding: '10px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '10pt', margin: 0 }}>TORNEARIA DIVISA COMERCIO E SERVIÇO LTDA</p>
                        <p style={{ fontSize: '7pt', margin: '5px 0' }}>AV. 22, QD. 25, LT. 01 PRIMAVERA DO OESTE, ROSÁRIO-BA</p>
                    </div>
                </div>
                <div style={{ backgroundColor: '#2b5797', color: 'white', padding: '2px', textAlign: 'center', fontSize: '8pt', fontWeight: 'bold' }}>DADOS DO CLIENTE</div>
                <div style={{ border: '1px solid black', fontSize: '8pt' }}>
                    <p style={{ margin: '5px' }}><b>RAZÃO SOCIAL:</b> {orc.cliente}</p>
                    <p style={{ margin: '5px' }}><b>ENDEREÇO:</b> {orc.endereco}</p>
                    <p style={{ margin: '5px' }}><b>CNPJ OU CPF:</b> {orc.documento}</p>
                    <p style={{ margin: '5px' }}><b>MÁQUINA:</b> {orc.maquina}</p>
                </div>
                {/* ... Estrutura da tabela conforme imagem ... */}
                <div style={{ marginTop: '20px', border: '1px solid black', padding: '10px' }}>
                    <p style={{ fontSize: '8pt' }}><b>DESCRIÇÃO:</b> {orc.descricao_servico}</p>
                    <p style={{ fontSize: '10pt', textAlign: 'right', fontWeight: 'bold' }}>TOTAL: R$ {orc.valor_total?.toFixed(2)}</p>
                    {orc.foto_url && <img src={orc.foto_url} style={{ width: '100px', marginTop: '10px' }} />}
                </div>
                <p style={{ fontSize: '8pt', textAlign: 'center', marginTop: '20px' }}>VALIDADE: 7 DIAS</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-100 flex items-end">
          <div className="w-full bg-[#0d1726] rounded-t-[40px] p-8 h-[92vh] overflow-y-auto border-t border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black italic">{editandoId ? 'EDITAR' : 'NOVO'} ORÇAMENTO</h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full"><X /></button>
            </div>

            <div className="space-y-4 pb-20">
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFoto} />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-slate-700 rounded-4xl flex flex-col items-center justify-center gap-2 overflow-hidden bg-slate-900/50"
              >
                {form.foto_preview ? (
                  <img src={form.foto_preview} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-blue-500" />
                    <span className="text-[10px] font-bold opacity-50 uppercase">Foto do Serviço</span>
                  </>
                )}
              </div>

              <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v: string) => setForm({...form, razao_social: v})} />
              <InputIcon Icone={Phone} placeholder="Solicitante" value={form.solicitante} onChange={(v: string) => setForm({...form, solicitante: v})} />
              <InputIcon Icone={MapPin} placeholder="Endereço" value={form.endereco} onChange={(v: string) => setForm({...form, endereco: v})} />
              <InputIcon Icone={Hash} placeholder="CNPJ ou CPF" value={form.documento} onChange={(v: string) => setForm({...form, documento: v})} />
              <InputIcon Icone={Monitor} placeholder="Máquina" value={form.maquina} onChange={(v: string) => setForm({...form, maquina: v})} />
              
              <textarea 
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm h-24 outline-none focus:border-blue-500"
                placeholder="Descrição do serviço..."
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-3">
                <InputIcon Icone={Hash} placeholder="Quantidade" value={form.quantidade} onChange={(v: string) => setForm({...form, quantidade: v})} />
                <InputIcon Icone={CircleDollarSign} placeholder="V. Unitário" value={form.valor_unitario} onChange={(v: string) => setForm({...form, valor_unitario: v})} />
              </div>
              
              <InputIcon Icone={CircleDollarSign} placeholder="Desconto (R$)" value={form.desconto} onChange={(v: string) => setForm({...form, desconto: v})} />

              <textarea 
                className="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm h-20 outline-none"
                placeholder="Observações..."
                value={form.observacao}
                onChange={e => setForm({...form, observacao: e.target.value})}
              />

              <button 
                onClick={salvarOrcamento} 
                className="w-full py-5 bg-blue-600 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {editandoId ? 'Atualizar Dados' : 'Gerar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTE DE INPUT COM TIPAGEM CORRIGIDA
function InputIcon({ Icone, placeholder, value, onChange }: { Icone: any, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        className="w-full bg-slate-900 border border-slate-700 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}