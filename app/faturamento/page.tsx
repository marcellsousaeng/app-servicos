'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeft, Search, ChevronDown, Calendar, CheckCircle2, 
  XCircle, Info, LayoutGrid, ClipboardList, CircleDollarSign, 
  Settings, Hash, Receipt
} from 'lucide-react'

export default function FaturamentoPage() {
  const router = useRouter()

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null)
  const [ordens, setOrdens] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // Estados para o Modal de Faturamento
  const [modalAberto, setModalAberto] = useState(false)
  const [osSelecionada, setOsSelecionada] = useState<any>(null)
  const [numPedido, setNumPedido] = useState('')
  const [numSistema, setNumSistema] = useState('')
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

    const { data: dadosUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuarioSalvo)
      .single()
    
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

  const podeEditar = usuarioLogado?.perfil === 'Faturamento' || usuarioLogado?.perfil === 'Admin'
  const clean = tema === 'clean'

  const ordensFiltradas = ordens.filter((o) => 
    `${o.cliente} ${o.maquina} ${o.numero_os}`.toLowerCase().includes(busca.toLowerCase())
  )

  const pendentesFaturar = ordens.filter(o => !o.faturado).length

  const prepararFaturamento = (ordem: any) => {
    if (!podeEditar) return
    setOsSelecionada(ordem)
    setNumPedido(ordem.numero_pedido_faturamento || '')
    setNumSistema(ordem.numero_os_faturamento || '')
    setModalAberto(true)
  }

  async function confirmarFaturamento() {
    if (!osSelecionada) return
    setSalvando(true)

    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        faturado: true,
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numSistema,
        data_faturamento: new Date().toISOString()
      })
      .eq('id', osSelecionada.id)

    if (!error) {
      setOrdens(lista => lista.map(o => o.id === osSelecionada.id ? 
        { ...o, faturado: true, numero_pedido_faturamento: numPedido, numero_os_faturamento: numSistema } : o))
      setModalAberto(false)
      setOsSelecionada(null)
      setNumPedido('')
      setNumSistema('')
    }
    setSalvando(false)
  }

  async function estornarFaturamento(id: number) {
    if (!podeEditar || !confirm("Deseja marcar esta OS como não faturada?")) return
    
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        faturado: false, 
        numero_pedido_faturamento: null, 
        numero_os_faturamento: null 
      })
      .eq('id', id)

    if (!error) {
      setOrdens(lista => lista.map(o => o.id === id ? { ...o, faturado: false } : o))
    }
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className={`p-2.5 rounded-xl border ${clean ? 'bg-white' : 'bg-[#0d1a2d] border-slate-800'}`}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Faturamento</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${pendentesFaturar > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <p className="text-[10px] font-bold opacity-50 uppercase">{pendentesFaturar} pendentes</p>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg">
            {usuarioLogado?.nome?.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* ALERTA DE PERMISSÃO */}
        {!podeEditar && !carregando && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-center">
            <Info size={18} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-200 font-medium">Seu perfil não possui permissão para faturar ordens.</p>
          </div>
        )}

        {/* BUSCA */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-800'}`}>
          <Search size={18} className="text-blue-500" />
          <input 
            placeholder="Buscar cliente ou OS..." 
            className="bg-transparent outline-none text-sm w-full font-medium"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* LISTAGEM */}
        <div className="space-y-4">
          {carregando ? (
            <div className="py-20 text-center opacity-50 italic">Carregando dados...</div>
          ) : ordensFiltradas.length === 0 ? (
            <div className="py-20 text-center opacity-40 text-sm">Nenhuma OS finalizada encontrada.</div>
          ) : (
            ordensFiltradas.map((ordem) => (
              <div 
                key={ordem.id} 
                onClick={() => router.push(`/ordens/${ordem.id}`)}
                className={`rounded-[2rem] border p-6 transition-all cursor-pointer active:scale-[0.98] hover:shadow-xl ${
                  ordem.faturado 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0b1628] border-slate-800'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                    ordem.faturado ? 'bg-emerald-500 text-white' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {ordem.faturado ? 'Faturado' : `OS #${ordem.numero_os ?? ordem.id}`}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-40 uppercase">
                    <Calendar size={12} />
                    {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <h3 className="font-black text-base uppercase mb-1 truncate leading-tight">
                  {ordem.cliente}
                </h3>
                <p className="text-xs font-bold opacity-50 mb-6 truncate uppercase tracking-tight">
                  {ordem.maquina}
                </p>

                {/* BOTÕES DE AÇÃO - STOP PROPAGATION PARA NÃO ABRIR O RELATÓRIO */}
                <div onClick={(e) => e.stopPropagation()}>
                  {!ordem.faturado ? (
                    <button 
                      onClick={() => prepararFaturamento(ordem)}
                      disabled={!podeEditar}
                      className="w-full py-4 rounded-[1.2rem] bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Concluir Faturamento
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className={`p-4 rounded-2xl border flex justify-between items-center ${clean ? 'bg-slate-50' : 'bg-white/5 border-white/10'}`}>
                        <div>
                          <p className="text-[9px] uppercase font-black opacity-40 mb-1">Documentação</p>
                          <div className="flex gap-3 text-[11px] font-black text-emerald-500">
                            <span>PED: {ordem.numero_pedido_faturamento || '---'}</span>
                            <span className="opacity-30">|</span>
                            <span>OS: {ordem.numero_os_faturamento || '---'}</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                      </div>
                      <button 
                        onClick={() => estornarFaturamento(ordem.id)}
                        className="text-[10px] font-black text-rose-500 uppercase py-2 hover:bg-rose-500/5 rounded-lg transition-colors"
                      >
                        Estornar Faturamento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL DE FATURAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-black text-lg uppercase tracking-tight">Finalizar OS</h2>
                <p className="text-[10px] font-bold opacity-40 uppercase">Vincular documentos de venda</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <XCircle size={24} className="opacity-50" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Nº Pedido de Venda</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1.5 ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}>
                  <Receipt size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    value={numPedido} 
                    onChange={e => setNumPedido(e.target.value)}
                    placeholder="000000" 
                    className="bg-transparent outline-none w-full font-bold text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Nº OS do Sistema Principal</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border mt-1.5 ${clean ? 'bg-slate-50' : 'bg-black/20 border-slate-800'}`}>
                  <Hash size={18} className="text-blue-500" />
                  <input 
                    type="text" 
                    value={numSistema} 
                    onChange={e => setNumSistema(e.target.value)}
                    placeholder="Ex: 5020" 
                    className="bg-transparent outline-none w-full font-bold text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={confirmarFaturamento}
                disabled={salvando || !numPedido}
                className="w-full py-5 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-30 mt-4"
              >
                {salvando ? 'Salvando...' : 'Confirmar Faturamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU INFERIOR FIXO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
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

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-1 transition-all ${
      ativo ? 'text-blue-500 scale-110' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className={`mt-1 text-[9px] font-black uppercase tracking-tighter ${ativo ? 'opacity-100' : 'opacity-60'}`}>
        {titulo}
      </span>
    </button>
  )
}