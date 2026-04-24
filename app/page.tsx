'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  async function fazerLogin() {
    if (!usuario || !senha) {
      alert('Preencha usuário e senha')
      return
    }

    setCarregando(true)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .eq('senha', senha)
      .single()

    if (error || !data) {
      alert('Usuário ou senha inválidos')
      setCarregando(false)
      return
    }

    localStorage.setItem('usuario', data.usuario)
    localStorage.setItem('nome', data.nome || data.usuario)
    localStorage.setItem('nivel', data.nivel || '')
    localStorage.setItem('cargo', data.cargo || '')

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <div className="relative w-[260px] h-[180px]">
            <Image
              src="/logo-divisa.png"
              alt="Logo Divisa"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* CARD LOGIN */}
        <div className="bg-[#0d1726] border border-slate-700/70 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
              🔒
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Sistema de Serviços
              </h1>

              <p className="text-sm text-slate-400 mt-1">
                Acesse sua conta para continuar
              </p>
            </div>
          </div>

          {/* USUÁRIO */}
          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-2 block">
              Usuário
            </label>

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl px-4 py-4 flex items-center gap-3">
              <span className="text-blue-400">👤</span>

              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* SENHA */}
          <div className="mb-5">
            <label className="text-sm text-slate-400 mb-2 block">
              Senha
            </label>

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl px-4 py-4 flex items-center gap-3">
              <span className="text-blue-400">🔒</span>

              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-slate-400"
              >
                👁️
              </button>
            </div>
          </div>

          {/* BOTÃO LOGIN */}
          <button
            onClick={fazerLogin}
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : '↪ Entrar'}
          </button>

          {/* DIVISOR */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          {/* ESQUECI SENHA */}
          <button
            type="button"
            className="w-full border border-slate-700 rounded-2xl py-4 text-blue-400 hover:bg-[#111c2e] transition"
            onClick={() =>
              alert(
                'Procure o administrador do sistema para redefinir sua senha.'
              )
            }
          >
            🛡️ Esqueci minha senha
          </button>
        </div>

        {/* RODAPÉ */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>© 2025 Divisa Tornearia</p>
          <p>Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}