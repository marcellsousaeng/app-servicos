'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async () => {
    setCarregando(true)

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .eq('senha', senha)
      .eq('ativo', true)

    console.log('DATA LOGIN:', data)
    console.log('ERROR LOGIN:', error)

    if (error) {
      alert('Erro ao fazer login')
      setCarregando(false)
      return
    }

    if (data && data.length > 0) {
      localStorage.setItem('usuario', data[0].usuario)
      router.push('/dashboard')
    } else {
      alert('Usuário ou senha inválidos')
    }

    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sistema de Serviços
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <button
            onClick={handleLogin}
            disabled={carregando}
            className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-60"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}