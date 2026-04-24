'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

type OrdemServico = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  descricao: string
  status: string
  cancelada: boolean
  motivo_cancelamento: string | null
  usuario_responsavel: string | null
  created_at: string
  foto_url?: string | null
}

type Atualizacao = {
  id: number
  created_at: string
  ordem_servico_id: number
  descricao: string
  material_utilizado: string | null
  tecnicos_responsaveis: string | null
  usuario_nome: string | null
}

type Usuario = {
  usuario: string
  nome: string
}

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [nomeResponsavel, setNomeResponsavel] = useState('-')
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [materialUtilizado, setMaterialUtilizado] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [salvandoAtualizacao, setSalvandoAtualizacao] = useState(false)
  const [modalAtualizacao, setModalAtualizacao] = useState(false)

  useEffect(() => {
    carregarDetalhes()
  }, [])

  async function carregarDetalhes() {
    const id = Number(params.id)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      alert('Erro ao carregar detalhes da OS')
      setCarregando(false)
      return
    }

    setOrdem(data)

    const { data: dadosUsuarios } = await supabase
      .from('usuarios')
      .select('usuario, nome')

    const usuarios = (dadosUsuarios || []) as Usuario[]

    const usuarioEncontrado = usuarios.find(
      (u) => u.usuario === data.usuario_responsavel
    )

    setNomeResponsavel(
      usuarioEncontrado?.nome || data.usuario_responsavel || '-'
    )

    const { data: dadosAtualizacoes } = await supabase
      .from('os_atualizacoes')
      .select('*')
      .eq('ordem_servico_id', id)
      .order('created_at', { ascending: false })

    setAtualizacoes(dadosAtualizacoes || [])
    setCarregando(false)
  }

  async function buscarNomeUsuario() {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) return 'Usuário'

    const { data } = await supabase
      .from('usuarios')
      .select('nome')
      .eq('usuario', usuarioSalvo)
      .single()

    return data?.nome || usuarioSalvo
  }

  async function salvarAtualizacao() {
    if (!ordem) return

    if (ordem.status === 'Finalizado') {
      alert('Não é possível adicionar atualizações em uma OS finalizada')
      return
    }

    if (!descricaoAtualizacao.trim()) {
      alert('Preencha a descrição da atualização')
      return
    }

    setSalvandoAtualizacao(true)

    const nomeUsuario = await buscarNomeUsuario()

    const { error } = await supabase.from('os_atualizacoes').insert([
      {
        ordem_servico_id: ordem.id,
        descricao: descricaoAtualizacao,
        material_utilizado: materialUtilizado,
        tecnicos_responsaveis: tecnicosResponsaveis,
        usuario_nome: nomeUsuario,
      },
    ])

    if (error) {
      alert('Erro ao salvar atualização')
      setSalvandoAtualizacao(false)
      return
    }

    setDescricaoAtualizacao('')
    setMaterialUtilizado('')
    setTecnicosResponsaveis('')
    setSalvandoAtualizacao(false)
    setModalAtualizacao(false)

    carregarDetalhes()
  }

  async function finalizarOS() {
    if (!ordem) return

    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'Finalizado',
        cancelada: false,
        motivo_cancelamento: null,
      })
      .eq('id', ordem.id)

    if (error) {
      alert('Erro ao finalizar OS')
      return
    }

    carregarDetalhes()
  }

  async function cancelarOS() {
    if (!ordem) return

    const motivo = prompt('Informe o motivo do cancelamento')

    if (!motivo) return

    const { error } = await supabase
      .from('ordens_servico')
      .update({
        status: 'Cancelado',
        cancelada: true,
        motivo_cancelamento: motivo,
      })
      .eq('id', ordem.id)

    if (error) {
      alert('Erro ao cancelar OS')
      return
    }

    carregarDetalhes()
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  function formatarDataHora(data: string) {
    return new Date(data).toLocaleString('pt-BR')
  }

  const osFinalizada = ordem?.status === 'Finalizado'
  const osCancelada = ordem?.status === 'Cancelado'

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">
        Carregando relatório...
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">
        OS não encontrada.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-28">
      <main className="max-w-md mx-auto px-4 pt-5">
        {/* TOPO */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => router.push('/ordens')}
            className="w-12 h-12 rounded-2xl bg-[#0d1726] border border-slate-700 flex items-center justify-center text-xl"
          >
            ‹
          </button>

          <div className="flex-1">
            <h1 className="text-xl font-bold">
              Ordem de Serviço #{ordem.numero_os ?? '-'}
            </h1>
            <span className={badgeStatus(ordem.status)}>
              {ordem.status === 'Aguardando material' ? 'Parado' : ordem.status}
            </span>
          </div>

          {osFinalizada || osCancelada ? (
            <button
              onClick={() => alert('Próximo passo: criar tela de edição')}
              className="h-12 px-4 rounded-2xl bg-[#0d1726] border border-blue-500/30 text-blue-400 text-sm font-semibold"
            >
              ✎ Editar
            </button>
          ) : (
            <button
              onClick={() => setModalAtualizacao(true)}
              className="h-12 px-4 rounded-2xl bg-[#0d1726] border border-blue-500/30 text-blue-400 text-sm font-semibold"
            >
              + Atualizar
            </button>
          )}
        </div>

        {/* INFORMAÇÕES */}
        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl mb-4">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-blue-400">📋</span>
            <h2 className="font-bold">Informações da OS</h2>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <InfoItem icone="👤" titulo="Cliente" texto={ordem.cliente} />
            <InfoItem
              icone="⟳"
              titulo="Status"
              texto={ordem.status === 'Aguardando material' ? 'Parado' : ordem.status}
            />
            <InfoItem
              icone="👤"
              titulo="Solicitante"
              texto={ordem.solicitante || '-'}
            />
            <InfoItem icone="👤" titulo="Responsável" texto={nomeResponsavel} />
            <InfoItem icone="🖥️" titulo="Máquina" texto={ordem.maquina} />
            <InfoItem
              icone="📅"
              titulo="Data de entrada"
              texto={formatarData(ordem.created_at)}
            />
            <InfoItem
              icone="📄"
              titulo="Descrição"
              texto={ordem.descricao}
              full
            />

            {ordem.cancelada && (
              <InfoItem
                icone="⚠️"
                titulo="Motivo do cancelamento"
                texto={ordem.motivo_cancelamento || '-'}
                full
              />
            )}
          </div>
        </section>

        {/* FOTO */}
        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-400">📷</span>
            <h2 className="font-bold">Foto inicial do serviço</h2>
          </div>

          {ordem.foto_url ? (
            <div className="relative">
              <img
                src={ordem.foto_url}
                alt="Foto inicial do serviço"
                className="w-full h-52 object-cover rounded-2xl border border-slate-700"
              />

              <a
                href={ordem.foto_url}
                target="_blank"
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"
              >
                🔍
              </a>
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-slate-600 flex items-center justify-center text-slate-500">
              Nenhuma foto cadastrada
            </div>
          )}
        </section>

        {/* ATUALIZAÇÕES */}
        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🧾</span>
              <h2 className="font-bold">Atualização do Serviço</h2>
            </div>

            {!osFinalizada && !osCancelada && (
              <button
                onClick={() => setModalAtualizacao(true)}
                className="px-4 py-2 rounded-xl bg-[#111c2e] border border-blue-500/30 text-blue-400 text-sm"
              >
                ✎ Editar
              </button>
            )}
          </div>

          {atualizacoes.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma atualização cadastrada ainda.
            </p>
          ) : (
            <div className="space-y-4">
              {atualizacoes.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-slate-700 pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="font-semibold text-slate-200">
                    {item.usuario_nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    {formatarDataHora(item.created_at)}
                  </p>

                  <InfoLinha
                    icone="📄"
                    titulo="Descrição da atualização"
                    texto={item.descricao}
                  />

                  <InfoLinha
                    icone="🧰"
                    titulo="Material utilizado"
                    texto={item.material_utilizado || '-'}
                  />

                  <InfoLinha
                    icone="👥"
                    titulo="Técnicos responsáveis"
                    texto={item.tecnicos_responsaveis || '-'}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* BOTÕES FIXOS */}
      {!osFinalizada && !osCancelada && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4">
          <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
            <button
              onClick={finalizarOS}
              className="bg-green-600 text-white py-4 rounded-xl font-semibold shadow-lg"
            >
              ⊙ Finalizar OS
            </button>

            <button
              onClick={cancelarOS}
              className="bg-red-600 text-white py-4 rounded-xl font-semibold shadow-lg"
            >
              ⊗ Cancelar OS
            </button>
          </div>
        </div>
      )}

      {/* MENU INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1423]/95 backdrop-blur border-t border-slate-700 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem titulo="Dashboard" icone="▦" onClick={() => router.push('/dashboard')} />
          <MenuItem ativo titulo="Ordens" icone="📋" onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturamento" icone="$" onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." icone="⚙️" onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL ATUALIZAÇÃO */}
      {modalAtualizacao && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end">
          <div className="bg-[#0d1726] border-t border-slate-700 rounded-t-3xl p-5 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Nova atualização</h2>

              <button
                onClick={() => setModalAtualizacao(false)}
                className="w-10 h-10 rounded-full bg-[#111c2e]"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <textarea
                placeholder="Descrição da atualização"
                value={descricaoAtualizacao}
                onChange={(e) => setDescricaoAtualizacao(e.target.value)}
                className="w-full bg-[#111c2e] border border-slate-700 rounded-2xl p-4 outline-none min-h-28 resize-none"
              />

              <input
                placeholder="Material utilizado"
                value={materialUtilizado}
                onChange={(e) => setMaterialUtilizado(e.target.value)}
                className="w-full bg-[#111c2e] border border-slate-700 rounded-2xl p-4 outline-none"
              />

              <input
                placeholder="Técnicos responsáveis"
                value={tecnicosResponsaveis}
                onChange={(e) => setTecnicosResponsaveis(e.target.value)}
                className="w-full bg-[#111c2e] border border-slate-700 rounded-2xl p-4 outline-none"
              />

              <button
                onClick={salvarAtualizacao}
                disabled={salvandoAtualizacao}
                className="w-full bg-blue-600 py-4 rounded-2xl font-semibold disabled:opacity-60"
              >
                {salvandoAtualizacao ? 'Salvando...' : 'Salvar atualização'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  icone,
  titulo,
  texto,
  full,
}: {
  icone: string
  titulo: string
  texto: string
  full?: boolean
}) {
  return (
    <div className={`flex gap-3 ${full ? 'col-span-2' : ''}`}>
      <span className="text-blue-400 mt-1">{icone}</span>
      <div>
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="text-sm text-slate-200">{texto}</p>
      </div>
    </div>
  )
}

function InfoLinha({
  icone,
  titulo,
  texto,
}: {
  icone: string
  titulo: string
  texto: string
}) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="text-slate-500 mt-1">{icone}</span>
      <div>
        <p className="text-xs text-slate-500">{titulo}</p>
        <p className="text-sm text-slate-200">{texto}</p>
      </div>
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
        ativo ? 'bg-blue-600/25 text-blue-400' : 'text-slate-400'
      }`}
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}

function badgeStatus(status: string) {
  if (status === 'Em andamento') {
    return 'inline-block px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400'
  }

  if (status === 'Finalizado') {
    return 'inline-block px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400'
  }

  if (status === 'Cancelado') {
    return 'inline-block px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400'
  }

  if (status === 'Aguardando material') {
    return 'inline-block px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400'
  }

  return 'inline-block px-3 py-1 rounded-full text-xs bg-slate-500/20 text-slate-300'
}