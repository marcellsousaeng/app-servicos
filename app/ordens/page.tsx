'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type OrdemServico = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  status: string
  created_at: string
}

export default function OrdensPage() {
  const router = useRouter()

  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarOrdens()
  }, [])

  async function carregarOrdens() {
    setCarregando(true)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      alert('Erro ao carregar ordens')
      setCarregando(false)
      return
    }

    setOrdens(data || [])
    setCarregando(false)
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-28">
      <main className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-start gap-3 mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-11 h-11 rounded-2xl bg-[#0d1726] border border-slate-700 flex items-center justify-center text-lg shrink-0"
          >
            ←
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">
              Ordens de Serviço
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Acompanhe todas as ordens cadastradas
            </p>
          </div>

          <button
            onClick={() => router.push('/nova-os')}
            className="bg-blue-600 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg shrink-0"
          >
            + Nova
          </button>
        </div>

        <section className="bg-[#0d1726] rounded-3xl border border-slate-700/70 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                📋
              </div>

              <h2 className="font-bold text-lg">Ordens cadastradas</h2>
            </div>

            <button
              onClick={carregarOrdens}
              className="w-10 h-10 rounded-2xl bg-[#111c2e] border border-slate-700 flex items-center justify-center"
            >
              ↻
            </button>
          </div>

          <div className="p-4 space-y-3">
            {carregando ? (
              <div className="py-10 text-center text-slate-500">
                Carregando ordens...
              </div>
            ) : ordens.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                Nenhuma ordem encontrada
              </div>
            ) : (
              ordens.map((ordem) => (
                <button
                  key={ordem.id}
                  onClick={() => router.push(`/ordens/${ordem.id}`)}
                  className="w-full bg-[#111c2e] border border-slate-700/70 rounded-2xl p-4 text-left active:scale-[0.98] transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold shrink-0">
                        {ordem.numero_os ?? ordem.id}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {ordem.cliente}
                        </p>
                        <p className="text-xs text-slate-500">
                          OS #{ordem.numero_os ?? ordem.id}
                        </p>
                      </div>
                    </div>

                    <span className={badgeStatus(ordem.status)}>
                      {ordem.status === 'Aguardando material'
                        ? 'Parado'
                        : ordem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <InfoLinha titulo="Solicitante" texto={ordem.solicitante || '-'} />
                    <InfoLinha titulo="Máquina" texto={ordem.maquina} />
                    <InfoLinha titulo="Data de entrada" texto={formatarData(ordem.created_at)} />
                  </div>

                  <div className="mt-3 text-blue-400 text-sm font-medium">
                    Abrir relatório →
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="p-5 border-t border-slate-700 flex items-center justify-center text-sm text-slate-400">
            📄 Total de ordens: {ordens.length}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1423]/95 backdrop-blur border-t border-slate-700 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem
            titulo="Dashboard"
            icone="▦"
            onClick={() => router.push('/dashboard')}
          />

          <MenuItem
            titulo="Ordens"
            icone="📋"
            ativo
            onClick={() => router.push('/ordens')}
          />

          <MenuItem
            titulo="Faturamento"
            icone="$"
            onClick={() => router.push('/faturamento')}
          />

          <MenuItem
            titulo="Config."
            icone="⚙️"
            onClick={() => router.push('/configuracao')}
          />
        </div>
      </nav>
    </div>
  )
}

function InfoLinha({
  titulo,
  texto,
}: {
  titulo: string
  texto: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0">
      <span className="text-slate-500 text-xs">{titulo}</span>
      <span className="text-slate-200 text-sm text-right break-words">
        {texto}
      </span>
    </div>
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
      className={`py-2 rounded-2xl text-xs flex flex-col items-center justify-center gap-1 ${
        ativo ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'
      }`}
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}

function badgeStatus(status: string) {
  if (status === 'Em andamento') {
    return 'shrink-0 px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400'
  }

  if (status === 'Finalizado') {
    return 'shrink-0 px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400'
  }

  if (status === 'Cancelado') {
    return 'shrink-0 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400'
  }

  if (status === 'Aguardando material') {
    return 'shrink-0 px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400'
  }

  return 'shrink-0 px-3 py-1 rounded-full text-xs bg-slate-500/20 text-slate-300'
}