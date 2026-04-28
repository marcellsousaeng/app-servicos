'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, Plus, ClipboardList, User, Monitor, 
  FileText, Camera, Search, Users, LayoutGrid, 
  CircleDollarSign, Settings, X, Layers, CheckCircle2, XCircle, Loader2, FolderOpen,
  PlayCircle, PauseCircle, Pencil
} from 'lucide-react'

// Interfaces
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
  usuario_responsavel: string | null
  created_at: string
  numero_pedido_faturamento: string | null
  numero_os_faturamento: string | null
}

type FotoOS = {
  id: string
  url: string
}

type Material = {
  id: string
  tipo: string
  descricao: string
  espessura: string
  diametro: string
  comprimento: string
  largura: string
  quantidade: string
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

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [fotos, setFotos] = useState<FotoOS[]>([])
  const [nomeResponsavel, setNomeResponsavel] = useState('-')
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [salvandoAtualizacao, setSalvandoAtualizacao] = useState(false)
  const [modalAtualizacao, setModalAtualizacao] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  const [numPedido, setNumPedido] = useState('')
  const [numOSFaturam, setNumOSFaturam] = useState('')
  const [salvandoDadosExtras, setSalvandoDadosExtras] = useState(false)

  // Estados para Controle de Parada
  const [motivoParada, setMotivoParada] = useState('')
  const [atualizandoStatusRapido, setAtualizandoStatusRapido] = useState(false)

  // Estados para Edição da OS
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
    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    
    setOrdem(osData)
    setNumPedido(osData.numero_pedido_faturamento || '')
    setNumOSFaturam(osData.numero_os_faturamento || '')
    setMotivoParada(osData.motivo_cancelamento || '')
    
    setEditForm({
      cliente: osData.cliente || '',
      solicitante: osData.solicitante || '',
      maquina: osData.maquina || '',
      descricao: osData.descricao || ''
    })

    const { data: fotosData } = await supabase.from('fotos_os').select('id, url').eq('id_os', id)
    setFotos(fotosData || [])

    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', osData.usuario_responsavel).single()
    setNomeResponsavel(user?.nome || osData.usuario_responsavel || '-')

    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])

    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
  }

  async function atualizarStatusExecucao(novoStatus: string) {
    if (!ordem) return
    if (novoStatus === 'Parado' && !motivoParada.trim()) {
      alert("Por favor, descreva o motivo da parada no campo abaixo.")
      return
    }

    setAtualizandoStatusRapido(true)
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        status: novoStatus,
        motivo_cancelamento: novoStatus === 'Parado' ? motivoParada : null
      })
      .eq('id', ordem.id)

    if (!error) {
      if (novoStatus === 'Em andamento') setMotivoParada('')
      await carregarDados()
    }
    setAtualizandoStatusRapido(false)
  }

  async function salvarEdicaoOS() {
    if (!ordem) return
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        cliente: editForm.cliente,
        solicitante: editForm.solicitante,
        maquina: editForm.maquina,
        descricao: editForm.descricao
      })
      .eq('id', ordem.id)

    if (!error) {
      setModalEdicao(false)
      carregarDados()
    } else {
      alert("Erro ao atualizar dados.")
    }
    setSalvandoEdicao(false)
  }

  async function handleAddFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0 || !ordem) return

    setEnviandoFoto(true)
    try {
      const uploads = Array.from(files).map(async (file) => {
        const nomeArquivo = `${ordem.id}/${Date.now()}-${file.name}`
        const { error: storageError } = await supabase.storage.from('os-imagens').upload(nomeArquivo, file)
        if (storageError) throw storageError

        const { data: { publicUrl } } = supabase.storage.from('os-imagens').getPublicUrl(nomeArquivo)
        return supabase.from('fotos_os').insert([{ id_os: ordem.id, url: publicUrl }])
      })

      await Promise.all(uploads)
      carregarDados()
    } catch (err) {
      alert("Erro ao enviar foto")
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvarAtualizacao() {
    if (!ordem || !descricaoAtualizacao.trim()) return
    setSalvandoAtualizacao(true)
    const usuarioSalvo = localStorage.getItem('usuario')
    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', usuarioSalvo).single()
    
    const { error } = await supabase.from('os_atualizacoes').insert([{
      ordem_servico_id: ordem.id,
      descricao: descricaoAtualizacao,
      tecnicos_responsaveis: tecnicosResponsaveis,
      usuario_nome: user?.nome || usuarioSalvo,
    }])

    if (!error) {
      setDescricaoAtualizacao(''); setTecnicosResponsaveis('')
      setModalAtualizacao(false); carregarDados()
    }
    setSalvandoAtualizacao(false)
  }

  async function alterarStatus(novoStatus: string) {
    if (!ordem) return
    if (!confirm(`Deseja alterar o status para ${novoStatus}?`)) return
    const { error } = await supabase.from('ordens_servico').update({ 
      status: novoStatus, 
      cancelada: novoStatus === 'Cancelado'
    }).eq('id', ordem.id)
    if (!error) carregarDados()
  }

  async function salvarDadosFaturamento() {
    setSalvandoDadosExtras(true)
    const { error } = await supabase
      .from('ordens_servico')
      .update({
        numero_pedido_faturamento: numPedido,
        numero_os_faturamento: numOSFaturam
      })
      .eq('id', ordem?.id)

    if (!error) {
      alert("Dados de faturamento atualizados!")
      carregarDados()
    }
    setSalvandoDadosExtras(false)
  }

  const clean = tema === 'clean'
  const encerrada = ordem?.status === 'Finalizado' || ordem?.status === 'Cancelado'
  const exibirFaturamento = ordem && ordem.status !== 'Cancelado' && ordem.status !== 'Nova'

  if (carregando) return (
    <div className={`min-h-screen flex items-center justify-center font-bold ${clean ? 'bg-slate-50 text-slate-400' : 'bg-[#07111f] text-blue-500'}`}>
      Sincronizando Relatório...
    </div>
  )

  if (!ordem) return <div className="p-10 text-center">OS não encontrada.</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem.numero_os ?? ordem.id}</h1>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${badgeEstilo(ordem.status)}`}>
                {ordem.status}
                </span>
                {!encerrada && (
                    <button onClick={() => setModalEdicao(true)} className="p-1 text-blue-500 active:scale-90 transition-transform">
                        <Pencil size={14} />
                    </button>
                )}
            </div>
          </div>
          {!encerrada && (
            <button onClick={() => setModalAtualizacao(true)} className={`h-12 px-4 rounded-2xl flex items-center gap-2 text-xs font-black uppercase border shadow-lg transition-all ${clean ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0d1726] border-blue-500/30 text-blue-400'}`}>
              <Plus size={16} /> Atualizar
            </button>
          )}
        </div>

        {/* STATUS DE EXECUÇÃO COMPACTO */}
        {!encerrada && (
          <section className={`rounded-3xl p-5 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-tighter">Status de Execução</h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => atualizarStatusExecucao('Em andamento')} 
                disabled={atualizandoStatusRapido || ordem.status === 'Em andamento'}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${ordem.status === 'Em andamento' ? 'bg-blue-600 border-blue-400 text-white shadow-md' : clean ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
              >
                <PlayCircle size={18} className={ordem.status === 'Em andamento' ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase">Andamento</span>
              </button>

              <button 
                onClick={() => { if(ordem.status !== 'Parado') atualizarStatusExecucao('Parado') }} 
                disabled={atualizandoStatusRapido || ordem.status === 'Parado'}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 border transition-all active:scale-95 ${ordem.status === 'Parado' ? 'bg-amber-500 border-amber-400 text-white shadow-md' : clean ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'}`}
              >
                <PauseCircle size={18} />
                <span className="text-[10px] font-black uppercase">Parar</span>
              </button>
            </div>

            {/* CAMPO DE MOTIVO - APARECE QUANDO STATUS FOR PARADO */}
            {ordem.status === 'Parado' && (
              <div className="mt-4 space-y-2 animate-in slide-in-from-top-1 duration-300">
                <label className="text-[9px] font-black uppercase text-amber-500 ml-1">Motivo da Parada:</label>
                <textarea 
                  value={motivoParada} 
                  onChange={(e) => setMotivoParada(e.target.value)} 
                  placeholder="Descreva o porquê do serviço estar parado..."
                  className={`w-full rounded-xl p-3 text-sm font-bold outline-none border transition-all min-h-[80px] ${clean ? 'bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900' : 'bg-[#111c2e] border-slate-700 focus:border-amber-500 text-white'}`} 
                />
                <button 
                  onClick={() => atualizarStatusExecucao('Parado')} 
                  className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase"
                >
                  Salvar Motivo
                </button>
              </div>
            )}
          </section>
        )}

        {/* INFO PRINCIPAIS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem.cliente} />
            <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem.maquina} />
            <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem.solicitante || '-'} />
            <InfoItem clean={clean} Icone={User} titulo="Responsável" texto={nomeResponsavel} />
            <InfoItem clean={clean} Icone={FileText} titulo="Descrição Original" texto={ordem.descricao} full />
          </div>
        </section>

        {/* GALERIA DE FOTOS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Camera size={20} className="text-blue-500" />
              <h2 className="font-black uppercase tracking-tighter">Fotos do Registro</h2>
            </div>
            {!encerrada && (
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-3 rounded-xl cursor-pointer active:scale-95 transition-all shadow-md">
                  {enviandoFoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  <span className="text-[10px] font-black uppercase">Câmera</span>
                  <input type="file" hidden accept="image/*" capture="environment" onChange={handleAddFoto} disabled={enviandoFoto} />
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 border px-3 py-3 rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm ${clean ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-700/50 border-slate-600 text-slate-200'}`}>
                  <FolderOpen size={16} />
                  <span className="text-[10px] font-black uppercase">Ficheiro</span>
                  <input type="file" multiple hidden accept="image/*" onChange={handleAddFoto} disabled={enviandoFoto} />
                </label>
              </div>
            )}
          </div>
          {fotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((f) => (
                <div key={f.id} className="relative group">
                  <img src={f.url} alt="Registro" className="w-full h-32 object-cover rounded-xl border border-slate-700/30 shadow-sm" />
                  <a href={f.url} target="_blank" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                    <Search size={20} className="text-white" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 rounded-2xl border-2 border-dashed border-slate-500/10 flex flex-col items-center justify-center text-slate-500 gap-1">
              <Camera size={24} opacity={0.3} />
              <span className="text-[9px] font-bold uppercase">Nenhum registro visual</span>
            </div>
          )}
        </section>

        {/* MATERIAIS */}
        <div className="mb-6">
          {!encerrada && (
            <button onClick={() => router.push(`/ordens/${id_os}/material`)} className={`w-full py-4 mb-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 active:scale-95 transition-all ${clean ? 'bg-white border-blue-500/30 text-blue-600' : 'bg-[#0d1726] border-blue-500/20 text-blue-400'}`}>
              <Plus size={20} /> <span className="font-black uppercase italic tracking-tight">Acrescentar Material</span>
            </button>
          )}
          {materiais.length > 0 && (
            <section className={`rounded-3xl p-6 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-4 border-b border-slate-500/10 pb-4">
                <Layers size={18} className="text-blue-500" />
                <h2 className="font-black uppercase tracking-tighter">Materiais Utilizados</h2>
              </div>
              <div className="space-y-3">
                {materiais.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-500/5 p-3 rounded-xl border border-white/5">
                    <div>
                      <p className="text-xs font-black uppercase text-blue-500">{m.descricao || m.tipo}</p>
                      <p className="text-[10px] opacity-60">
                        {m.tipo === 'chapa' && `${m.espessura}mm x ${m.largura}mm x ${m.comprimento}mm`}
                        {(m.tipo === 'eixo' || m.tipo === 'tubo') && `Ø ${m.diametro}mm x ${m.comprimento}mm`}
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">x{m.quantidade}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* MÃO DE OBRA */}
        <section className={`rounded-3xl p-6 mb-8 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-500/10 pb-4">
            <FileText size={20} className="text-purple-500" />
            <h2 className="font-black uppercase tracking-tighter">Mão de Obra</h2>
          </div>
          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-500/10">
            {atualizacoes.map((item) => (
              <div key={item.id} className="pl-8 relative">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-4 border-[#0d1726]" />
                <div className="flex justify-between items-start">
                  <p className="font-black text-xs uppercase text-blue-500">{item.usuario_nome}</p>
                  <span className="text-[9px] font-bold opacity-40">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm font-medium mt-2 leading-relaxed">{item.descricao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FATURAMENTO */}
        {exibirFaturamento && (
          <section className={`rounded-3xl p-6 mb-8 border shadow-lg transition-all duration-500 ${ordem.status === 'Finalizado' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-blue-500/40 bg-blue-500/5'} ${clean ? 'bg-white' : 'bg-[#0d1726]'}`}>
            <div className="flex items-center gap-2 mb-6">
              <CircleDollarSign size={20} className={ordem.status === 'Finalizado' ? 'text-emerald-500' : 'text-blue-500'} />
              <h2 className="font-black uppercase tracking-tighter">Faturamento</h2>
            </div>
            <div className="space-y-4">
              <input type="text" value={numPedido} onChange={(e) => setNumPedido(e.target.value)} placeholder="Número do Pedido"
                className={`w-full rounded-2xl p-4 text-sm font-bold outline-none border transition-all ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`} />
              <input type="text" value={numOSFaturam} onChange={(e) => setNumOSFaturam(e.target.value)} placeholder="Número da OS (Sistema)"
                className={`w-full rounded-2xl p-4 text-sm font-bold outline-none border transition-all ${clean ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#111c2e] border-slate-700 text-white'}`} />
              <button onClick={salvarDadosFaturamento} disabled={salvandoDadosExtras} className={`w-full py-4 rounded-2xl font-black uppercase text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${ordem.status === 'Finalizado' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                {salvandoDadosExtras ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Salvar Dados
              </button>
            </div>
          </section>
        )}

        {/* BOTÕES DE FINALIZAÇÃO */}
        {!encerrada && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            <button onClick={() => alterarStatus('Cancelado')} className="flex flex-col items-center justify-center p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 active:scale-95 transition-all">
              <XCircle size={28} className="mb-2" />
              <span className="text-[10px] font-black uppercase">Cancelar OS</span>
            </button>
            <button onClick={() => alterarStatus('Finalizado')} className="flex flex-col items-center justify-center p-5 rounded-3xl bg-emerald-500 text-white shadow-lg active:scale-95 transition-all">
              <CheckCircle2 size={28} className="mb-2" />
              <span className="text-[10px] font-black uppercase">Finalizar OS</span>
            </button>
          </div>
        )}
      </main>

      {/* MENU INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-3 px-6 z-50 transition-colors ${clean ? 'bg-white border-slate-200' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
          <MenuNav titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuNav ativo titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuNav titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuNav titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL DE EDIÇÃO DOS DADOS DA OS */}
      {modalEdicao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[101] flex items-center justify-center p-6">
            <div className={`w-full max-w-sm rounded-[32px] p-8 border shadow-2xl animate-in zoom-in-95 duration-200 ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black uppercase italic">Editar Dados</h2>
                    <button onClick={() => setModalEdicao(false)} className="text-slate-500"><X size={24}/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Cliente</label>
                        <input value={editForm.cliente} onChange={(e) => setEditForm({...editForm, cliente: e.target.value})} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e] border-slate-700'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Solicitante</label>
                        <input value={editForm.solicitante} onChange={(e) => setEditForm({...editForm, solicitante: e.target.value})} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e] border-slate-700'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Máquina</label>
                        <input value={editForm.maquina} onChange={(e) => setEditForm({...editForm, maquina: e.target.value})} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none ${clean ? 'bg-slate-50' : 'bg-[#111c2e] border-slate-700'}`} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Descrição</label>
                        <textarea value={editForm.descricao} onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} className={`w-full rounded-xl p-3 text-sm font-bold border outline-none min-h-[100px] ${clean ? 'bg-slate-50' : 'bg-[#111c2e] border-slate-700'}`} />
                    </div>
                    <button onClick={salvarEdicaoOS} disabled={salvandoEdicao} className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase text-white shadow-lg active:scale-95 transition-all">
                        {salvandoEdicao ? <Loader2 className="animate-spin mx-auto"/> : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE ATUALIZAÇÃO MÃO DE OBRA */}
      {modalAtualizacao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end animate-in fade-in slide-in-from-bottom duration-300">
          <div className={`w-full max-w-md mx-auto rounded-t-[40px] p-8 pb-10 border-t ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic">Nova Atualização</h2>
              <button onClick={() => setModalAtualizacao(false)} className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <textarea placeholder="O que foi feito?" value={descricaoAtualizacao} onChange={(e) => setDescricaoAtualizacao(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none min-h-[120px] border transition-all ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700'}`} />
              <input placeholder="Técnico responsável" value={tecnicosResponsaveis} onChange={(e) => setTecnicosResponsaveis(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none border transition-all ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700'}`} />
              <button onClick={salvarAtualizacao} disabled={salvandoAtualizacao} className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-white shadow-lg active:scale-95 transition-all">
                {salvandoAtualizacao ? 'Gravando...' : 'Salvar Relatório'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ Icone, titulo, texto, full, clean }: any) {
  return (
    <div className={`flex gap-3 ${full ? 'col-span-2 mt-2 border-t pt-4 border-slate-500/10' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
        <Icone size={16} />
      </div>
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase mb-0.5 ${clean ? 'text-slate-400' : 'opacity-40'}`}>{titulo}</p>
        <p className="text-sm font-bold leading-tight break-words">{texto}</p>
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-all ${ativo ? 'text-blue-500 scale-110' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[9px] font-black uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function badgeEstilo(status: string) {
  switch (status) {
    case 'Finalizado': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    case 'Cancelado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
    case 'Aguardando material': return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
    case 'Parado': return 'bg-amber-500 border-amber-500 text-white'
    default: return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  }
}