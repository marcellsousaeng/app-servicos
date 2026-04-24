'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ConfiguracaoPage() {
  const router = useRouter()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
  }, [])

  function alterarTema(novoTema: 'dark' | 'clean') {
    setTema(novoTema)
    localStorage.setItem('tema', novoTema)
    alert('Tema alterado com sucesso!')
  }

  async function alterarSenha() {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      router.push('/')
      return
    }

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert('Preencha todos os campos.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('As senhas não conferem.')
      return
    }

    setSalvando(true)

    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuarioSalvo)
      .eq('senha', senhaAtual)
      .single()

    if (!data) {
      alert('Senha atual incorreta.')
      setSalvando(false)
      return
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ senha: novaSenha })
      .eq('usuario', usuarioSalvo)

    if (error) {
      alert('Erro ao alterar senha.')
      setSalvando(false)
      return
    }

    alert('Senha alterada com sucesso!')
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setSalvando(false)
  }

  const clean = tema === 'clean'

  return (
    <div
      className={`min-h-screen pb-28 ${
        clean ? 'bg-slate-100 text-slate-900' : 'bg-[#07111f] text-white'
      }`}
    >
      <main className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
              clean ? 'bg-white border-slate-300' : 'bg-[#0d1726] border-slate-700'
            }`}
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold">Configuração</h1>
            <p className={clean ? 'text-slate-500 text-sm' : 'text-slate-400 text-sm'}>
              Ajuste sua conta e aparência
            </p>
          </div>
        </div>

        <section
          className={`rounded-3xl p-5 border shadow-xl mb-4 ${
            clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700/70'
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Aparência do aplicativo</h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => alterarTema('dark')}
              className={`p-4 rounded-2xl border text-left ${
                tema === 'dark'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : clean
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-[#111c2e] border-slate-700'
              }`}
            >
              <p className="font-bold">Modo Dark</p>
              <p className="text-xs opacity-80 mt-1">Tema escuro atual</p>
            </button>

            <button
              onClick={() => alterarTema('clean')}
              className={`p-4 rounded-2xl border text-left ${
                tema === 'clean'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : clean
                  ? 'bg-slate-100 border-slate-300'
                  : 'bg-[#111c2e] border-slate-700'
              }`}
            >
              <p className="font-bold">Modo Clean</p>
              <p className="text-xs opacity-80 mt-1">Tema claro</p>
            </button>
          </div>
        </section>

        <section
          className={`rounded-3xl p-5 border shadow-xl ${
            clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700/70'
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Alterar senha</h2>

          <div className="space-y-3">
            <input
              type="password"
              placeholder="Senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={`w-full rounded-2xl p-4 outline-none border ${
                clean
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#111c2e] border-slate-700 text-white'
              }`}
            />

            <input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={`w-full rounded-2xl p-4 outline-none border ${
                clean
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#111c2e] border-slate-700 text-white'
              }`}
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={`w-full rounded-2xl p-4 outline-none border ${
                clean
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-[#111c2e] border-slate-700 text-white'
              }`}
            />

            <button
              onClick={alterarSenha}
              disabled={salvando}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-60"
            >
              {salvando ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}