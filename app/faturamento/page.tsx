'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
// Importação dos ícones modernos
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Info,
  LayoutGrid,
  ClipboardList,
  CircleDollarSign,
  Settings
} from 'lucide-react'

type OrdemFaturamento = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  status: string
  created_at: string
  faturado: boolean | null
}

type Usuario = {
  usuario: string
  nome: string
  perfil: string
}

export default function FaturamentoPage() {
  const router = useRouter()

  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null)
  const [ordens, setOrdens] = useState<OrdemFaturamento[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  // Sincronização do Tema com a página de configurações
  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)

    carregarPagina()
  }, [])

  async function carregarPagina() {
    setCarregando(true)
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      router.push('/')
      return
    }

    const { data: dadosUsuario } = await supabase
      .from('usuarios')
      .select('usuario, nome, perfil')
      .eq('usuario', usuarioSalvo)
      .single()

    if (!dadosUsuario) {
      router.push('/')
      return
    }

    setUsuarioLogado(dadosUsuario)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status', 'Finalizado')
      .order('numero_os', { ascending: false })

    if (error) {
      console.error('Erro ao carregar faturamento')
      setCarregando(false)
      return
    }

    setOrdens(data || [])
    setCarregando(false)
  }

  const clean = tema === 'clean'
  const podeEditar = usuarioLogado?.perfil === 'Faturamento'

  const ordensFiltradas = ordens.filter((ordem) => {
    const texto = `${ordem.cliente} ${ordem.solicitante} ${ordem.maquina}`.toLowerCase()
    return texto.includes(busca.toLowerCase())
  })

  async function alterarFaturamento(id: number, novoValor: boolean) {
    if (!podeEditar) return

    const { error } = await supabase
      .from('ordens_servico')
      .update({ faturado: novoValor })
      .eq('id', id)

    if (!error) {
      setOrdens(lista => lista.map(o => o.id === id ? { ...o, faturado: novoValor } : o))
    }
  }

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${
      clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'
    }`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* TOPO / HEADER */}
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1a2d] border-slate-800 text-white'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Faturamento</h1>
              <p className={`text-sm ${clean ? 'text-slate-500' : 'text-slate-400'}`}>
                Ordens finalizadas
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/30">
              {usuarioLogado?.nome?.charAt(0).toUpperCase()}
            </div>
            <p className="text-[10px] font-bold mt-1 uppercase tracking-wider">{usuarioLogado?.perfil}</p>
          </div>
        </div>

        {/* ALERTA DE VISUALIZAÇÃO */}
        {!podeEditar && !carregando && (
          <section className={`rounded-2xl p-4 border mb-6 flex gap-3 items-center ${
            clean ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
          }`}>
            <Info size={20} className="shrink-0" />
            <p className="text-xs leading-relaxed">
              Somente o perfil <strong>Faturamento</strong> pode alterar o status.
            </p>
          </section>
        )}

        {/* BUSCA */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all ${
            clean ? 'bg-white border-slate-200 focus-within:border-blue-500' : 'bg-[#0d1726] border-slate-800 focus-within:border-blue-500'
          }`}>
            <Search size={18} className="text-slate-500" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente, máquina..."
              className="w-full bg-transparent outline-none text-sm placeholder:text-slate-500"
            />
          </div>
          <button className={`w-12 rounded-2xl border flex items-center justify-center ${
            clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-800 text-slate-400'
          }`}>
            <ChevronDown size={20} />
          </button>
        </div>

        {/* LISTA DE CARDS */}
        {carregando ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
        ) : (
          <div className="space-y-4">
            {ordensFiltradas.map((ordem) => (
              <section key={ordem.id} className={`rounded-3xl p-5 border transition-all ${
                clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0b1628] border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-blue-600/10 text-blue-500 px-3 py-1 rounded-lg text-sm font-bold">
                    # {ordem.numero_os ?? ordem.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs opacity-60">
                    <Calendar size={14} />
                    {new Date(ordem.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b border-slate-500/10 pb-2">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Cliente</p>
                    <p className="font-bold text-sm">{ordem.cliente}</p>
                  </div>
                  <div className="border-b border-slate-500/10 pb-2">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Solicitante</p>
                    <p className="font-semibold text-sm">{ordem.solicitante || '-'}</p>
                  </div>
                  <div className="pb-1">
                    <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Máquina</p>
                    <p className="font-semibold text-sm">{ordem.maquina}</p>
                  </div>
                </div>

                {/* BOTÕES DE STATUS */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={() => alterarFaturamento(ordem.id, true)}
                    disabled={!podeEditar}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                      ordem.faturado === true
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                        : clean ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'
                    } ${!podeEditar && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <CheckCircle2 size={16} /> Faturado
                  </button>

                  <button
                    onClick={() => alterarFaturamento(ordem.id, false)}
                    disabled={!podeEditar}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                      ordem.faturado === false
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                        : clean ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500'
                    } ${!podeEditar && 'opacity-50 cursor-not-allowed'}`}
                  >
                    <XCircle size={16} /> Não faturado
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* MENU INFERIOR FIXO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 ${
        clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuItem clean={clean} titulo="Dashboard" Icone={LayoutGrid} onClick={() => router.push('/dashboard')} />
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
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 ${
      ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={24} strokeWidth={ativo ? 2.5 : 2} />
      <span className="mt-1 text-[10px] font-medium">{titulo}</span>
    </button>
  )
}