'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function NovaOSPage() {
  const router = useRouter()

  const [cliente, setCliente] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [maquina, setMaquina] = useState('')
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function buscarProximoNumeroOS() {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('numero_os')
      .order('numero_os', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0 || !data[0].numero_os) {
      return 1
    }

    return data[0].numero_os + 1
  }

  async function enviarFoto() {
    if (!foto) return null

    const nomeArquivo = `${Date.now()}-${foto.name}`

    const { error } = await supabase.storage
      .from('os-imagens')
      .upload(nomeArquivo, foto)

    if (error) {
      console.log('ERRO FOTO:', error)
      alert('Erro ao enviar imagem')
      return null
    }

    const { data } = supabase.storage
      .from('os-imagens')
      .getPublicUrl(nomeArquivo)

    return data.publicUrl
  }

  async function salvarOS() {
    if (!cliente || !solicitante || !maquina || !descricao) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSalvando(true)

      const usuarioResponsavel = localStorage.getItem('usuario')

      if (!usuarioResponsavel) {
        alert('Usuário não encontrado. Faça login novamente.')
        router.push('/')
        return
      }

      const numeroOS = await buscarProximoNumeroOS()
      const fotoUrl = await enviarFoto()

      const { error } = await supabase.from('ordens_servico').insert([
        {
          numero_os: numeroOS,
          cliente,
          solicitante,
          maquina,
          descricao,
          status: 'Em andamento',
          cancelada: false,
          motivo_cancelamento: null,
          usuario_responsavel: usuarioResponsavel,
          foto_url: fotoUrl,
        },
      ])

      if (error) {
        console.log('ERRO SALVAR OS:', error)
        alert('Erro ao salvar OS')
        setSalvando(false)
        return
      }

      alert('OS criada com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      console.log('ERRO INESPERADO:', error)
      alert('Erro inesperado ao salvar OS')
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-28">
      <main className="max-w-md mx-auto px-4 pt-6">
        <section className="bg-[#0d1726] rounded-3xl p-5 border border-slate-700/70 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
              <p className="text-sm text-slate-400 mt-1">
                Preencha as informações para criar uma nova OS.
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-[#111c2e] border border-slate-700 px-4 py-3 rounded-2xl text-sm text-slate-300"
            >
              ▦ Dashboard
            </button>
          </div>

          <div className="space-y-3">
            <CampoTexto
              icone="👤"
              label="Cliente"
              placeholder="Selecione o cliente"
              value={cliente}
              onChange={setCliente}
            />

            <CampoTexto
              icone="👤"
              label="Solicitante"
              placeholder="Informe o solicitante"
              value={solicitante}
              onChange={setSolicitante}
            />

            <CampoTexto
              icone="🖥️"
              label="Máquina"
              placeholder="Informe a máquina"
              value={maquina}
              onChange={setMaquina}
            />

            <div className="bg-[#111c2e] border border-slate-700 rounded-2xl p-4">
              <div className="flex gap-3">
                <span className="text-blue-400 mt-1">📄</span>

                <div className="w-full">
                  <label className="text-sm font-semibold text-slate-300">
                    Descrição do serviço
                  </label>

                  <textarea
                    placeholder="Descreva o serviço a ser realizado"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full mt-1 bg-transparent outline-none text-white placeholder:text-slate-500 min-h-24 resize-none"
                  />
                </div>
              </div>
            </div>

            <label className="bg-[#111c2e] border border-dashed border-slate-600 rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl">
                  📷
                </div>

                <div>
                  <p className="font-semibold">Tirar Foto</p>
                  <p className="text-sm text-slate-400">
                    {foto ? foto.name : 'Adicione uma foto (opcional)'}
                  </p>
                </div>
              </div>

              <span className="text-slate-400">›</span>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
              />
            </label>

            <button
              onClick={salvarOS}
              disabled={salvando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold disabled:opacity-60"
            >
              💾 {salvando ? 'Salvando...' : 'Salvar OS'}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-transparent border border-slate-700 text-slate-400 py-4 rounded-2xl font-semibold"
            >
              🗑️ Cancelar
            </button>
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0b1423]/95 backdrop-blur border-t border-slate-700 px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          <MenuItem titulo="Dashboard" icone="▦" onClick={() => router.push('/dashboard')} />
          <MenuItem titulo="Ordens" icone="📋" onClick={() => router.push('/ordens')} />
          <MenuItem titulo="Faturamento" icone="$" onClick={() => router.push('/faturamento')} />
          <MenuItem titulo="Config." icone="⚙️" onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

function CampoTexto({
  icone,
  label,
  placeholder,
  value,
  onChange,
}: {
  icone: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="bg-[#111c2e] border border-slate-700 rounded-2xl p-4">
      <div className="flex gap-3">
        <span className="text-blue-400 mt-1">{icone}</span>

        <div className="w-full">
          <label className="text-sm font-semibold text-slate-300">
            {label}
          </label>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full mt-1 bg-transparent outline-none text-white placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  )
}

function MenuItem({
  titulo,
  icone,
  onClick,
}: {
  titulo: string
  icone: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="py-2 rounded-2xl text-xs flex flex-col items-center justify-center gap-1 text-slate-400"
    >
      <span className="text-xl">{icone}</span>
      <span>{titulo}</span>
    </button>
  )
}