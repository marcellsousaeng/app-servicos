'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import {
  Plus, User, Monitor, FileText,
  Wifi, WifiOff, X, Share2, Loader2, Camera, MapPin, Hash, Edit3, Save, CircleDollarSign
} from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function OrcamentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
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
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    if (data) setOrcamentos(data)
    setCarregando(false)
  }

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setForm({ ...form, foto_preview: reader.result as string })
      reader.readAsDataURL(file)
    }
  }

  async function salvarOrcamento() {
    if (!form.razao_social || !form.valor_unitario) {
      alert('Preencha os campos obrigatórios!')
      return
    }
    
    const vUnit = parseFloat(form.valor_unitario) || 0
    const qtd = parseFloat(form.quantidade) || 1
    const desc = parseFloat(form.desconto) || 0
    const vTotal = (vUnit * qtd) - desc

    const dados: any = {
      cliente: form.razao_social,
      solicitante: form.solicitante,
      endereco: form.endereco,
      documento: form.documento,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      quantidade: qtd,
      valor_unitario: vUnit,
      valor_total: vTotal,
      observacao: form.observacao,
      foto_url: form.foto_preview
    }

    // Tenta incluir desconto apenas se a coluna existir (evita erro de schema)
    if (form.desconto) dados.desconto = desc

    const { error } = editandoId 
      ? await supabase.from('orçamentos').update(dados).eq('id', editandoId)
      : await supabase.from('orçamentos').insert([dados])

    if (!error) {
      fecharModal()
      carregarOrcamentos()
    } else {
      alert("Erro ao salvar: " + error.message)
    }
  }

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

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-24 overflow-x-hidden">
      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black italic">ORÇAMENTOS</h1>
            <div className="flex items-center gap-2 opacity-50 text-[10px] font-bold">
              {isOnline ? <Wifi size={10} className="text-emerald-500" /> : <WifiOff size={10} />}
              TORNEARIA DIVISA
            </div>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 p-3 rounded-xl active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {/* LISTA DE CARDS */}
        <div className="space-y-3">
          {carregando ? (
            <div className="flex justify-center py-10 opacity-20"><Loader2 className="animate-spin" /></div>
          ) : orcamentos.map((orc) => (
            <div key={orc.id} className="bg-[#0d1726] border border-slate-800 p-4 rounded-2xl">
              <div className="flex justify-between mb-2">
                <div onClick={() => abrirEdicao(orc)} className="cursor-pointer">
                  <p className="text-[10px] font-black text-blue-500 uppercase">#{orc.id.toString().slice(-4)}</p>
                  <p className="font-bold uppercase text-xs truncate w-40">{orc.cliente}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEdicao(orc)} className="p-2 bg-slate-800 rounded-lg text-slate-400"><Edit3 size={16}/></button>
                  <button className="p-2 bg-emerald-600 text-white rounded-lg"><Share2 size={16}/></button>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[9px] font-bold opacity-30 uppercase">{orc.maquina || 'Geral'}</p>
                <p className="text-lg font-black text-emerald-400">R$ {orc.valor_total?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL AJUSTADO - RESOLVE O PROBLEMA DE DESPROPORÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="w-full max-w-md bg-[#0d1726] rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto border-t border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0d1726] z-10 pb-2">
              <h2 className="text-lg font-black italic">{editandoId ? 'EDITAR' : 'NOVO'} ORÇAMENTO</h2>
              <button onClick={fecharModal} className="bg-slate-800 p-2 rounded-full"><X size={20}/></button>
            </div>

            <div className="space-y-4 pb-6">
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFoto} />
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center bg-slate-900/50 overflow-hidden">
                {form.foto_preview ? <img src={form.foto_preview} className="w-full h-full object-cover" /> : <Camera size={24} className="text-blue-500" />}
              </div>

              <InputIcon Icone={User} placeholder="Razão Social" value={form.razao_social} onChange={(v: string) => setForm({...form, razao_social: v})} />
              <InputIcon Icone={Monitor} placeholder="Máquina" value={form.maquina} onChange={(v: string) => setForm({...form, maquina: v})} />
              
              <textarea 
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-xs h-24 outline-none text-white focus:border-blue-500"
                placeholder="Descrição técnica"
                value={form.descricao}
                onChange={e => setForm({...form, descricao: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-3">
                <InputIcon Icone={Hash} placeholder="Qtd" value={form.quantidade} onChange={(v: string) => setForm({...form, quantidade: v})} />
                <InputIcon Icone={CircleDollarSign} placeholder="Unitário" value={form.valor_unitario} onChange={(v: string) => setForm({...form, valor_unitario: v})} />
              </div>

              <button 
                onClick={salvarOrcamento} 
                className="w-full py-4 bg-blue-600 rounded-xl font-black uppercase text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Save size={18} />
                {editandoId ? 'Salvar Alterações' : 'Gerar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// COMPONENTE DE INPUT COM TIPAGEM DEFINIDA
function InputIcon({ Icone, placeholder, value, onChange }: { Icone: any, placeholder: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Icone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input 
        className="w-full bg-slate-900 border border-slate-700 py-3 pl-10 pr-3 rounded-xl text-xs outline-none text-white focus:border-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}