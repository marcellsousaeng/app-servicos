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
  const [nomeResponsavel, setNomeResponsavel] = useState<string>('-')
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [carregando, setCarregando] = useState(true)

  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [materialUtilizado, setMaterialUtilizado] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [salvandoAtualizacao, setSalvandoAtualizacao] = useState(false)

  useEffect(() => {
    carregarDetalhes()
  }, [])

  const carregarDetalhes = async () => {
    const id = Number(params.id)

    const { data, error } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('id', id)
      .single()

    console.log('DETALHES OS:', data)
    console.log('ERRO DETALHES OS:', error)

    if (error) {
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

    const { data: dadosAtualizacoes, error: erroAtualizacoes } = await supabase
      .from('os_atualizacoes')
      .select('*')
      .eq('ordem_servico_id', id)
      .order('created_at', { ascending: false })

    console.log('ATUALIZACOES OS:', dadosAtualizacoes)
    console.log('ERRO ATUALIZACOES OS:', erroAtualizacoes)

    if (!erroAtualizacoes) {
      setAtualizacoes(dadosAtualizacoes || [])
    }

    setCarregando(false)
  }

  const buscarNomeUsuario = async () => {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      return 'Usuário'
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('nome')
      .eq('usuario', usuarioSalvo)
      .single()

    if (error || !data) {
      return usuarioSalvo
    }

    return data.nome || usuarioSalvo
  }

  const salvarAtualizacao = async () => {
    if (!ordem) return

    if (ordem.status === 'Finalizado') {
      alert('Não é possível adicionar atualizações em uma OS finalizada')
      return
    }

    if (!descricaoAtualizacao.trim()) {
      alert('Preencha a descrição da atualização')
      return
    }

    try {
      setSalvandoAtualizacao(true)

      const nomeUsuario = await buscarNomeUsuario()

      const { error } = await supabase
        .from('os_atualizacoes')
        .insert([
          {
            ordem_servico_id: ordem.id,
            descricao: descricaoAtualizacao,
            material_utilizado: materialUtilizado,
            tecnicos_responsaveis: tecnicosResponsaveis,
            usuario_nome: nomeUsuario,
          },
        ])

      console.log('ERRO SALVAR ATUALIZACAO:', error)

      if (error) {
        alert('Erro ao salvar atualização')
        setSalvandoAtualizacao(false)
        return
      }

      alert('Atualização salva com sucesso!')

      setDescricaoAtualizacao('')
      setMaterialUtilizado('')
      setTecnicosResponsaveis('')
      setSalvandoAtualizacao(false)

      carregarDetalhes()
    } catch (err) {
      console.log('ERRO INESPERADO ATUALIZACAO:', err)
      alert('Erro inesperado ao salvar atualização')
      setSalvandoAtualizacao(false)
    }
  }

  const finalizarOS = async () => {
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

    alert('OS finalizada com sucesso!')
    carregarDetalhes()
  }

  const cancelarOS = async () => {
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

    alert('OS cancelada com sucesso!')
    carregarDetalhes()
  }

  const editarOS = () => {
    alert('Próximo passo: criar a tela de edição da OS')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleString('pt-BR')
  }

  const osFinalizada = ordem?.status === 'Finalizado'

  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <p>Carregando detalhes...</p>
      </div>
    )
  }

  if (!ordem) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <p>OS não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push('/ordens')}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              ← Voltar
            </button>

            <h1 className="text-3xl font-bold">
              Ordem de Serviço #{ordem.numero_os ?? '-'}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p><strong>Cliente:</strong> {ordem.cliente}</p>
              <p><strong>Solicitante:</strong> {ordem.solicitante || '-'}</p>
              <p><strong>Máquina:</strong> {ordem.maquina}</p>
              <p><strong>Descrição:</strong> {ordem.descricao}</p>
            </div>

            <div className="space-y-4">
              <p><strong>Status:</strong> {ordem.status}</p>
              <p><strong>Responsável:</strong> {nomeResponsavel}</p>
              <p><strong>Data de entrada:</strong> {formatarData(ordem.created_at)}</p>

              {ordem.cancelada && (
                <p className="text-red-600">
                  <strong>Motivo cancelamento:</strong>{' '}
                  {ordem.motivo_cancelamento || '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            Foto inicial do serviço
          </h2>

          {ordem.foto_url ? (
            <img
              src={ordem.foto_url}
              alt="Foto da OS"
              className="w-full max-w-md rounded-xl border object-cover"
            />
          ) : (
            <div className="bg-slate-100 border rounded-xl p-10 text-center text-gray-500">
              Nenhuma foto cadastrada
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              Relatório de atualizações
            </h2>

            {atualizacoes.length === 0 ? (
              <p className="text-gray-500">
                Nenhuma atualização cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {atualizacoes.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-4 bg-slate-50"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <p className="font-semibold">
                          {item.usuario_nome || 'Usuário'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatarDataHora(item.created_at)}
                        </p>
                      </div>
                    </div>

                    <p className="mb-3">
                      <strong>Atualização:</strong> {item.descricao}
                    </p>

                    <p className="mb-2">
                      <strong>Material utilizado:</strong>{' '}
                      {item.material_utilizado || '-'}
                    </p>

                    <p>
                      <strong>Técnicos responsáveis:</strong>{' '}
                      {item.tecnicos_responsaveis || '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!osFinalizada && (
          <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6">
              Atualização do Serviço
            </h2>

            <div className="space-y-4">
              <textarea
                placeholder="Descreva a atualização do serviço realizado..."
                value={descricaoAtualizacao}
                onChange={(e) => setDescricaoAtualizacao(e.target.value)}
                className="w-full border rounded-xl p-4 h-32"
              />

              <input
                type="text"
                placeholder="Material utilizado"
                value={materialUtilizado}
                onChange={(e) => setMaterialUtilizado(e.target.value)}
                className="w-full border rounded-xl p-4"
              />

              <input
                type="text"
                placeholder="Técnicos responsáveis"
                value={tecnicosResponsaveis}
                onChange={(e) => setTecnicosResponsaveis(e.target.value)}
                className="w-full border rounded-xl p-4"
              />

              <button
                onClick={salvarAtualizacao}
                disabled={salvandoAtualizacao}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-60"
              >
                {salvandoAtualizacao ? 'Salvando...' : 'Salvar Atualização'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">
            Encerramento da Ordem
          </h2>

          {osFinalizada ? (
            <div className="flex gap-4">
              <button
                onClick={editarOS}
                className="bg-yellow-500 text-white px-8 py-3 rounded-xl font-semibold"
              >
                Editar OS
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={finalizarOS}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold"
              >
                Finalizar OS
              </button>

              <button
                onClick={cancelarOS}
                className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold"
              >
                Cancelar OS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}