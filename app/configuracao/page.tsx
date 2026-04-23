'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ConfiguracaoPage() {
  const router = useRouter()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)

  const alterarSenha = async () => {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      alert('Usuário não encontrado. Faça login novamente.')
      router.push('/')
      return
    }

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert('Preencha todos os campos.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('A nova senha e a confirmação estão diferentes.')
      return
    }

    if (novaSenha.length < 4) {
      alert('A nova senha deve ter pelo menos 4 caracteres.')
      return
    }

    try {
      setSalvando(true)

      const { data: usuario, error: erroBusca } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', usuarioSalvo)
        .eq('senha', senhaAtual)
        .single()

      console.log('USUARIO CONFIG:', usuario)
      console.log('ERRO BUSCA CONFIG:', erroBusca)

      if (erroBusca || !usuario) {
        alert('Senha atual incorreta.')
        setSalvando(false)
        return
      }

      const { error: erroUpdate } = await supabase
        .from('usuarios')
        .update({ senha: novaSenha })
        .eq('usuario', usuarioSalvo)

      console.log('ERRO UPDATE SENHA:', erroUpdate)

      if (erroUpdate) {
        alert('Erro ao alterar senha.')
        setSalvando(false)
        return
      }

      alert('Senha alterada com sucesso!')

      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
      setSalvando(false)
    } catch (error) {
      console.log('ERRO INESPERADO CONFIG:', error)
      alert('Erro inesperado ao alterar senha.')
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Configuração</h1>
              <p className="text-slate-500 mt-2">
                Altere sua senha de acesso
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              ← Voltar
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
            />

            <button
              onClick={alterarSenha}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}