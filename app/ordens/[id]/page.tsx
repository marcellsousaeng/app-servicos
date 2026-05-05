'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2, FolderOpen,
  PlayCircle, PauseCircle, Pencil, Ruler, Download
} from 'lucide-react'

// Bibliotecas para PDF
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// --- INTERFACES ---
type OrdemServico = {
  id: number
  numero_os: number | null
  cliente: string
  solicitante: string | null
  maquina: string
  descricao: string
  status: string
  cancelada: boolean
  motivo_cancelamento: string | null
  motivo_parada: string | null
  usuario_responsavel: string | null
  created_at: string
}

type FotoOS = {
  id: string
  url: string
}

type Material = {
  id: string
  tipo: string
  descricao: string
  quantidade: string
  espessura?: string
  diametro?: string
  diametro_interno?: string
  comprimento?: string
  largura?: string
}

type Atualizacao = {
  id: number
  created_at: string
  ordem_servico_id: number
  descricao: string
  tecnicos_responsaveis: string | null
  usuario_nome: string | null
}

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id
  const printRef = useRef<HTMLDivElement>(null)

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [fotos, setFotos] = useState<FotoOS[]>([])
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [perfilUsuario, setPerfilUsuario] = useState<string | null>(null)
  
  const [tecnicoAtuante, setTecnicoAtuante] = useState('')
  const [atividadeExecutada, setAtividadeExecutada] = useState('')
  const [mostrarCampoAndamento, setMostrarCampoAndamento] = useState(false)
  
  const [motivoParada, setMotivoParada] = useState('')
  const [mostrarCampoParada, setMostrarCampoParada] = useState(false)
  const [atualizandoStatusRapido, setAtualizandoStatusRapido] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  const [modalEdicao, setModalEdicao] = useState(false)
  const [editForm, setEditForm] = useState({
    cliente: '',
    solicitante: '',
    maquina: '',
    descricao: ''
  })
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDados()
  }, [])

  async function carregarDados() {
    const id = Number(id_os)
    const usuarioLogado = localStorage.getItem('usuario')
    
    if (usuarioLogado) {
        const { data: userData } = await supabase
            .from('usuarios')
            .select('perfil')
            .eq('usuario', usuarioLogado)
            .single()
        if (userData) setPerfilUsuario(userData.perfil)
    }

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

    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
  }

  async function gerarPDF() {
    if (!printRef.current) return
    setGerandoPDF(true)
    try {
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: tema === 'clean' ? '#f8fafc' : '#07111f',
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`OS_${ordem?.numero_os || id_os}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPDF(false)
    }
  }

  async function atualizarStatusExecucao(novoStatus: string) {
    if (!ordem) return
    if (novoStatus === 'Em andamento') {
        if (!mostrarCampoAndamento) {
            setMostrarCampoAndamento(true)
            setMostrarCampoParada(false)
            return 
        }
        if (!tecnicoAtuante.trim() || !atividadeExecutada.trim()) {
            alert("Preencha o técnico e a atividade.");
            return
        }
    }
    if (novoStatus === 'Parado') {
        if (!mostrarCampoParada) {
            setMostrarCampoParada(true)
            setMostrarCampoAndamento(false)
            return 
        }
        if (!motivoParada.trim()) {
            alert("Digite o motivo da parada.");
            return
        }
    }

    setAtualizandoStatusRapido(true)
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        status: novoStatus,
        motivo_parada: novoStatus === 'Parado' ? motivoParada : null,
        usuario_responsavel: novoStatus === 'Em andamento' ? tecnicoAtuante : ordem.usuario_responsavel
      })
      .eq('id', ordem.id)

    if (!error) {
      await supabase.from('os_atualizacoes').insert([{
        ordem_servico_id: ordem.id,
        descricao: novoStatus === 'Em andamento' ? `EXECUTANDO: ${atividadeExecutada}` : `PARALISADO: ${motivoParada}`,
        tecnicos_responsaveis: novoStatus === 'Em andamento' ? tecnicoAtuante : null,
        usuario_nome: 'SISTEMA'
      }])
      setMostrarCampoParada(false)
      setMostrarCampoAndamento(false)
      setAtividadeExecutada('')
      await carregarDados()
    }
    setAtualizandoStatusRapido(false)
  }

  async function salvarEdicaoOS() {
    if (!ordem) return
    setSalvandoEdicao(true)
    const { error } = await supabase.from('ordens_servico').update({
        cliente: editForm.cliente,
        solicitante: editForm.solicitante,
        maquina: editForm.maquina,
        descricao: editForm.descricao
      }).eq('id', ordem.id)

    if (!error) { setModalEdicao(false); carregarDados(); }
    setSalvandoEdicao(false)
  }

  async function handleAddFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !ordem) return
    try {
      const uploads = Array.from(files).map(async (file) => {
        const nomeArquivo = `${ordem.id}/${Date.now()}-${file.name}`
        await supabase.storage.from('os-imagens').upload(nomeArquivo, file)
        const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(nomeArquivo)
        return supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
      })
      await Promise.all(uploads)
      carregarDados()
    } catch (err) { alert("Erro ao enviar foto") }
  }

  async function alterarStatus(novoStatus: string) {
    if (!ordem) return
    if (!confirm(`Deseja alterar para ${novoStatus}?`)) return
    const { error } = await supabase.from('ordens_servico').update({ 
      status: novoStatus, 
      cancelada: novoStatus === 'Cancelado'
    }).eq('id', ordem.id)
    if (!error) carregarDados()
  }

  const clean = tema === 'clean'
  const encerrada = ordem?.status === 'Finalizado' || ordem?.status === 'Cancelado'
  const podeEditarSempre = perfilUsuario && ['Engenheiro', 'Diretor', 'Encarregado de Produção'].includes(perfilUsuario)

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>
  if (!ordem) return <div className="p-10 text-center">OS não encontrada.</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      <div ref={printRef} className="pt-6">
        <main className="max-w-md mx-auto px-5">
          
          {/* HEADER */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border no-print ${clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem.numero_os ?? ordem.id}</h1>
              <span className={badgeEstilo(ordem.status)}>{ordem.status}</span>
            </div>
            <div className="flex gap-2 no-print">
              <button onClick={gerarPDF} disabled={gerandoPDF} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-500/10 rounded-xl">
                {gerandoPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
              {(!encerrada || podeEditarSempre) && (
                <button onClick={() => setModalEdicao(true)} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-500/10 rounded-xl">
                  <Pencil size={18} />
                </button>
              )}
            </div>
          </div>

          {/* CONTROLE OPERACIONAL - Oculto no PDF */}
          {!encerrada && (
            <section className="rounded-3xl p-5 mb-5 border shadow-sm no-print bg-blue-500/5 border-blue-500/10">
              <div className="flex gap-2">
                <button onClick={() => atualizarStatusExecucao('Em andamento')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 border ${ordem.status === 'Em andamento' ? 'bg-blue-600 text-white' : 'bg-slate-800/40 text-slate-400'}`}>
                  <PlayCircle size={18} /> <span className="text-[10px] font-black uppercase">Andamento</span>
                </button>
                <button onClick={() => atualizarStatusExecucao('Parado')} className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 border ${ordem.status === 'Parado' ? 'bg-amber-500 text-white' : 'bg-slate-800/40 text-slate-400'}`}>
                  <PauseCircle size={18} /> <span className="text-[10px] font-black uppercase">Parar</span>
                </button>
              </div>

              {mostrarCampoAndamento && (
                <div className="mt-4 space-y-3">
                  <input type="text" value={tecnicoAtuante} onChange={(e) => setTecnicoAtuante(e.target.value)} placeholder="Técnico..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm" />
                  <textarea value={atividadeExecutada} onChange={(e) => setAtividadeExecutada(e.target.value)} placeholder="Atividade..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm" />
                  <button onClick={() => atualizarStatusExecucao('Em andamento')} className="w-full py-3 bg-blue-600 rounded-xl text-[10px] font-black uppercase">Confirmar Início</button>
                </div>
              )}
              {mostrarCampoParada && (
                <div className="mt-4 space-y-3">
                  <textarea value={motivoParada} onChange={(e) => setMotivoParada(e.target.value)} placeholder="Motivo da parada..." className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm" />
                  <button onClick={() => atualizarStatusExecucao('Parado')} className="w-full py-3 bg-amber-500 rounded-xl text-[10px] font-black uppercase">Confirmar Parada</button>
                </div>
              )}
            </section>
          )}

          {/* INFOS */}
          <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem.cliente} />
              <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem.maquina} />
              <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem.solicitante || '-'} />
              <InfoItem clean={clean} Icone={User} titulo="Técnico Atual" texto={ordem.usuario_responsavel || '-'} />
              <InfoItem clean={clean} Icone={FileText} titulo="Descrição" texto={ordem.descricao} full />
            </div>
          </section>

          {/* FOTOS */}
          <section className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Camera size={20} className="text-blue-500" />
              <h2 className="font-black uppercase text-xs tracking-tighter">Fotos de Campo</h2>
            </div>
            {!encerrada && (
              <div className="flex gap-2 mb-4 no-print">
                <label className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl cursor-pointer text-[10px] font-black uppercase"><Camera size={14} /> Câmera<input type="file" hidden capture="environment" onChange={handleAddFoto} /></label>
                <label className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-xl cursor-pointer text-[10px] font-black uppercase"><FolderOpen size={14} /> Galeria<input type="file" multiple hidden onChange={handleAddFoto} /></label>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((f) => (
                <img key={f.id} src={f.url} className="w-full h-32 object-cover rounded-xl border border-slate-700/30" />
              ))}
            </div>
          </section>

          {/* MATERIAIS */}
          {materiais.length > 0 && (
            <section className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
              <h2 className="font-black uppercase text-xs mb-4">Materiais Utilizados</h2>
              <div className="space-y-3">
                {materiais.map((m) => (
                  <div key={m.id} className="p-4 bg-slate-500/5 rounded-2xl border border-white/5">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-black uppercase text-blue-500">{m.tipo?.replace('_', ' ')}</span>
                      <span className="text-xs font-black">x{m.quantidade}</span>
                    </div>
                    <p className="text-xs font-bold uppercase">{m.descricao}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                      {m.espessura && <MedidaDetalhe label="Esp." valor={`${m.espessura}mm`} />}
                      {m.largura && <MedidaDetalhe label="Larg." valor={`${m.largura}mm`} />}
                      {m.comprimento && <MedidaDetalhe label="Comp." valor={`${m.comprimento}mm`} />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HISTÓRICO */}
          <section className={`rounded-3xl p-6 mb-8 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-800'}`}>
            <h2 className="font-black uppercase text-xs mb-6 text-purple-500">Histórico de Mão de Obra</h2>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-500/10">
              {atualizacoes.map((item) => (
                <div key={item.id} className="pl-8 relative">
                  <div className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-4 ${clean ? 'border-white' : 'border-[#0d1726]'}`} />
                  <div className="flex justify-between text-[10px] uppercase font-black">
                    <span className="text-blue-500">{item.tecnicos_responsaveis || item.usuario_nome}</span>
                    <span className="opacity-40">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-medium mt-1">{item.descricao}</p>
                </div>
              ))}
            </div>
          </section>

          {/* AÇÕES FINAIS - Oculto no PDF */}
          {!encerrada && (
            <div className="grid grid-cols-2 gap-4 mb-10 no-print">
              <button onClick={() => alterarStatus('Cancelado')} className="flex flex-col items-center p-5 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20"><XCircle size={28} className="mb-2" /> <span className="text-[10px] font-black uppercase">Cancelar</span></button>
              <button onClick={() => alterarStatus('Finalizado')} className="flex flex-col items-center p-5 rounded-3xl bg-emerald-500 text-white shadow-lg"><CheckCircle2 size={28} className="mb-2" /> <span className="text-[10px] font-black uppercase">Finalizar</span></button>
            </div>
          )}
        </main>
      </div>

      {/* MENU NAVEGAÇÃO - Oculto no PDF */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 px-6 z-50 no-print ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          <MenuNav titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuNav ativo titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuNav titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuNav titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL EDIÇÃO */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[101] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[32px] p-8 border ${clean ? 'bg-white' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
                <h2 className="text-lg font-black uppercase italic mb-6">Editar OS</h2>
                <div className="space-y-4">
                    <input value={editForm.cliente} onChange={(e) => setEditForm({...editForm, cliente: e.target.value})} placeholder="Cliente" className="w-full rounded-xl p-3 bg-slate-900 border border-slate-700" />
                    <input value={editForm.solicitante} onChange={(e) => setEditForm({...editForm, solicitante: e.target.value})} placeholder="Solicitante" className="w-full rounded-xl p-3 bg-slate-900 border border-slate-700" />
                    <input value={editForm.maquina} onChange={(e) => setEditForm({...editForm, maquina: e.target.value})} placeholder="Máquina" className="w-full rounded-xl p-3 bg-slate-900 border border-slate-700" />
                    <textarea value={editForm.descricao} onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} placeholder="Descrição" className="w-full rounded-xl p-3 bg-slate-900 border border-slate-700 min-h-[100px]" />
                    <button onClick={salvarEdicaoOS} disabled={salvandoEdicao} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-white shadow-lg">{salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}</button>
                    <button onClick={() => setModalEdicao(false)} className="w-full text-xs font-bold text-slate-500 uppercase mt-2">Fechar</button>
                </div>
            </div>
        </div>
      )}

      {/* Estilo para ocultar elementos na geração do PDF */}
      <style jsx global>{`
        @media print { .no-print { display: none !important; } }
        .no-print { transition: opacity 0.2s; }
      `}</style>
    </div>
  )
}

// --- AUXILIARES ---
function InfoItem({ Icone, titulo, texto, full, clean }: any) {
  return (
    <div className={`flex gap-3 ${full ? 'col-span-2 mt-2 border-t pt-4 border-slate-500/10' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}><Icone size={16} /></div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase opacity-40 mb-0.5">{titulo}</p>
        <p className="text-sm font-bold leading-tight break-words">{texto}</p>
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 ${ativo ? 'text-blue-500' : 'text-slate-500'}`}>
      <Icone size={22} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function MedidaDetalhe({ label, valor }: { label: string, valor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-black uppercase opacity-40 mb-1">{label}</span>
      <span className="text-xs font-bold">{valor}</span>
    </div>
  )
}

function badgeEstilo(status: string) {
  const base = "text-[10px] font-black px-2 py-0.5 rounded-md border uppercase "
  if (status === 'Finalizado') return base + 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
  if (status === 'Cancelado') return base + 'bg-rose-500/10 border-rose-500/20 text-rose-500'
  if (status === 'Parado') return base + 'bg-amber-500/10 border-amber-500/20 text-amber-500'
  return base + 'bg-blue-500/10 border-blue-500/20 text-blue-500'
}