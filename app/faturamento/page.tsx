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
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarPagina()
  }, [])

  async function carregarPagina() {
    setCarregando(true)

    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      router.push('/')
      return
    }

    const { data: dadosUsuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('usuario, nome, perfil')
      .eq('usuario', usuarioSalvo)
      .single()

    console.log('USUARIO FATURAMENTO:', dadosUsuario)
    console.log('ERRO USUARIO FATURAMENTO:', erroUsuario)

    if (erroUsuario || !dadosUsuario) {
      alert('Erro ao carregar usuário')
      router.push('/')
      return
    }

    setUsuarioLogado(dadosUsuario)

    const { data: dadosOrdens, error: erroOrdens } = await supabase
      .from('ordens_servico')
      .select('*')
      .eq('status', 'Finalizado')
      .order('numero_os', { ascending: false })

    console.log('ORDENS FATURAMENTO:', dadosOrdens)
    console.log('ERRO ORDENS FATURAMENTO:', erroOrdens)

    if (erroOrdens) {
      alert('Erro ao carregar ordens finalizadas')
      setCarregando(false)
      return
    }

    setOrdens(dadosOrdens || [])
    setCarregando(false)
  }

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const podeEditar = usuarioLogado?.perfil === 'Faturamento'

  async function alterarFaturamento(id: number, novoValor: boolean) {
    if (!podeEditar) {
      alert('Somente o perfil Faturamento pode alterar esse campo.')
      return
    }

    const { error } = await supabase
      .from('ordens_servico')
      .update({ faturado: novoValor })
      .eq('id', id)

    console.log('ERRO ALTERAR FATURADO:', error)

    if (error) {
      alert('Erro ao atualizar faturamento')
      return
    }

    setOrdens((ordensAtuais) =>
      ordensAtuais.map((ordem) =>
        ordem.id === id ? { ...ordem, faturado: novoValor } : ordem
      )
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              ←
            </button>

            <div>
              <h1 className="text-3xl font-bold">Faturamento</h1>
              <p className="text-slate-500">
                Controle das ordens de serviço finalizadas
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-semibold">{usuarioLogado?.nome || 'Usuário'}</p>
            <p className="text-sm text-slate-500">
              Perfil: {usuarioLogado?.perfil || '-'}
            </p>
          </div>
        </div>

        {/* AVISO */}
        {!podeEditar && !carregando && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-2xl p-4 mb-6">
            Você está apenas visualizando. Somente usuários com perfil
            <strong> Faturamento </strong>
            podem alterar o status de faturado.
          </div>
        )}

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow-md p-6 overflow-x-auto">
          {carregando ? (
            <p>Carregando ordens finalizadas...</p>
          ) : ordens.length === 0 ? (
            <p>Nenhuma OS finalizada encontrada.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4">Nº OS</th>
                  <th className="py-3 pr-4">Cliente</th>
                  <th className="py-3 pr-4">Solicitante</th>
                  <th className="py-3 pr-4">Máquina</th>
                  <th className="py-3 pr-4">Data finalização</th>
                  <th className="py-3 pr-4">Faturado</th>
                </tr>
              </thead>

              <tbody>
                {ordens.map((ordem) => (
                  <tr key={ordem.id} className="border-b">
                    <td className="py-4 pr-4">{ordem.numero_os ?? '-'}</td>
                    <td className="py-4 pr-4">{ordem.cliente}</td>
                    <td className="py-4 pr-4">{ordem.solicitante || '-'}</td>
                    <td className="py-4 pr-4">{ordem.maquina}</td>
                    <td className="py-4 pr-4">{formatarData(ordem.created_at)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarFaturamento(ordem.id, true)}
                          disabled={!podeEditar}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            ordem.faturado
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          } ${!podeEditar ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          Faturado
                        </button>

                        <button
                          onClick={() => alterarFaturamento(ordem.id, false)}
                          disabled={!podeEditar}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            ordem.faturado === false
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          } ${!podeEditar ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          Não faturado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}