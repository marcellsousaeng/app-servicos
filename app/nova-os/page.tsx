'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { 
  User, 
  Cpu, 
  FileText, 
  Camera, 
  Save, 
  XCircle, 
  LayoutDashboard,
  ClipboardList,
  DollarSign,
  Settings,
  FolderOpen,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'

// Interfaces de Tipagem
interface CampoProps {
  icone: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  tema: 'dark' | 'clean';
}

interface MenuIconProps {
  label: string;
  icone: React.ReactNode;
  onClick: () => void;
  ativo: boolean;
  tema: 'dark' | 'clean';
}

export default function NovaOSPage() {
  const router = useRouter()

  const [cliente, setCliente] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [maquina, setMaquina] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [salvando, setSalvando] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
  }, [])

  async function buscarProximoNumeroOS() {
    try {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('numero_os')
        .order('numero_os', { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) return 1 
      return (data[0].numero_os || 0) + 1
    } catch {
      return Math.floor(Date.now() / 1000)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files)
      setFotos(prev => [...prev, ...novosArquivos])
    }
  }

  const removerFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
  }

  async function enviarMultiplasFotos(idOS: number) {
    if (fotos.length === 0 || !navigator.onLine) return

    const promessas = fotos.map(async (arquivo) => {
      const nomeArquivo = `${idOS}/${Date.now()}-${arquivo.name}`
      const { error: uploadError } = await supabase.storage
        .from('os-imagens')
        .upload(nomeArquivo, arquivo)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('os-imagens').getPublicUrl(nomeArquivo)
      
      return supabase.from('fotos_os').insert([{
        id_os: idOS,
        url: data.publicUrl
      }])
    })

    await Promise.all(promessas)
  }

  async function salvarOS() {
    if (!cliente || !solicitante || !maquina || !descricao) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setSalvando(true)
    const usuarioResponsavel = localStorage.getItem('usuario')

    if (!usuarioResponsavel) {
      router.push('/')
      return
    }

    const novaOS = {
      cliente: cliente.toUpperCase(),
      solicitante: solicitante.toUpperCase(),
      maquina: maquina.toUpperCase(),
      descricao,
      status: 'Em andamento',
      cancelada: false,
      usuario_responsavel: usuarioResponsavel,
      data_entrada: new Date().toISOString()
    }

    try {
      if (navigator.onLine) {
        const numeroOS = await buscarProximoNumeroOS()
        const { data: osCriada, error: osError } = await supabase
          .from('ordens_servico')
          .insert([{ ...novaOS, numero_os: numeroOS }])
          .select()
          .single()

        if (osError) throw osError

        if (osCriada) {
          await enviarMultiplasFotos(osCriada.id)
        }

        alert('✅ OS e fotos enviadas com sucesso!')
      } else {
        throw new Error('Offline')
      }
      router.push('/dashboard')
    } catch (error) {
      const pendentes = JSON.parse(localStorage.getItem('os_pendentes') || '[]')
      const osOffline = { ...novaOS, numero_os: Date.now() }
      pendentes.push(osOffline)
      localStorage.setItem('os_pendentes', JSON.stringify(pendentes))

      alert('⚠️ Salvo localmente! Fotos só são enviadas com internet.')
      router.push('/dashboard')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-32 ${
      tema === 'dark' ? 'bg-[#07111f] text-white' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      <main className="max-w-md mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Nova OS</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Abertura de Chamado</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className={`p-3 rounded-2xl border transition-all ${
              tema === 'dark' ? 'bg-[#0d1726] border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <LayoutDashboard size={20} />
          </button>
        </div>

        <section className={`border rounded-[40px] p-6 shadow-2xl transition-all ${
          tema === 'dark' ? 'bg-[#0d1726] border-slate-700/50' : 'bg-white border-slate-200'
        }`}>
          
          <div className="space-y-4">
            <CampoModerno
              icone={<User size={20} />}
              label="Cliente"
              placeholder="NOME DO CLIENTE"
              value={cliente}
              onChange={(val) => setCliente(val.toUpperCase())}
              tema={tema}
            />

            <CampoModerno
              icone={<User size={20} />}
              label="Solicitante"
              placeholder="QUEM SOLICITOU?"
              value={solicitante}
              onChange={(val) => setSolicitante(val.toUpperCase())}
              tema={tema}
            />

            <CampoModerno
              icone={<Cpu size={20} />}
              label="Máquina / Equipamento"
              placeholder="QUAL A MÁQUINA?"
              value={maquina}
              onChange={(val) => setMaquina(val.toUpperCase())}
              tema={tema}
            />

            <div className={`rounded-3xl p-4 border transition-all ${
              tema === 'dark' ? 'bg-[#111c2e] border-slate-700/50' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block tracking-widest">Descrição do Serviço</label>
              <div className="flex gap-3">
                <FileText size={20} className="text-blue-500 mt-1" />
                <textarea
                  placeholder="Descreva o problema ou serviço..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm font-bold resize-none min-h-[100px] placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* SEÇÃO DE FOTOS - 02 OPÇÕES */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Anexar Registros Visuais</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* BOTÃO CÂMERA */}
                <label className={`flex flex-col items-center justify-center p-4 rounded-3xl border border-dashed cursor-pointer transition-all active:scale-95 ${
                  tema === 'dark' ? 'bg-[#111c2e]/50 border-slate-600' : 'bg-slate-50 border-slate-300'
                }`}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-600 text-white shadow-lg mb-2">
                    <Camera size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-blue-500">Câmera</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                </label>

                {/* BOTÃO FICHEIRO */}
                <label className={`flex flex-col items-center justify-center p-4 rounded-3xl border border-dashed cursor-pointer transition-all active:scale-95 ${
                  tema === 'dark' ? 'bg-[#111c2e]/50 border-slate-600' : 'bg-slate-50 border-slate-300'
                }`}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-700 text-white shadow-lg mb-2">
                    <FolderOpen size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Galeria</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {/* CONTADOR E LISTA DE FOTOS SELECIONADAS */}
              {fotos.length > 0 && (
                <div className={`p-3 rounded-2xl ${tema === 'dark' ? 'bg-slate-800/30' : 'bg-slate-100'}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <ImageIcon size={14} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase">{fotos.length} Arquivos selecionados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fotos.map((file, idx) => (
                      <div key={idx} className="relative w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group">
                        <ImageIcon size={16} className="text-blue-500" />
                        <button 
                          onClick={() => removerFoto(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={salvarOS}
                disabled={salvando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save size={18} /> {salvando ? 'PROCESSANDO...' : 'SALVAR ORDEM'}
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${
                  tema === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <XCircle size={16} /> Cancelar Operação
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Menu Inferior */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t backdrop-blur-md px-6 py-4 z-50 ${
        tema === 'dark' ? 'bg-[#07111f]/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          <MenuIcon label="Início" icone={<LayoutDashboard size={20} />} onClick={() => router.push('/dashboard')} ativo={false} tema={tema} />
          <MenuIcon label="Ordens" icone={<ClipboardList size={20} />} onClick={() => router.push('/ordens')} ativo={true} tema={tema} />
          <MenuIcon label="Grana" icone={<DollarSign size={20} />} onClick={() => router.push('/faturamento')} ativo={false} tema={tema} />
          <MenuIcon label="Ajustes" icone={<Settings size={20} />} onClick={() => router.push('/configuracao')} ativo={false} tema={tema} />
        </div>
      </nav>
    </div>
  )
}

function CampoModerno({ icone, label, placeholder, value, onChange, tema }: CampoProps) {
  return (
    <div className={`rounded-3xl px-4 py-3 border transition-all focus-within:border-blue-500 ${
      tema === 'dark' ? 'bg-[#111c2e] border-slate-700/50' : 'bg-slate-50 border-slate-200'
    }`}>
      <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block px-1 tracking-widest">{label}</label>
      <div className="flex items-center gap-3">
        <div className="text-blue-500">{icone}</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm font-bold placeholder:text-slate-600"
        />
      </div>
    </div>
  )
}

function MenuIcon({ label, icone, onClick, ativo, tema }: MenuIconProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 transition-all">
      <div className={`p-2 rounded-xl ${ativo ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-500'}`}>
        {icone}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-tighter ${ativo ? 'text-blue-500' : 'text-slate-500'}`}>
        {label}
      </span>
    </button>
  )
}