'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Search, CheckCircle2, XCircle, LayoutGrid, 
  ClipboardList, CircleDollarSign, Settings, Hash, 
  Receipt, Store, DollarSign
} from 'lucide-react'

export default function FaturamentoPage() {
  const router = useRouter()

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false)
  const [osSelecionada, setOsSelecionada] = useState<any>(null)
  const [unidade, setUnidade] = useState('')
  const [numPedido, setNumPedido] = useState('')
  const [numSistema, setNumSistema] = useState('')
  const [valor, setValor] = useState('')
  const [statusFaturamento, setStatusFaturamento] = useState('Pendente')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarPagina()
  }, [])

  async function carregarPagina() {
    setCarregando(true)
    const usuarioSalvo = localStorage.getItem('usuario')
    if (!usuarioSalvo) { router.push('/'); return }

    const { data: dadosUsuario } = await supabase.from('usuarios').select('*').eq('usuario', usuarioSalvo).single()
    if (!dadosUsuario) { router.push('/'); return }
    setUsuarioLogado(dadosUsuario)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status', 'Finalizado')
      .order('created_at', { ascending: false })

    if (!error) setOrdens(data || [])
    setCarregando(false)
  }

  const ehFaturamento = usuarioLogado?.perfil === 'Faturamento' || usuarioLogado?.perfil === 'Admin'
  const clean = tema === 'clean'

  const prepararFaturamento = (e: React.MouseEvent, ordem: any) => {
    e.stopPropagation() 
    setOsSelecionada(ordem)
    setUnidade(ordem.unidade_faturamento || 'TORNEARIA DIVISA')
    setNumPedido(ordem.numero_pedido_faturamento || '')
    setNumSistema(ordem.numero_os_faturamento || '')
    setValor(ordem.valor_faturamento || '')
    setStatusFaturamento(ordem.status_faturamento === 'Faturado' ? 'Faturado' : 'Pendente')
    setModalAberto(true)
  }

  async function salvarFaturamento(e: React.MouseEvent) {
    e.preventDefault()
    if (!osSelecionada) return
    setSalvando(true)

    try {
      const updates: any = {
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numSistema,
        unidade_faturamento: unidade,
        valor_faturamento: valor ? parseFloat(valor.toString().replace(',', '.')) : 0,
        status_faturamento: statusFaturamento,
        faturado: statusFaturamento === 'Faturado'
      }

      if (statusFaturamento === 'Faturado') {
        updates.data_faturamento = new Date().toISOString()
      } else {
        updates.data_faturamento = null
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(updates)
        .eq('id', osSelecionada.id)

      if (error) throw error

      setOrdens(lista => lista.map(o => o.id === osSelecionada.id ? { ...o, ...updates } : o))
      setModalAberto(false)
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message)
    } finally {
      setSalvando(false)
    }
  }

  const ordensFiltradas = ordens.filter((o) => 
    `${o.cliente} ${o.maquina} ${o.numero_os}`.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`p-2.5 rounded-xl border ${clean ? 'bg-white' : 'bg-[#0d1a2d] border-slate-800'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
               <h1 className="text-xl font-black uppercase tracking-tight">Faturamento</h1>
               <p className="text-[10px] font-bold opacity-40 uppercase">Apenas Pendentes/Faturados</p>
            </div>
          </div>
        </header>

        {/* BUSCA */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
          <Search size={18} className="text-blue-500" />
          <input 
            placeholder="Buscar por cliente ou OS..." 
            className="bg-transparent outline-none text-sm w-full font-medium"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTAGEM */}
        <div className="space-y-4">
          {carregando ? (
            <div className="py-20 text-center opacity-50 italic">Carregando...</div>
          ) : ordensFiltradas.map((ordem) => (
            <div 
              key={ordem.id} 
              onClick={() => router.push(`/relatorio/${ordem.id}`)}
              className={`rounded-[2rem] border p-6 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                ordem.status_faturamento === 'Faturado' 
                ? 'border-emerald-500/30 bg-emerald-500/5' 
                : clean ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0b1628] border-slate-800'
              }`}
            >
              <div className="flex justify-between mb-4">
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${
                  ordem.status_faturamento === 'Faturado' ? 'bg-emerald-500 text-white' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {ordem.status_faturamento === 'Faturado' ? 'Faturado' : 'Pendente'}
                </span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">OS #{ordem.numero_os}</span>
              </div>

              <h3 className="font-black text-base uppercase mb-1 truncate">{ordem.cliente}</h3>
              <p className="text-xs font-bold opacity-50 mb-5 truncate uppercase">{ordem.maquina}</p>

              {(ordem.numero_pedido_faturamento || ordem.valor_faturamento > 0) && (
                <div className={`mb-5 p-4 rounded-2xl border flex flex-col gap-3 ${clean ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-blue-500">{ordem.unidade_faturamento}</span>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <DollarSign size={14} />
                      <span className="text-xs font-black">
                        {Number(ordem.valor_faturamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={(e) => prepararFaturamento(e, ordem)}
                className="w-full py-4 rounded-xl bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                {ehFaturamento ? 'Alterar Status' : 'Ver Dados'}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setModalAberto(false)}>
          <div 
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-sm rounded-[2.5rem] p-8 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-lg uppercase tracking-tight">Faturamento</h2>
              <button onClick={() => setModalAberto(false)}><XCircle size={24} className="opacity-30" /></button>
            </div>

            <div className="space-y-4">
              {ehFaturamento && (
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">Status</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {['Pendente', 'Faturado'].map(s => (
                      <button 
                        key={s}
                        onClick={() => setStatusFaturamento(s)}
                        className={`py-3 rounded-xl text-[9px] font-black border transition-all ${statusFaturamento === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 opacity-40'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <InputField label="Nº Pedido" icon={Receipt} value={numPedido} onChange={setNumPedido} placeholder="00000" clean={clean} />
              <InputField label="Valor (R$)" icon={DollarSign} value={valor} onChange={setValor} placeholder="0,00" clean={clean} />

              <button 
                onClick={salvarFaturamento}
                disabled={salvando}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest mt-4 bg-blue-600 text-white active:scale-95 transition-all"
              >
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAV INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 z-50 ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuItem clean={clean} titulo="Início" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
          <MenuItem clean={clean} ativo titulo="Faturam." Icone={CircleDollarSign} onClick={() => {}} />
          <MenuItem clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function InputField({ label, icon: Icon, value, onChange, placeholder, clean }: any) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase opacity-40 ml-1">{label}</label>
      <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1.5 ${clean ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-slate-800'}`}>
        <Icon size={18} className="text-blue-500" />
        <input 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder} 
          className="bg-transparent outline-none w-full font-bold text-sm" 
        />
      </div>
    </div>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 transition-all ${ativo ? 'text-blue-500 scale-110' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}