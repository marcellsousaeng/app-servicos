'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  ShieldCheck 
} from 'lucide-react'

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
        
        {/* LOGO AREA */}
        <div className="flex justify-center mb-10">
          <div className="relative w-[260px] h-[100px]">
            <Image
              src="/logo-divisa.png"
              alt="Logo Divisa"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-[#0d1726] border border-slate-700/50 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-start gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Lock size={28} strokeWidth={2.5} />
            </div>

            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">Sistema de Serviços</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Autenticação de Acesso
              </p>
            </div>
          </div>

          {/* INPUT USUÁRIO */}
          <div className="mb-5">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block px-2 tracking-widest">Usuário</label>
            <div className="bg-[#111c2e] border border-slate-700/50 rounded-2xl px-4 py-4 flex items-center gap-3 focus-within:border-blue-500 transition-all">
              <User size={20} className="text-blue-500" />
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Digite seu usuário"
                className="bg-transparent outline-none w-full text-sm font-bold text-white placeholder:text-slate-600 uppercase"
              />
            </div>
          </div>

          {/* INPUT SENHA */}
          <div className="mb-8">
            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block px-2 tracking-widest">Senha</label>
            <div className="bg-[#111c2e] border border-slate-700/50 rounded-2xl px-4 py-4 flex items-center gap-3 focus-within:border-blue-500 transition-all">
              <Lock size={20} className="text-blue-500" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="bg-transparent outline-none w-full text-sm font-bold text-white placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="text-slate-500 hover:text-blue-400 transition"
              >
                {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* BOTÃO ENTRAR */}
          <button
            onClick={fazerLogin}
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-white shadow-xl shadow-blue-600/20 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-95"
          >
            {carregando ? (
              'Processando...'
            ) : (
              <>
                <LogIn size={18} />
                Entrar no Sistema
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-8 opacity-20">
            <div className="flex-1 h-px bg-slate-500" />
            <span className="text-slate-500 text-[10px] font-black uppercase">Segurança</span>
            <div className="flex-1 h-px bg-slate-500" />
          </div>

          {/* BOTÃO ESQUECI SENHA */}
          <button
            type="button"
            className="w-full border border-slate-700/50 rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2"
            onClick={() =>
              alert('Procure o administrador do sistema para redefinir sua senha.')
            }
          >
            <ShieldCheck size={14} />
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  )
}