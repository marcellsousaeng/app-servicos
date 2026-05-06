'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings,
  PlayCircle, PauseCircle, Pencil, Download, X, ImagePlus,
  Trash2, CheckCircle, Wrench
} from 'lucide-react'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id

  const [ordem, setOrdem] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  // Estados de UI
  const [modalEdicao, setModalEdicao] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ cliente: '', solicitante: '', maquina: '', descricao: '' })
  const [tecnicoAtuante, setTecnicoAtuante] = useState('')
  const [atividadeExecutada, setAtividadeExecutada] = useState('')
  const [mostrarCampoAndamento, setMostrarCampoAndamento] = useState(false)
  const [motivoParada, setMotivoParada] = useState('')
  const [mostrarCampoParada, setMostrarCampoParada] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)

  useEffect(() => {
    carregarDados()
    const t = localStorage.getItem('tema-app') as any
    if (t) setTema(t)
  }, [])

  async function carregarDados() {
    const id = Number(id_os)
    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    
    setOrdem(osData)
    setEditForm({
      cliente: osData.cliente || '',
      solicitante: osData.solicitante || '',
      maquina: osData.maquina || '',
      descricao: osData.descricao || ''
    })
    
    const { data: fotosData } = await supabase.from('fotos_os').select('id, url').eq('id_os', id)
    setFotos(fotosData || [])
    
    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])
    setCarregando(false)
  }

  async function alterarStatus(novoStatus: string, descricaoTexto: string) {
    if (!descricaoTexto) return alert("Preencha a descrição.")
    try {
      await supabase.from('ordens_servico').update({ status: novoStatus }).eq('id', ordem.id)
      await supabase.from('os_atualizacoes').insert([{
        ordem_servico_id: ordem.id,
        descricao: tecnicoAtuante ? `[${tecnicoAtuante.toUpperCase()}]: ${descricaoTexto}` : descricaoTexto,
        usuario_nome: tecnicoAtuante || 'Técnico',
        tipo_status: novoStatus
      }])
      setMostrarCampoAndamento(false)
      setMostrarCampoParada(false)
      setAtividadeExecutada('')
      setMotivoParada('')
      carregarDados()
    } catch (e) { alert("Erro ao salvar.") }
  }

  async function handleAddFoto(e: any) {
    if (!e.target.files?.[0]) return
    setSubindoFoto(true)
    const file = e.target.files[0]
    const path = `${ordem.id}/${Date.now()}-${file.name}`
    await supabase.storage.from('os-imagens').upload(path, file)
    const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(path)
    await supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
    carregarDados()
    setSubindoFoto(false)
  }

  const clean = tema === 'clean'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-black">CARREGANDO...</div>

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      {/* HEADER */}
      <header className="pt-6 px-5 max-w-md mx-auto flex items-center justify-between gap-4">
        <button onClick={() => router.back()} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0d1726] border-slate-700'}`}>
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">OS #{ordem?.numero_os || ordem?.id}</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest">{ordem?.status}</span>
        </div>
        <button onClick={() => setModalEdicao(true)} className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20"><Pencil size={18} /></button>
      </header>

      <main className="max-w-md mx-auto px-5 pt-8">
        
        {/* INFO CARD */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100 shadow-sm' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-6">
            <InfoBox label="Cliente" value={ordem?.cliente} clean={clean} Icon={User} />
            <InfoBox label="Máquina" value={ordem?.maquina} clean={clean} Icon={Monitor} />
            <InfoBox label="Solicitante" value={ordem?.solicitante} clean={clean} Icon={Users} />
            <InfoBox label="Técnico" value={ordem?.usuario_responsavel} clean={clean} Icon={Wrench} />
            <div className="col-span-2 pt-2 border-t border-white/5">
              <p className="text-[10px] font-black uppercase text-blue-500 mb-1 opacity-80">Descrição do Problema</p>
              <p className="text-xs font-medium opacity-70 leading-relaxed italic">"{ordem?.descricao}"</p>
            </div>
          </div>
        </div>

        {/* STATUS BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => { setMostrarCampoAndamento(true); setMostrarCampoParada(false); }} className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${ordem?.status === 'Em Andamento' ? 'bg-blue-600 text-white' : 'bg-slate-500/10 text-slate-500'}`}><PlayCircle size={18} /> Iniciar</button>
            <button onClick={() => { setMostrarCampoParada(true); setMostrarCampoAndamento(false); }} className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${ordem?.status === 'Parado' ? 'bg-amber-500 text-white' : 'bg-slate-500/10 text-slate-500'}`}><PauseCircle size={18} /> Parar</button>
        </div>

        {/* FORMS */}
        {mostrarCampoAndamento && (
          <div className="mb-6 p-5 rounded-3xl border border-blue-500/30 bg-blue-500/5 animate-in slide-in-from-top-4 duration-300">
            <input value={tecnicoAtuante} onChange={e => setTecnicoAtuante(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-2 bg-black/20 border border-white/10 outline-none" placeholder="Técnico Executor" />
            <textarea value={atividadeExecutada} onChange={e => setAtividadeExecutada(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-3 bg-black/20 border border-white/10 outline-none" placeholder="O que foi feito?" />
            <button onClick={() => alterarStatus('Em Andamento', atividadeExecutada)} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase">Salvar Andamento</button>
          </div>
        )}

        {mostrarCampoParada && (
          <div className="mb-6 p-5 rounded-3xl border border-amber-500/30 bg-amber-500/5 animate-in slide-in-from-top-4 duration-300">
            <textarea value={motivoParada} onChange={e => setMotivoParada(e.target.value)} className="w-full p-4 rounded-xl text-xs mb-3 bg-black/20 border border-white/10 outline-none" placeholder="Motivo da parada..." />
            <button onClick={() => alterarStatus('Parado', motivoParada)} className="w-full py-4 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase">Registrar Pausa</button>
          </div>
        )}

        {/* FOTOS - AUMENTADAS E COM CLICK */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-blue-500 mb-4 tracking-widest">Fotos de Campo</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            <label className="flex flex-col items-center justify-center min-w-[100px] h-24 bg-blue-600/10 border-2 border-dashed border-blue-500/30 rounded-2xl cursor-pointer text-blue-500 shrink-0">
              <Camera size={24} />
              <input type="file" hidden capture="environment" accept="image/*" onChange={handleAddFoto} />
            </label>
            {fotos.map((f) => (
              <img 
                key={f.id} 
                src={f.url} 
                onClick={() => setFotoSelecionada(f.url)}
                className="w-24 h-24 object-cover rounded-2xl shrink-0 snap-start border border-white/5 active:scale-95 transition-transform" 
              />
            ))}
            {subindoFoto && <div className="w-24 h-24 flex items-center justify-center bg-white/5 rounded-2xl shrink-0"><Loader2 className="animate-spin text-blue-500" /></div>}
          </div>
        </div>

        {/* MATERIAIS */}
        <button onClick={() => router.push(`/ordens/${id_os}/material`)} className="w-full py-5 mb-6 rounded-[32px] border-2 border-dashed border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest">+ Peças e Materiais</button>

        {/* HISTÓRICO */}
        <div className={`rounded-[32px] p-6 mb-6 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <h2 className="text-[10px] font-black uppercase text-purple-500 mb-6 italic tracking-widest">Linha do Tempo</h2>
          <div className="space-y-6">
            {atualizacoes.map((at) => (
              <div key={at.id} className="relative pl-6 border-l-2 border-white/5">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#07111f] border-2 ${at.tipo_status === 'Parado' ? 'border-amber-500' : 'border-blue-500'}`} />
                <p className="text-[9px] font-black uppercase opacity-40 mb-1">{new Date(at.created_at).toLocaleString()}</p>
                <p className="text-xs opacity-80 italic">"{at.descricao}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES FINAIS */}
        <div className="grid grid-cols-2 gap-3 mb-10">
            <button onClick={() => alert("Finalizando...")} className="flex items-center justify-center gap-2 py-5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-3xl font-black text-[10px] uppercase"><CheckCircle size={18} /> Finalizar</button>
            <button onClick={() => alert("Cancelando...")} className="flex items-center justify-center gap-2 py-5 bg-red-600/10 text-red-500 border border-red-500/20 rounded-3xl font-black text-[10px] uppercase"><Trash2 size={18} /> Cancelar</button>
        </div>
      </main>

      {/* MODAL FOTO (ABRE AO CLICAR NA MOTO) */}
      {fotoSelecionada && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <button onClick={() => setFotoSelecionada(null)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={24}/></button>
          <img src={fotoSelecionada} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl" />
        </div>
      )}

      {/* MENU INFERIOR CORRIGIDO (ESPAÇAMENTO) */}
      <footer className={`fixed bottom-0 left-0 right-0 border-t py-4 px-8 flex justify-between items-center z-40 ${clean ? 'bg-white/80 border-slate-200' : 'bg-[#07111f]/90 border-slate-800'} backdrop-blur-xl`}>
        <NavItem Icon={LayoutGrid} label="Home" onClick={() => router.push('/dashboard')} />
        <NavItem Icon={ClipboardList} label="Ordens" active onClick={() => router.push('/ordens')} />
        <NavItem Icon={CircleDollarSign} label="Faturas" onClick={() => router.push('/faturamento')} />
        <NavItem Icon={Settings} label="Ajustes" onClick={() => router.push('/configuracao')} />
      </footer>
    </div>
  )
}

function NavItem({ Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500 scale-110' : 'text-slate-500 opacity-60'}`}>
      <Icon size={22} strokeWidth={active ? 3 : 2} />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function InfoBox({ label, value, Icon, clean }: any) {
  return (
    <div className="flex gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-600/10 text-blue-400'}`}><Icon size={18} /></div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-black uppercase opacity-40 mb-0.5 tracking-tighter">{label}</p>
        <p className="text-xs font-bold truncate">{value || '-'}</p>
      </div>
    </div>
  )
}

const Loader2 = ({className}: any) => <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${className}`} />