'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function MenuItem({
  titulo,
  icone,
  ativo = false,
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
      className={`rounded-2xl py-3 flex flex-col items-center justify-center text-sm transition-all ${
        ativo
          ? clean
            ? 'bg-blue-600 text-white'
            : 'bg-blue-600 text-white'
          : clean
          ? 'text-slate-600 hover:bg-slate-100'
          : 'text-slate-300 hover:bg-slate-800'
      }`}
    >
      <span className="text-lg">{icone}</span>
      <span className="mt-1 text-xs">{titulo}</span>
    </button>
  )
}

export default function ConfiguracaoPage() {
  const router = useRouter()

  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const clean = tema === 'clean'

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app')

    if (temaSalvo === 'clean') {
      setTema('clean')
    } else {
      setTema('dark')
    }
  }, [])

  function alterarTema(novoTema: 'dark' | 'clean') {
    setTema(novoTema)
    localStorage.setItem('tema-app', novoTema)
  }

  function alterarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      alert('Preencha todos os campos')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('As senhas não conferem')
      return
    }

    alert('Senha alterada com sucesso!')

    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
  }

  return (
    <div
      className={`min-h-screen pb-32 ${
        clean
          ? 'bg-slate-100 text-slate-900'
          : 'bg-[#07111f] text-white'
      }`}
    >
      <div className="max-w-md mx-auto px-5 py-6">
        {/* TOPO */}
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-xl ${
              clean
                ? 'bg-white border-slate-200'
                : 'bg-[#0d1a2d] border-slate-700'
            }`}
          >
            ←
          </button>

          <div>
            <h1 className="text-4xl font-bold">Configuração</h1>
            <p
              className={`text-lg ${
                clean ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Ajuste sua conta e aparência
            </p>
          </div>
        </div>

        {/* APARÊNCIA */}
        <div
          className={`rounded-3xl p-6 mb-6 shadow-lg ${
            clean
              ? 'bg-white border border-slate-200'
              : 'bg-[#0b1628] border border-slate-800'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">
            Aparência do aplicativo
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => alterarTema('dark')}
              className={`rounded-3xl p-6 text-left border transition-all ${
                tema === 'dark'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : clean
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-[#111f35] border-slate-700'
              }`}
            >
              <h3 className="text-xl font-bold">Modo Dark</h3>
              <p className="text-sm opacity-80">
                Tema escuro atual
              </p>
            </button>

            <button
              onClick={() => alterarTema('clean')}
              className={`rounded-3xl p-6 text-left border transition-all ${
                tema === 'clean'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : clean
                  ? 'bg-slate-100 border-slate-200'
                  : 'bg-[#111f35] border-slate-700'
              }`}
            >
              <h3 className="text-xl font-bold">Modo Clean</h3>
              <p className="text-sm opacity-80">
                Tema claro
              </p>
            </button>
          </div>
        </div>

        {/* SENHA */}
        <div
          className={`rounded-3xl p-6 shadow-lg ${
            clean
              ? 'bg-white border border-slate-200'
              : 'bg-[#0b1628] border border-slate-800'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6">
            Alterar senha
          </h2>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={`w-full rounded-2xl px-5 py-5 text-lg border outline-none ${
                clean
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#101d31] border-slate-700'
              }`}
            />

            <input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={`w-full rounded-2xl px-5 py-5 text-lg border outline-none ${
                clean
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#101d31] border-slate-700'
              }`}
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={`w-full rounded-2xl px-5 py-5 text-lg border outline-none ${
                clean
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-[#101d31] border-slate-700'
              }`}
            />

            <button
              onClick={alterarSenha}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl py-5 rounded-2xl transition-all"
            >
              Alterar senha
            </button>
          </div>
        </div>
      </div>

      {/* MENU INFERIOR */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t px-3 py-2 ${
          clean
            ? 'bg-white/95 border-slate-200 shadow-[0_-8px_25px_rgba(0,0,0,0.08)]'
            : 'bg-[#0b1423]/95 border-slate-700'
        }`}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem
            clean={clean}
            titulo="Dashboard"
            icone="▦"
            onClick={() => router.push('/dashboard')}
          />

          <MenuItem
            clean={clean}
            titulo="Ordens"
            icone="📋"
            onClick={() => router.push('/ordens')}
          />

          <MenuItem
            clean={clean}
            titulo="Faturamento"
            icone="$"
            onClick={() => router.push('/faturamento')}
          />

          <MenuItem
            clean={clean}
            ativo
            titulo="Config."
            icone="⚙️"
            onClick={() => router.push('/configuracao')}
          />
        </div>
      </nav>
    </div>
  )
}