'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function NovaOS() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [cliente, setCliente] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [maquina, setMaquina] = useState('')
  const [descricao, setDescricao] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  const gerarProximoNumeroOS = async () => {
    const { data, error } = await supabase
      .from('ordens_servico')
      .select('numero_os')
      .not('numero_os', 'is', null)
      .order('numero_os', { ascending: false })
      .limit(1)

    console.log('ULTIMA OS:', data)
    console.log('ERRO ULTIMA OS:', error)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return 1
    }

    return Number(data[0].numero_os) + 1
  }

  const buscarNomeResponsavel = async () => {
    const usuarioSalvo = localStorage.getItem('usuario')

    if (!usuarioSalvo) {
      return 'Usuário'
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('nome')
      .eq('usuario', usuarioSalvo)
      .single()

    console.log('RESPONSAVEL:', data)
    console.log('ERRO RESPONSAVEL:', error)

    if (error || !data) {
      return usuarioSalvo
    }

    return data.nome || usuarioSalvo
  }

  const handleSalvar = async () => {
    try {
      setSalvando(true)

      const proximoNumeroOS = await gerarProximoNumeroOS()
      const nomeResponsavel = await buscarNomeResponsavel()

      let fotoUrl = ''

      if (foto) {
        const nomeArquivo = `os-${Date.now()}-${foto.name}`

        const { error: erroUpload } = await supabase.storage
          .from('os-imagens')
          .upload(nomeArquivo, foto)

        if (erroUpload) {
          console.log('ERRO UPLOAD:', erroUpload)
          alert('Erro ao enviar imagem')
          setSalvando(false)
          return
        }

        const { data } = supabase.storage
          .from('os-imagens')
          .getPublicUrl(nomeArquivo)

        fotoUrl = data.publicUrl
      }

      const { data, error } = await supabase
        .from('ordens_servico')
        .insert([
          {
            numero_os: proximoNumeroOS,
            cliente,
            solicitante,
            maquina,
            descricao,
            status: 'Em andamento',
            cancelada: false,
            motivo_cancelamento: '',
            usuario_responsavel: nomeResponsavel,
            foto_url: fotoUrl,
          },
        ])
        .select()
        .single()

      console.log('NOVA OS:', data)
      console.log('ERRO NOVA OS:', error)

      if (error) {
        alert('Erro ao salvar OS')
        setSalvando(false)
        return
      }

      alert(`OS ${proximoNumeroOS} criada com sucesso!`)
      router.push(`/ordens/${data.id}`)
    } catch (err) {
      console.log('ERRO INESPERADO:', err)
      alert('Erro inesperado ao salvar a OS')
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>

          <button
            onClick={() => router.push('/dashboard')}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            ← Dashboard
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Solicitante"
            value={solicitante}
            onChange={(e) => setSolicitante(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <input
            type="text"
            placeholder="Máquina"
            value={maquina}
            onChange={(e) => setMaquina(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />

          <textarea
            placeholder="Descrição do serviço"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 min-h-[120px]"
          />

          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl"
            >
              📸 Tirar Foto
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFoto(e.target.files[0])
                }
              }}
            />
          </div>

          {foto && (
            <p className="text-sm text-green-600">
              Foto selecionada: {foto.name}
            </p>
          )}

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full bg-black text-white py-3 rounded-xl disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar OS'}
          </button>
        </div>
      </div>
    </div>
  )
}