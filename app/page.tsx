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
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
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

        <div className="bg-[#0d1726] border border-slate-700/70 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
              <LockIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Sistema de Serviços</h1>
              <p className="text-sm text-slate-400 mt-1">
                Acesse sua conta para continuar
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-400 mb-2 block">Usuário</label>

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl px-4 py-4 flex items-center gap-3">
              <UserIcon />

              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-transparent outline-none w-full text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm text-slate-400 mb-2 block">Senha</label>

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl px-4 py-4 flex items-center gap-3">
              <SmallLockIcon />

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
                className="text-slate-400 hover:text-blue-400 transition"
              >
                {mostrarSenha ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            onClick={fazerLogin}
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 transition py-4 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : '↪ Entrar'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <button
            type="button"
            className="w-full border border-slate-700 rounded-2xl py-4 text-blue-400 hover:bg-[#111c2e] transition"
            onClick={() =>
              alert('Procure o administrador do sistema para redefinir sua senha.')
            }
          >
            🛡️ Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="white" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.5" fill="white" />
    </svg>
  )
}

function SmallLockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-400">
      <rect x="5" y="10" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-blue-400">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20c1.5-4 12.5-4 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M2.5 12S5.8 5.5 12 5.5 21.5 12 21.5 12 18.2 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 5.7A9.4 9.4 0 0 1 12 5.5c6.2 0 9.5 6.5 9.5 6.5a14 14 0 0 1-3 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.4 6.8C3.9 8.5 2.5 12 2.5 12S5.8 18.5 12 18.5a9.5 9.5 0 0 0 4.1-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}