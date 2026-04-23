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

    const { data: dadosUsuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('nome, perfil, usuario')
      .eq('usuario', usuarioSalvo)
      .single()

    if (!erroUsuario && dadosUsuario) {
      setUsuarioLogado(dadosUsuario)
    }

    const { data: dadosOrdens, error: erroOrdens } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false })

    if (erroOrdens) {
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

  const nomeExibicao = usuarioLogado?.nome || 'Nome do Usuário'
  const perfilExibicao = usuarioLogado?.perfil || 'Administrador'

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const totalResumo = emAndamento + parado + finalizados

  const percentual = (valor: number) => {
    if (totalResumo === 0) return 0
    return Math.round((valor / totalResumo) * 100)
  }

  const percentualEmAndamento = percentual(emAndamento)
  const percentualParado = percentual(parado)
  const percentualFinalizados = percentual(finalizados)

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

  const tituloTabela =
    filtroStatus === 'em_andamento'
      ? 'Ordens em andamento'
      : filtroStatus === 'parado'
      ? 'Ordens paradas'
      : filtroStatus === 'finalizado'
      ? 'Ordens finalizadas'
      : 'Últimas Ordens de Serviço'

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden md:flex w-72 bg-white border-r flex-col justify-between">
        <div>
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Sistema OS</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestão de Ordens de Serviço
            </p>
          </div>

          <nav className="p-4 space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-medium">
              Dashboard
            </button>

            <button
              onClick={() => router.push('/ordens')}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100"
            >
              Ordem de Serviço
            </button>

            <button
              onClick={() => router.push('/faturamento')}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100"
            >
              Faturamento
            </button>

            <button
            onClick={() => router.push('/configuracao')}
            className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-100"
            >
             Configuração
           </button>
          </nav>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {nomeExibicao.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold text-sm">{nomeExibicao}</p>
              <p className="text-xs text-slate-500">{perfilExibicao}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Olá, {nomeExibicao}! 👋
            </h1>

            <p className="text-slate-500 mt-2">
              Aqui está o resumo das ordens de serviço da empresa.
            </p>
          </div>

          <button
            onClick={sairSistema}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-medium"
          >
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <DashboardCard
            titulo="Em andamento"
            valor={emAndamento}
            subtitulo="Ordens ativas"
          />

          <DashboardCard
            titulo="Parado"
            valor={parado}
            subtitulo="Ordens"
          />

          <DashboardCard
            titulo="Finalizados"
            valor={finalizados}
            subtitulo="Este mês"
          />

          <DashboardCard
            titulo="Cancelados"
            valor={cancelados}
            subtitulo="Este mês"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{tituloTabela}</h2>

              <div className="flex gap-2">
                {filtroStatus !== 'todas' && (
                  <button
                    onClick={() => setFiltroStatus('todas')}
                    className="text-sm bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded-xl"
                  >
                    Limpar filtro
                  </button>
                )}

                <button
                  onClick={() => router.push('/ordens')}
                  className="text-blue-600 font-medium"
                >
                  Ver todas
                </button>
              </div>
            </div>

            {carregando ? (
              <p>Carregando...</p>
            ) : ordensFiltradas.length === 0 ? (
              <p>Nenhuma ordem encontrada para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-3">OS</th>
                      <th>Cliente</th>
                      <th>Máquina</th>
                      <th>Status</th>
                      <th>Data de abertura</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordensFiltradas.slice(0, 5).map((ordem) => (
                      <tr
                        key={ordem.id}
                        className="border-b cursor-pointer hover:bg-slate-50"
                        onClick={() => router.push(`/ordens/${ordem.id}`)}
                      >
                        <td className="py-4">{ordem.numero_os ?? '-'}</td>
                        <td>{ordem.cliente}</td>
                        <td>{ordem.maquina}</td>
                        <td>
                          <span className={badgeStatus(ordem.status)}>
                            {ordem.status === 'Aguardando material'
                              ? 'Parado'
                              : ordem.status}
                          </span>
                        </td>
                        <td>{formatarData(ordem.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t">
              <ResumoMiniCard valor={ordens.length} titulo="Total de ordens" />
              <ResumoMiniCard
                valor={ordens.length}
                titulo="Abertas este mês"
              />
              <ResumoMiniCard
                valor={finalizados}
                titulo="Finalizadas este mês"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Ordem de Serviços</h2>

              <div className="space-y-4">
                <button
                  onClick={() => router.push('/nova-os')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium text-left px-5"
                >
                  Nova ordem de serviço
                </button>

                <button
                  onClick={() => setFiltroStatus('em_andamento')}
                  className={`w-full border py-4 rounded-2xl font-medium text-left px-5 ${
                    filtroStatus === 'em_andamento'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : ''
                  }`}
                >
                  Serviço em andamento
                </button>

                <button
                  onClick={() => setFiltroStatus('parado')}
                  className={`w-full border py-4 rounded-2xl font-medium text-left px-5 ${
                    filtroStatus === 'parado'
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : ''
                  }`}
                >
                  Serviço parado
                </button>

                <button
                  onClick={() => setFiltroStatus('finalizado')}
                  className={`w-full border py-4 rounded-2xl font-medium text-left px-5 ${
                    filtroStatus === 'finalizado'
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : ''
                  }`}
                >
                  Serviço finalizado
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">Resumo do mês</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Finalizadas</span>
                    <span className="font-semibold">
                      {finalizados} ({percentualFinalizados}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-green-500 rounded-full"
                      style={{ width: `${percentualFinalizados}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Em andamento</span>
                    <span className="font-semibold">
                      {emAndamento} ({percentualEmAndamento}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-blue-600 rounded-full"
                      style={{ width: `${percentualEmAndamento}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Parados</span>
                    <span className="font-semibold">
                      {parado} ({percentualParado}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-yellow-500 rounded-full"
                      style={{ width: `${percentualParado}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function DashboardCard({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string
  valor: number
  subtitulo: string
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6">
      <p className="text-slate-500">{titulo}</p>
      <p className="text-4xl font-bold mt-3">{valor}</p>
      <p className="text-slate-400 mt-2">{subtitulo}</p>
    </div>
  )
}

function ResumoMiniCard({
  valor,
  titulo,
}: {
  valor: number
  titulo: string
}) {
  return (
    <div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-slate-500">{titulo}</p>
    </div>
  )
}

function badgeStatus(status: string) {
  if (status === 'Em andamento') {
    return 'inline-block px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700'
  }

  if (status === 'Finalizado') {
    return 'inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-700'
  }

  if (status === 'Cancelado') {
    return 'inline-block px-3 py-1 rounded-full text-sm bg-red-100 text-red-700'
  }

  if (status === 'Aguardando material') {
    return 'inline-block px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700'
  }

  return 'inline-block px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700'
}