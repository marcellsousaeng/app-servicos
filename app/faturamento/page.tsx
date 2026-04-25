'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema') as 'dark' | 'clean' | null
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
      alert('Erro ao carregar faturamento')
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

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  async function alterarFaturamento(id: number, novoValor: boolean) {
    if (!podeEditar) {
      alert('Somente o perfil Faturamento pode alterar esse campo.')
      return
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update({ faturado: novoValor })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar faturamento')
      return
    }

    setOrdens((lista) =>
      lista.map((ordem) =>
        ordem.id === id ? { ...ordem, faturado: novoValor } : ordem
      )
    )
  }

  return (
    <div
      className={`min-h-screen pb-28 ${
        clean ? 'bg-slate-100 text-slate-900' : 'bg-[#07111f] text-white'
      }`}
    >
      <main className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
              clean ? 'bg-white border-slate-300' : 'bg-[#0d1726] border-slate-700'
            }`}
          >
            ←
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">Faturamento</h1>
            <p className={clean ? 'text-sm text-slate-500' : 'text-sm text-slate-400'}>
              Controle das ordens de serviço finalizadas
            </p>
          </div>

          <div className="text-right">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold ml-auto">
              {usuarioLogado?.nome?.charAt(0).toUpperCase() || 'U'}
            </div>
            <p className="text-xs font-semibold mt-1">{usuarioLogado?.nome}</p>
            <p className={clean ? 'text-xs text-slate-500' : 'text-xs text-slate-400'}>
              Perfil: {usuarioLogado?.perfil}
            </p>
          </div>
        </div>

        {!podeEditar && !carregando && (
          <section
            className={`rounded-2xl p-4 border mb-4 ${
              clean
                ? 'bg-yellow-50 border-yellow-300 text-yellow-900'
                : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
            }`}
          >
            <div className="flex gap-3">
              <span className="text-2xl">ⓘ</span>
              <div>
                <p className="font-bold">Você está apenas visualizando.</p>
                <p className="text-sm mt-1">
                  Somente usuários com perfil <strong>Faturamento</strong> podem
                  alterar o status de faturado.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-3 mb-4">
          <div
            className={`flex-1 rounded-2xl border px-4 py-3 flex items-center gap-3 ${
              clean ? 'bg-white border-slate-300' : 'bg-[#0d1726] border-slate-700'
            }`}
          >
            <span className={clean ? 'text-slate-400' : 'text-slate-500'}>🔍</span>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, solicitante, máquina..."
              className={`w-full bg-transparent outline-none text-sm ${
                clean
                  ? 'text-slate-900 placeholder:text-slate-400'
                  : 'text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          <button
            className={`w-12 rounded-2xl border flex items-center justify-center ${
              clean ? 'bg-white border-slate-300' : 'bg-[#0d1726] border-slate-700'
            }`}
          >
            ⏷
          </button>
        </div>

        {carregando ? (
          <p className="text-center py-10">Carregando...</p>
        ) : ordensFiltradas.length === 0 ? (
          <section
            className={`rounded-3xl p-6 border text-center ${
              clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'
            }`}
          >
            Nenhuma OS finalizada encontrada.
          </section>
        ) : (
          <div className="space-y-4">
            {ordensFiltradas.map((ordem) => (
              <section
                key={ordem.id}
                className={`rounded-3xl p-5 border shadow-xl ${
                  clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700/70'
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <p className="text-blue-500 font-bold">
                    # {ordem.numero_os ?? ordem.id}
                  </p>

                  <p className={clean ? 'text-sm text-slate-500' : 'text-sm text-slate-400'}>
                    📅 {formatarData(ordem.created_at)}
                  </p>
                </div>

                <InfoLinha clean={clean} titulo="Cliente" texto={ordem.cliente} />
                <InfoLinha clean={clean} titulo="Solicitante" texto={ordem.solicitante || '-'} />
                <InfoLinha clean={clean} titulo="Máquina" texto={ordem.maquina} />

                <div className="mt-4 pt-4 border-t border-slate-700/30">
                  <p className={clean ? 'text-xs text-slate-500 mb-2' : 'text-xs text-slate-400 mb-2'}>
                    Status
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => alterarFaturamento(ordem.id, true)}
                      disabled={!podeEditar}
                      className={`py-3 rounded-xl text-sm font-semibold ${
                        ordem.faturado
                          ? 'bg-green-600 text-white'
                          : clean
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-green-600/20 text-green-400'
                      } ${!podeEditar ? 'opacity-80' : ''}`}
                    >
                      ✓ Faturado
                    </button>

                    <button
                      onClick={() => alterarFaturamento(ordem.id, false)}
                      disabled={!podeEditar}
                      className={`py-3 rounded-xl text-sm font-semibold ${
                        ordem.faturado === false
                          ? 'bg-red-600 text-white'
                          : clean
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-red-600/20 text-red-400'
                      } ${!podeEditar ? 'opacity-80' : ''}`}
                    >
                      ⊗ Não faturado
                    </button>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <nav
        className={`fixed bottom-0 left-0 right-0 border-t px-3 py-2 ${
          clean
            ? 'bg-white/95 border-slate-200'
            : 'bg-[#0b1423]/95 border-slate-700'
        }`}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem clean={clean} titulo="Dashboard" icone="▦" onClick={() => router.push('/dashboard')} />
          <MenuItem clean={clean} titulo="Ordens" icone="📅" onClick={() => router.push('/ordens')} />
          <MenuItem clean={clean} titulo="Faturamento" ativo icone="📄" onClick={() => router.push('/faturamento')} />
          <MenuItem clean={clean} titulo="Config." icone="⚙️" onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function InfoLinha({
  titulo,
  texto,
  clean,
}: {
  titulo: string
  texto: string
  clean: boolean
}) {
  return (
    <div className={`py-3 border-b last:border-b-0 ${
      clean ? 'border-slate-200' : 'border-slate-700/50'
    }`}>
      <p className={clean ? 'text-xs text-slate-500' : 'text-xs text-slate-400'}>
        {titulo}
      </p>
      <p className="font-semibold text-sm mt-1">{texto}</p>
    </div>
  )
}

function MenuItem({
  titulo,
  icone,
  ativo,
  clean,
  onClick,
}: {
  titulo: string
  icone: string
  ativo?: boolean
  clean: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-2xl text-xs flex flex-col items-center justify-center gap-1 ${
        ativo
          ? 'bg-blue-600/20 text-blue-500'
          : clean
          ? 'text-slate-500'
          : 'text-slate-400'
      }`}
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}