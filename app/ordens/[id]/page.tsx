'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, Plus, Pencil, ClipboardList, User, Play, Monitor, 
  Calendar, FileText, Camera, Search, Wrench, Users, CheckCircle2, 
  XCircle, LayoutGrid, CircleDollarSign, Settings, X, AlertTriangle,
  Layers, CircleDot, PipetteIcon as Pipe
} from 'lucide-react'

// Tipagens
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
  foto_url?: string | null
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
  const [nomeResponsavel, setNomeResponsavel] = useState('-')
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [materiais, setMateriais] = useState<Material[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [salvandoAtualizacao, setSalvandoAtualizacao] = useState(false)
  const [modalAtualizacao, setModalAtualizacao] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDados()
  }, [])

  async function carregarDados() {
    const id = Number(id_os)
    
    // 1. Carregar Dados da OS
    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    setOrdem(osData)

    // 2. Buscar nome do responsável
    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', osData.usuario_responsavel).single()
    setNomeResponsavel(user?.nome || osData.usuario_responsavel || '-')

    // 3. Buscar Atualizações
    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])

    // 4. Buscar Materiais Adicionados
    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
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

  async function alterarStatus(novoStatus: string, motivo?: string) {
    if (!ordem) return
    const { error } = await supabase.from('ordens_servico').update({ 
      status: novoStatus, 
      cancelada: novoStatus === 'Cancelado',
      motivo_cancelamento: motivo || null 
    }).eq('id', ordem.id)
    if (!error) carregarDados()
  }

  const clean = tema === 'clean'
  const osFinalizada = ordem?.status === 'Finalizado'
  const osCancelada = ordem?.status === 'Cancelado'

  if (carregando) return (
    <div className={`min-h-screen flex items-center justify-center font-bold ${clean ? 'bg-slate-50 text-slate-400' : 'bg-[#07111f] text-blue-500'}`}>
      Sincronizando Relatório...
    </div>
  )

  if (!ordem) return <div className="p-10 text-center">OS não encontrada.</div>

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${
            clean ? 'bg-white border-slate-200 text-slate-600 shadow-sm' : 'bg-[#0d1726] border-slate-700 text-white'
          }`}>
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black truncate uppercase italic">OS #{ordem.numero_os ?? ordem.id}</h1>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${badgeEstilo(ordem.status)}`}>
              {ordem.status}
            </span>
          </div>

          <button
            onClick={() => osFinalizada || osCancelada ? alert('Editar...') : setModalAtualizacao(true)}
            className={`h-12 px-4 rounded-2xl flex items-center gap-2 text-xs font-black uppercase transition-all active:scale-95 border ${
              clean ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-[#0d1726] border-blue-500/30 text-blue-400'
            }`}
          >
            {osFinalizada || osCancelada ? <Pencil size={16} /> : <Plus size={16} />}
            {osFinalizada || osCancelada ? 'Editar' : 'Atualizar'}
          </button>
        </div>

        {/* INFO PRINCIPAIS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-2xl ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem.cliente} />
            <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem.maquina} />
            <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem.solicitante || '-'} />
            <InfoItem clean={clean} Icone={User} titulo="Responsável" texto={nomeResponsavel} />
            <InfoItem clean={clean} Icone={FileText} titulo="Descrição Original" texto={ordem.descricao} full />
          </div>
        </section>

        {/* --- NOVO BOTÃO DE MATERIAIS --- */}
        <div className="mb-6">
          <button 
            onClick={() => router.push(`/ordens/${id_os}/material`)}
            className={`w-full py-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all active:scale-95 ${
              clean ? 'bg-white border-blue-500/30 text-blue-600 shadow-sm' : 'bg-[#0d1726] border-blue-500/20 text-blue-400'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <span className="font-black uppercase italic tracking-tight">Acrescentar Material</span>
          </button>
        </div>

        {/* LISTA DE MATERIAIS JÁ ADICIONADOS */}
        {materiais.length > 0 && (
          <section className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
             <div className="flex items-center gap-2 mb-4 border-b border-slate-500/10 pb-4">
              <Layers size={18} className="text-blue-500" />
              <h2 className="font-black uppercase tracking-tighter">Materiais da Peça</h2>
            </div>
            <div className="space-y-3">
              {materiais.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-slate-500/5 p-3 rounded-xl border border-white/5">
                  <div>
                    <p className="text-xs font-black uppercase text-blue-500">{m.descricao}</p>
                    <p className="text-[10px] opacity-60">
                      {m.tipo === 'chapa' && `${m.espessura}mm x ${m.largura}mm x ${m.comprimento}mm`}
                      {m.tipo === 'eixo' && `Ø ${m.diametro}mm x ${m.comprimento}mm`}
                      {m.tipo === 'tubo' && `Ø ${m.diametro}mm (P. ${m.espessura}mm) x ${m.comprimento}mm`}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">x{m.quantidade}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* HISTÓRICO DE ATUALIZAÇÕES */}
        <section className={`rounded-3xl p-6 mb-5 border ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-500/10 pb-4">
            <FileText size={20} className="text-purple-500" />
            <h2 className="font-black uppercase tracking-tighter">Histórico de Mão de Obra</h2>
          </div>
          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-500/10">
            {atualizacoes.map((item) => (
              <div key={item.id} className="pl-8 relative">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-4 border-[#0d1726]" />
                <div className="flex justify-between items-start">
                  <p className="font-black text-xs uppercase text-blue-500">{item.usuario_nome}</p>
                  <span className="text-[9px] font-bold opacity-40">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm font-medium mt-2">{item.descricao}</p>
                {item.tecnicos_responsaveis && (
                  <span className="mt-2 text-[10px] font-bold bg-slate-500/10 px-2 py-1 rounded flex w-fit items-center gap-1">
                    <Users size={10} /> {item.tecnicos_responsaveis}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL DE ATUALIZAÇÃO (SEM CAMPO DE MATERIAL) */}
      {modalAtualizacao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end animate-in fade-in duration-300">
          <div className={`w-full max-w-md mx-auto rounded-t-[40px] p-8 pb-10 border-t transition-colors ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic">Nova Atualização</h2>
              <button onClick={() => setModalAtualizacao(false)} className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <textarea placeholder="Relatório da mão de obra..." value={descricaoAtualizacao} onChange={(e) => setDescricaoAtualizacao(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none min-h-[120px] border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700 focus:border-blue-500'}`} />
              <input placeholder="Técnico(s) que executou" value={tecnicosResponsaveis} onChange={(e) => setTecnicosResponsaveis(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700 focus:border-blue-500'}`} />
              <button onClick={salvarAtualizacao} disabled={salvandoAtualizacao}
                className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase text-white shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50">
                {salvandoAtualizacao ? 'Gravando...' : 'Salvar Relatório'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU DE NAVEGAÇÃO INFERIOR */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 transition-colors ${clean ? 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : 'bg-[#07111f] border-slate-800'}`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuNav titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuNav ativo titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuNav titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuNav titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>
    </div>
  )
}

// Funções Auxiliares (Componentes Internos)
function InfoItem({ Icone, titulo, texto, full, clean }: any) {
  return (
    <div className={`flex gap-3 ${full ? 'col-span-2 mt-2 border-t pt-4 border-slate-500/10' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clean ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'}`}>
        <Icone size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-0.5">{titulo}</p>
        <p className="text-sm font-bold leading-tight break-words">{texto}</p>
      </div>
    </div>
  )
}

function MenuNav({ titulo, Icone, ativo, clean, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 ${ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'}`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className="mt-1 text-[10px] font-bold uppercase tracking-tighter">{titulo}</span>
    </button>
  )
}

function badgeEstilo(status: string) {
  switch (status) {
    case 'Finalizado': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    case 'Cancelado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
    default: return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  }
}