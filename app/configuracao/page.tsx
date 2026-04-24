'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function ConfiguracaoPage() {
  const router = useRouter()

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarAtual, setMostrarAtual] = useState(false)
  const [mostrarNova, setMostrarNova] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function alterarSenha() {
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

    if (!/^\d+$/.test(novaSenha)) {
      alert('A nova senha deve conter apenas números.')
      return
    }

    if (novaSenha.length > 4) {
      alert('A nova senha deve ter até 4 dígitos.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      alert('A nova senha e a confirmação estão diferentes.')
      return
    }

    setSalvando(true)

    const { data: usuario, error: erroBusca } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuarioSalvo)
      .eq('senha', senhaAtual)
      .single()

    if (erroBusca || !usuario) {
      alert('Senha atual incorreta.')
      setSalvando(false)
      return
    }

    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({ senha: novaSenha })
      .eq('usuario', usuarioSalvo)

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
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-28">
      <main className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-11 h-11 rounded-2xl bg-[#0d1726] border border-slate-700 flex items-center justify-center text-lg"
          >
            ←
          </button>

          <div>
            <h1 className="text-2xl font-bold">Configuração</h1>
            <p className="text-sm text-slate-400">
              Altere sua senha de acesso
            </p>
          </div>
        </div>

        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl mb-4">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl shadow-lg">
              🔒
            </div>

            <div>
              <h2 className="text-xl font-bold">Alterar senha</h2>
              <p className="text-sm text-slate-400 mt-1">
                Mantenha sua conta segura alterando sua senha regularmente.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <CampoSenha
              label="Senha atual"
              placeholder="Digite sua senha atual"
              value={senhaAtual}
              onChange={setSenhaAtual}
              mostrar={mostrarAtual}
              setMostrar={setMostrarAtual}
            />

            <CampoSenha
              label="Nova senha"
              placeholder="Digite sua nova senha"
              value={novaSenha}
              onChange={setNovaSenha}
              mostrar={mostrarNova}
              setMostrar={setMostrarNova}
            />

            <CampoSenha
              label="Confirmar nova senha"
              placeholder="Digite novamente sua nova senha"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              mostrar={mostrarConfirmar}
              setMostrar={setMostrarConfirmar}
            />

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400">ⓘ</span>
                <p className="font-semibold text-sm">Sua senha deve ser:</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span>
                  Apenas números
                </div>

                <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                  <span className="text-blue-400">✓</span>
                  Até 4 dígitos
                </div>
              </div>
            </div>

            <button
              onClick={alterarSenha}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold disabled:opacity-60"
            >
              🔒 {salvando ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </section>

        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center text-xl">
              🛡️
            </div>

            <div>
              <h2 className="font-bold">Dica de segurança</h2>
              <p className="text-sm text-slate-400 mt-1">
                Não compartilhe sua senha com outras pessoas.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Isso ajuda a proteger sua conta.
              </p>
            </div>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1423]/95 backdrop-blur border-t border-slate-700 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem titulo="Dashboard" icone="▦" onClick={() => router.push('/dashboard')} />
          <MenuItem titulo="Ordens" icone="📋" onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturamento" icone="$" onClick={() => router.push('/faturamento')} />
          <MenuItem ativo titulo="Config." icone="⚙️" onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function CampoSenha({
  label,
  placeholder,
  value,
  onChange,
  mostrar,
  setMostrar,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  mostrar: boolean
  setMostrar: (value: boolean) => void
}) {
  return (
    <div className="bg-[#111c2e] border border-slate-700 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-400">🔒</span>

        <div className="flex-1">
          <label className="text-sm font-semibold text-slate-300">
            {label}
          </label>

          <input
            type={mostrar ? 'text' : 'password'}
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full mt-1 bg-transparent outline-none text-white placeholder:text-slate-500 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setMostrar(!mostrar)}
          className="text-slate-400"
        >
          👁️
        </button>
      </div>
    </div>
  )
}

function MenuItem({
  titulo,
  icone,
  ativo,
  onClick,
}: {
  titulo: string
  icone: string
  ativo?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 rounded-2xl text-xs flex flex-col items-center justify-center gap-1 ${
        ativo ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'
      }`}
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}