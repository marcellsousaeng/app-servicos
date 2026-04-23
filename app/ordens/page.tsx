'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type Ordem = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  created_at: string
  status: string
  usuario_responsavel: string | null
  responsavel_nome?: string
}

type Usuario = {
  usuario: string
  nome: string
}

export default function OrdensPage() {
  const router = useRouter()

  const [ordens, setOrdens] = useState<Ordem[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    carregarOrdens()
  }, [])

  const carregarOrdens = async () => {
    setCarregando(true)

    // Buscar ordens
    const { data: dadosOrdens, error: erroOrdens } = await supabase
      .from('ordens_servico')
      .select('*')
      .order('numero_os', { ascending: false })

    console.log('ORDENS:', dadosOrdens)
    console.log('ERRO ORDENS:', erroOrdens)

    if (erroOrdens) {
      alert('Erro ao carregar ordens')
      setCarregando(false)
      return
    }

    // Buscar usuários
    const { data: dadosUsuarios, error: erroUsuarios } = await supabase
      .from('usuarios')
      .select('usuario, nome')

    console.log('USUARIOS:', dadosUsuarios)
    console.log('ERRO USUARIOS:', erroUsuarios)

    const usuarios = dadosUsuarios || []

    // Cruzar usuário com nome
    const ordensComNome = (dadosOrdens || []).map((ordem) => {
      const usuarioEncontrado = usuarios.find(
        (u) => u.usuario === ordem.usuario_responsavel
      )

      return {
        ...ordem,
        responsavel_nome:
          usuarioEncontrado?.nome || ordem.usuario_responsavel || '-',
      }
    })

    setOrdens(ordensComNome)
    setCarregando(false)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const badgeStatus = (status: string) => {
    if (status === 'Em andamento') {
      return 'bg-blue-100 text-blue-700'
    }

    if (status === 'Finalizado') {
      return 'bg-green-100 text-green-700'
    }

    if (status === 'Cancelado') {
      return 'bg-red-100 text-red-700'
    }

    if (status === 'Aguardando material') {
      return 'bg-yellow-100 text-yellow-700'
    }

    return 'bg-gray-100 text-gray-700'
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
              <h1 className="text-3xl font-bold">
                Ordens de Serviço
              </h1>

              <p className="text-slate-500">
                Acompanhe todas as ordens cadastradas
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/nova-os')}
            className="bg-black text-white px-6 py-3 rounded-xl font-semibold"
          >
            Nova Ordem
          </button>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {carregando ? (
            <p>Carregando ordens...</p>
          ) : ordens.length === 0 ? (
            <p>Nenhuma ordem cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-4">Nº OS</th>
                    <th>Cliente</th>
                    <th>Solicitante</th>
                    <th>Máquina</th>
                    <th>Data de entrada</th>
                    <th>Responsável</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {ordens.map((ordem) => (
                    <tr
                      key={ordem.id}
                      onClick={() => router.push(`/ordens/${ordem.id}`)}
                      className="border-b cursor-pointer hover:bg-slate-50"
                    >
                      <td className="py-4">
                        {ordem.numero_os ?? '-'}
                      </td>

                      <td>{ordem.cliente}</td>

                      <td>{ordem.solicitante || '-'}</td>

                      <td>{ordem.maquina}</td>

                      <td>
                        {formatarData(ordem.created_at)}
                      </td>

                      <td>
                        {ordem.responsavel_nome}
                      </td>

                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${badgeStatus(
                            ordem.status
                          )}`}
                        >
                          {ordem.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}