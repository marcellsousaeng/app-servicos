'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
// Importação de ícones profissionais
import { 
  LogOut, 
  Plus, 
  ClipboardList, 
  CircleDollarSign, 
  Settings, 
  RefreshCcw, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle,
  LayoutGrid,
  User,
  ArrowUpRight
} from 'lucide-react'

type Usuario = {
  nome: string
  perfil: string
  usuario: string
}

type Ordem = {
  id: number
  numero_os: number | null
  cliente: string
  maquina: string
  status: string
  created_at: string
}

type FiltroStatus = 'todas' | 'em_andamento' | 'parado' | 'finalizado'

export default function DashboardPage() {
  const router = useRouter()
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null)
  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [contadores, setContadores] = useState({ andamento: 0, parado: 0, finalizado: 0, cancelado: 0 })
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas')
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  useEffect(() => {
    // Sincroniza tema
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDashboard()
  }, [])

  async function carregarDashboard() {
    setCarregando(true)
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      router.push('/')
      return
    }

    const { data: dadosUsuario } = await supabase
      .from('usuarios')
      .select('nome, perfil, usuario')
      .eq('usuario', usuarioSalvo)
      .single()

    if (dadosUsuario) setUsuarioLogado(dadosUsuario)

    const { data: dadosOrdens } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false })

    const lista = dadosOrdens || []
    setOrdens(lista)
    setContadores({
      andamento: lista.filter(o => o.status === 'Em andamento').length,
      parado: lista.filter(o => o.status === 'Aguardando material').length,
      finalizado: lista.filter(o => o.status === 'Finalizado').length,
      cancelado: lista.filter(o => o.status === 'Cancelado').length
    })
    setCarregando(false)
  }

  const clean = tema === 'clean'

  const ordensFiltradas = useMemo(() => {
    if (filtroStatus === 'em_andamento') return ordens.filter(o => o.status === 'Em andamento')
    if (filtroStatus === 'parado') return ordens.filter(o => o.status === 'Aguardando material')
    if (filtroStatus === 'finalizado') return ordens.filter(o => o.status === 'Finalizado')
    return ordens
  }, [ordens, filtroStatus])

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight italic">SISTEMA OS</h1>
            <p className={`text-sm font-bold uppercase tracking-widest ${clean ? 'text-slate-400' : 'text-blue-400/60'}`}>
              Dashboard
            </p>
          </div>

          <button
            onClick={() => { localStorage.removeItem('usuario'); router.push('/') }}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${
              clean ? 'bg-white border-slate-200 text-rose-500 shadow-sm' : 'bg-[#0d1a2d] border-rose-500/30 text-rose-400'
            }`}
          >
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase">Sair</span>
          </button>
        </div>

        {/* CARD PERFIL & ATALHOS */}
        <div className={`rounded-3xl p-6 mb-6 shadow-2xl border transition-all ${
          clean 
            ? 'bg-white border-slate-100' 
            : 'bg-gradient-to-br from-[#111d31] to-[#0a1220] border-blue-500/20'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="min-w-0">
              <p className={`text-sm font-medium ${clean ? 'text-slate-500' : 'text-blue-300'}`}>Bem-vindo de volta,</p>
              <p className="text-2xl font-black truncate">{usuarioLogado?.nome || 'Usuário'}</p>
              <p className={`text-xs mt-1 font-bold uppercase tracking-tighter opacity-60`}>
                {usuarioLogado?.perfil || 'Acesso Padrão'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <User size={28} strokeWidth={2.5} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Atalho clean={clean} destaque titulo="Nova OS" Icone={Plus} onClick={() => router.push('/nova-os')} />
            <Atalho clean={clean} titulo="Ordens" Icone={ClipboardList} onClick={() => router.push('/ordens')} />
            <Atalho clean={clean} titulo="Faturam." Icone={CircleDollarSign} onClick={() => router.push('/faturamento')} />
            <Atalho clean={clean} titulo="Config." Icone={Settings} onClick={() => router.push('/configuracao')} />
          </div>
        </div>

        {/* INDICADORES */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <CardMini 
            clean={clean} titulo="Ativas" valor={contadores.andamento} 
            Icone={Play} cor="blue" onClick={() => setFiltroStatus('em_andamento')} 
          />
          <CardMini 
            clean={clean} titulo="Paradas" valor={contadores.parado} 
            Icone={Pause} cor="amber" onClick={() => setFiltroStatus('parado')} 
          />
          <CardMini 
            clean={clean} titulo="Finalizadas" valor={contadores.finalizado} 
            Icone={CheckCircle2} cor="emerald" onClick={() => setFiltroStatus('finalizado')} 
          />
          <CardMini 
            clean={clean} titulo="Canceladas" valor={contadores.cancelado} 
            Icone={XCircle} cor="rose" onClick={() => setFiltroStatus('todas')} 
          />
        </div>

        {/* LISTAGEM RÁPIDA */}
        <section className={`rounded-3xl border shadow-xl overflow-hidden ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
        }`}>
          <div className="p-5 flex items-center justify-between border-b border-slate-500/10">
            <h2 className="font-black text-lg uppercase tracking-tight">Recentes</h2>
            <button onClick={() => router.push('/ordens')} className="text-blue-500 text-xs font-bold uppercase flex items-center gap-1">
              Ver tudo <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {carregando ? (
              <div className="py-10 text-center animate-pulse text-slate-500">Sincronizando...</div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm italic">Nenhum registro encontrado.</div>
            ) : (
              ordensFiltradas.slice(0, 3).map((ordem) => (
                <div 
                  key={ordem.id} 
                  onClick={() => router.push(`/ordens/${ordem.id}`)}
                  className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    clean ? 'bg-slate-50 border-slate-100' : 'bg-[#111c2e] border-slate-700/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-blue-500">#{ordem.numero_os ?? ordem.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                      ordem.status === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {ordem.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">{ordem.cliente}</p>
                  <p className="text-xs opacity-50 truncate">{ordem.maquina}</p>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={carregarDashboard}
            className={`w-full py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              clean ? 'bg-slate-50 text-slate-400' : 'bg-[#111c2e]/50 text-slate-500'
            }`}
          >
            <RefreshCcw size={12} /> Atualizar dados
          </button>
        </section>
      </main>

      {/* MENU INFERIOR PADRONIZADO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 transition-colors ${
        clean ? 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuItem ativo titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => {}} />
          <MenuItem titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

/* COMPONENTES DE APOIO */

function Atalho({ titulo, Icone, onClick, destaque, clean }: any) {
  return (
    <button
      onClick={onClick}
      className={`h-22 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-90 border ${
        destaque 
          ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20' 
          : clean 
            ? 'bg-slate-50 border-slate-100 text-slate-600' 
            : 'bg-[#121c2c] border-slate-700 text-slate-300'
      }`}
    >
      <Icone size={destaque ? 28 : 22} strokeWidth={destaque ? 3 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function CardMini({ titulo, valor, Icone, cor, clean, onClick }: any) {
  const cores: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  }

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-3xl border text-left transition-all active:scale-95 ${
        clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 border ${cores[cor]}`}>
        <Icone size={16} strokeWidth={2.5} />
      </div>
      <p className="text-2xl font-black">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{titulo}</p>
    </button>
  )
}

function MenuItem({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-colors ${
      ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-tighter ${ativo ? 'opacity-100' : 'opacity-60'}`}>
        {titulo}
      </span>
    </button>
  )
}