'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  LayoutGrid, ClipboardList, CircleDollarSign, 
  Settings, Plus, Save, User, Phone, Monitor, FileText, Loader2, X
} from 'lucide-react'

export default function OrcamentoPage() {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [orcamentos, setOrcamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [form, setForm] = useState({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })

  useEffect(() => { carregarOrcamentos() }, [])

  async function carregarOrcamentos() {
    const { data } = await supabase.from('orçamentos').select('*').order('created_at', { ascending: false })
    setOrcamentos(data || [])
    setCarregando(false)
  }

  async function salvarOrcamento() {
    if (!form.cliente) return alert('O nome do cliente é obrigatório!')
    const { error } = await supabase.from('orçamentos').insert([{
      cliente: form.cliente,
      contato: form.contato,
      maquina: form.maquina,
      descricao_servico: form.descricao,
      valor_estimado: parseFloat(form.valor) || 0
    }])
    if (!error) {
      setModalAberto(false)
      setForm({ cliente: '', contato: '', maquina: '', descricao: '', valor: '' })
      carregarOrcamentos()
    }
  }

  return (
    // Container principal: Centraliza o "celular" em telas grandes
    <div className="min-h-screen bg-slate-50 dark:bg-[#07111f] flex justify-center">
      
      {/* Simulação do App Mobile (Max-width 448px) */}
      <div className="w-full max-w-md bg-white dark:bg-[#07111f] min-h-screen shadow-2xl relative flex flex-col">
        
        <header className="p-6 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-[#07111f]/80 backdrop-blur-md z-10">
          <h1 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white">Orçamentos</h1>
          <button 
            onClick={() => setModalAberto(true)} 
            className="bg-blue-600 active:scale-95 transition-transform p-3 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] text-white shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Novo
          </button>
        </header>

        <main className="px-5 space-y-4 pb-32 flex-1">
          {carregando ? (
            <div className="flex justify-center p-10">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : orcamentos.map(orc => (
            <div key={orc.id} className="bg-slate-100 dark:bg-[#0d1726] p-5 rounded-4xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:bg-slate-200 dark:active:bg-slate-800">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black uppercase text-sm text-slate-800 dark:text-white">{orc.cliente}</h3>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">R$ {orc.valor_estimado}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">
                 <Monitor size={12}/> {orc.maquina}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 opacity-80 leading-relaxed italic">
                "{orc.descricao_servico}"
              </p>
            </div>
          ))}
        </main>

        {/* MENU INFERIOR MOBILE */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 dark:bg-[#07111f]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 py-4 px-6 z-50 rounded-t-[30px]">
          <div className="flex justify-between items-center">
              <MenuNav titulo="Home" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
              <MenuNav titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
              <MenuNav ativo titulo="Orçamentos" Icone={FileText} onClick={() => router.push('/orcamento')} />
              <MenuNav titulo="Faturas" Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
              <MenuNav titulo="Ajustes" Icone={Settings} onClick={() => router.push('/configuracao')} />
          </div>
        </nav>

        {/* MODAL NOVO ORÇAMENTO (FULLSCREEN MOBILE STYLE) */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center">
            <div className="w-full max-w-md bg-white dark:bg-[#0d1726] rounded-t-[40px] sm:rounded-[40px] p-8 border-t sm:border border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase italic text-slate-900 dark:text-white">Novo Registro</h2>
                <button onClick={() => setModalAberto(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <InputIcon Icone={User} placeholder="Nome do Cliente" value={form.cliente} onChange={(v:any) => setForm({...form, cliente: v})} />
                <InputIcon Icone={Phone} placeholder="WhatsApp / Telefone" value={form.contato} onChange={(v:any) => setForm({...form, contato: v})} />
                <InputIcon Icone={Monitor} placeholder="Máquina / Equipamento" value={form.maquina} onChange={(v:any) => setForm({...form, maquina: v})} />
                
                <textarea 
                  placeholder="Descrição resumida do serviço..." 
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs h-28 focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                  value={form.descricao}
                  onChange={e => setForm({...form, descricao: e.target.value})}
                />
                
                <InputIcon Icone={CircleDollarSign} placeholder="Valor Estimado (Ex: 1500)" value={form.valor} onChange={(v:any) => setForm({...form, valor: v})} />
                
                <button 
                  onClick={salvarOrcamento} 
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
                >
                  <Save size={20} /> Salvar Orçamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${ativo ? 'text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
      <Icone size={22}/><span className="text-[8px] font-black uppercase">{titulo}</span>
    </button>
  )
}

function InputIcon({ Icone, placeholder, value, onChange }: any) {
  return (
    <div className="relative">
      <Icone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      <input 
        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-xs focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400" 
        placeholder={placeholder} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  )
}