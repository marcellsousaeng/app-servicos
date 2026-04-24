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
        {/* TOPO */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-12 h-12 rounded-2xl bg-[#0d1726] border border-slate-700 flex items-center justify-center text-xl"
          >
            ←
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold leading-tight">
              Ordens de Serviço
            </h1>

            <p className="text-sm text-slate-400">
              Acompanhe todas as ordens cadastradas
            </p>
          </div>

          <button
            onClick={() => router.push('/nova-os')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg"
          >
            + Nova Ordem
          </button>
        </div>

        {/* CARD PRINCIPAL */}
        <section className="bg-[#0d1726] rounded-3xl border border-slate-700/70 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="p-5 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                📋
              </div>

              <div>
                <h2 className="font-bold text-lg">
                  Ordens cadastradas
                </h2>
              </div>
            </div>

            <button className="w-10 h-10 rounded-2xl bg-[#111c2e] border border-slate-700 flex items-center justify-center">
              🔍
            </button>
          </div>

          {/* TABELA */}
          <div className="px-4">
            <div className="grid grid-cols-5 gap-2 text-xs text-slate-400 py-4 border-b border-slate-700">
              <span>N° OS</span>
              <span>Cliente</span>
              <span>Solicitante</span>
              <span>Máquina</span>
              <span>Data entrada</span>
            </div>

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
                  className="w-full grid grid-cols-5 gap-2 text-left py-5 border-b border-slate-800 hover:bg-[#101d30] transition"
                >
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold">
                      {ordem.numero_os ?? ordem.id}
                    </div>
                  </div>

                  <div className="text-sm leading-tight">
                    {ordem.cliente}
                  </div>

                  <div className="text-sm leading-tight">
                    {ordem.solicitante || '-'}
                  </div>

                  <div className="text-sm leading-tight flex items-center gap-2">
                    <span className="text-blue-400">🖥</span>
                    {ordem.maquina}
                  </div>

                  <div className="text-sm flex items-center justify-between">
                    {formatarData(ordem.created_at)}
                    <span className="text-blue-400 text-lg">›</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* RODAPÉ */}
          <div className="p-5 flex items-center justify-center text-sm text-slate-400">
            📄 Total de ordens: {ordens.length}
          </div>
        </section>
      </main>

      {/* BOTÃO FLUTUANTE */}
      <button
        className="fixed right-5 bottom-28 w-14 h-14 rounded-full bg-[#14233a] border border-blue-500/20 shadow-xl flex items-center justify-center text-xl"
        onClick={carregarOrdens}
      >
        ↻
      </button>

      {/* MENU INFERIOR */}
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
        ativo
          ? 'bg-blue-600/20 text-blue-400'
          : 'text-slate-400'
      }`}
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}