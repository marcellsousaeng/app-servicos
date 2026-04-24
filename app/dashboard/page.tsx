'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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
  const [emAndamento, setEmAndamento] = useState(0)
  const [parado, setParado] = useState(0)
  const [finalizados, setFinalizados] = useState(0)
  const [cancelados, setCancelados] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas')

  useEffect(() => {
    carregarDashboard()
  }, [])

  const carregarDashboard = async () => {
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

    if (dadosUsuario) {
      setUsuarioLogado(dadosUsuario)
    }

    const { data: dadosOrdens, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      alert('Erro ao carregar dashboard')
      setCarregando(false)
      return
    }

    const lista = dadosOrdens || []

    setOrdens(lista)
    setEmAndamento(lista.filter((o) => o.status === 'Em andamento').length)
    setParado(lista.filter((o) => o.status === 'Aguardando material').length)
    setFinalizados(lista.filter((o) => o.status === 'Finalizado').length)
    setCancelados(lista.filter((o) => o.status === 'Cancelado').length)

    setCarregando(false)
  }

  const sairSistema = () => {
    localStorage.removeItem('usuario')
    router.push('/')
  }

  const nomeExibicao = usuarioLogado?.nome || 'Usuário'
  const perfilExibicao = usuarioLogado?.perfil || 'Perfil'

  const ordensFiltradas = useMemo(() => {
    if (filtroStatus === 'em_andamento') {
      return ordens.filter((o) => o.status === 'Em andamento')
    }

    if (filtroStatus === 'parado') {
      return ordens.filter((o) => o.status === 'Aguardando material')
    }

    if (filtroStatus === 'finalizado') {
      return ordens.filter((o) => o.status === 'Finalizado')
    }

    return ordens
  }, [ordens, filtroStatus])

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-24">
      <main className="max-w-md mx-auto px-4 pt-6">
        {/* TOPO */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Sistema OS</h1>
            <p className="text-sm text-slate-400">Dashboard</p>
          </div>

          <button
            onClick={sairSistema}
            className="bg-[#121c2c] border border-red-500/30 text-red-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
          >
            ↪ Sair
          </button>
        </div>

        {/* CARD USUÁRIO */}
        <div className="bg-gradient-to-br from-[#111c2e] to-[#183a91] rounded-2xl p-5 mb-4 shadow-lg border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold">
                Olá, {nomeExibicao}! 👋
              </p>
              <p className="text-sm text-slate-300 mt-1">
                {perfilExibicao}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
              👤
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-5">
            <Atalho
              titulo="Ordens"
              icone="📋"
              onClick={() => router.push('/ordens')}
            />

            <Atalho
              titulo="Faturamento"
              icone="💲"
              onClick={() => router.push('/faturamento')}
            />

            <Atalho
              titulo="Configuração"
              icone="⚙️"
              onClick={() => router.push('/configuracao')}
            />

            <AtalhoAzul
              titulo="Nova OS"
              icone="➕"
              onClick={() => router.push('/nova-os')}
            />
          </div>
        </div>

        {/* CARDS RESUMO */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <CardResumo
            titulo="Em andamento"
            valor={emAndamento}
            subtitulo="Ordens ativas"
            icone="⟳"
            cor="blue"
            onClick={() => setFiltroStatus('em_andamento')}
          />

          <CardResumo
            titulo="Parado"
            valor={parado}
            subtitulo="Ordens"
            icone="Ⅱ"
            cor="purple"
            onClick={() => setFiltroStatus('parado')}
          />

          <CardResumo
            titulo="Finalizados"
            valor={finalizados}
            subtitulo="Este mês"
            icone="✓"
            cor="green"
            onClick={() => setFiltroStatus('finalizado')}
          />

          <CardResumo
            titulo="Cancelados"
            valor={cancelados}
            subtitulo="Este mês"
            icone="×"
            cor="red"
            onClick={() => setFiltroStatus('todas')}
          />
        </div>

        {/* ÚLTIMAS ORDENS */}
        <section className="bg-[#0d1726] rounded-2xl p-4 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              Últimas Ordens de Serviço
            </h2>

            <button
              onClick={() => router.push('/ordens')}
              className="text-blue-400 text-sm"
            >
              Ver todas →
            </button>
          </div>

          {carregando ? (
            <p className="text-slate-400 text-center py-8">
              Carregando...
            </p>
          ) : ordensFiltradas.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-slate-500 flex items-center justify-center text-2xl mb-3">
                📄
              </div>
              <p className="font-semibold text-slate-300">
                Nenhuma ordem encontrada
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ajuste os filtros ou crie uma nova OS
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordensFiltradas.slice(0, 4).map((ordem) => (
                <div
                  key={ordem.id}
                  onClick={() => router.push(`/ordens/${ordem.id}`)}
                  className="bg-[#111c2e] border border-slate-700/70 rounded-2xl p-4 active:scale-[0.98] transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">OS #{ordem.numero_os ?? '-'}</p>
                    <span className={badgeStatus(ordem.status)}>
                      {ordem.status === 'Aguardando material'
                        ? 'Parado'
                        : ordem.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300">
                    Cliente: {ordem.cliente}
                  </p>
                  <p className="text-sm text-slate-400">
                    Máquina: {ordem.maquina}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setFiltroStatus('todas')}
            className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-blue-600 shadow-xl flex items-center justify-center text-2xl"
          >
            🔽
          </button>
        </section>
      </main>

      {/* MENU INFERIOR MOBILE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1423]/95 backdrop-blur border-t border-slate-700 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem ativo titulo="Dashboard" icone="▦" onClick={() => router.push('/dashboard')} />
          <MenuItem titulo="Ordens" icone="📋" onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturamento" icone="💲" onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." icone="⚙️" onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function Atalho({
  titulo,
  icone,
  onClick,
}: {
  titulo: string
  icone: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[#121c2c] border border-slate-700 rounded-xl p-3 text-center active:scale-95"
    >
      <div className="text-lg mb-1">{icone}</div>
      <p className="text-[11px] text-slate-300">{titulo}</p>
    </button>
  )
}

function AtalhoAzul({
  titulo,
  icone,
  onClick,
}: {
  titulo: string
  icone: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 border border-blue-400/30 rounded-xl p-3 text-center active:scale-95"
    >
      <div className="text-lg mb-1">{icone}</div>
      <p className="text-[11px] text-white">{titulo}</p>
    </button>
  )
}

function CardResumo({
  titulo,
  valor,
  subtitulo,
  icone,
  cor,
  onClick,
}: {
  titulo: string
  valor: number
  subtitulo: string
  icone: string
  cor: 'blue' | 'purple' | 'green' | 'red'
  onClick: () => void
}) {
  const cores = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <button
      onClick={onClick}
      className="bg-[#0d1726] rounded-2xl p-4 border border-slate-700/60 text-left shadow-lg active:scale-[0.98]"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm ${cores[cor].split(' ')[0]}`}>
            {titulo}
          </p>
          <p className="text-3xl font-bold mt-3">{valor}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>
        </div>

        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${cores[cor]}`}>
          {icone}
        </div>
      </div>
    </button>
  )
}

function MenuItem({
  titulo,
  icone,
  ativo,
  onClick,
}: {
  titulo: string
  icone: string
  ativo?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-xl text-xs flex flex-col items-center gap-1 ${
        ativo ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'
      }`}
    >
      <span className="text-lg">{icone}</span>
      {titulo}
    </button>
  )
}

function badgeStatus(status: string) {
  if (status === 'Em andamento') {
    return 'px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400'
  }

  if (status === 'Finalizado') {
    return 'px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400'
  }

  if (status === 'Cancelado') {
    return 'px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400'
  }

  if (status === 'Aguardando material') {
    return 'px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400'
  }

  return 'px-3 py-1 rounded-full text-xs bg-slate-500/20 text-slate-300'
}