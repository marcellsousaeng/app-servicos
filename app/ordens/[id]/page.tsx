'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, 
  Plus, 
  Pencil, 
  ClipboardList, 
  User, 
  Play, 
  Monitor, 
  Calendar, 
  FileText, 
  Camera, 
  Search, 
  Wrench, 
  Users, 
  CheckCircle2, 
  XCircle, 
  LayoutGrid, 
  CircleDollarSign, 
  Settings,
  X,
  AlertTriangle
} from 'lucide-react'

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

type Atualizacao = {
  id: number
  created_at: string
  ordem_servico_id: number
  descricao: string
  material_utilizado: string | null
  tecnicos_responsaveis: string | null
  usuario_nome: string | null
}

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [nomeResponsavel, setNomeResponsavel] = useState('-')
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')

  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [materialUtilizado, setMaterialUtilizado] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [salvandoAtualizacao, setSalvandoAtualizacao] = useState(false)
  const [modalAtualizacao, setModalAtualizacao] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDetalhes()
  }, [])

  async function carregarDetalhes() {
    const id = Number(params.id)
    const { data, error } = await supabase.from('ordens_servico').select('*').eq('id', id).single()

    if (error || !data) {
      setCarregando(false)
      return
    }

    setOrdem(data)

    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', data.usuario_responsavel).single()
    setNomeResponsavel(user?.nome || data.usuario_responsavel || '-')

    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])
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
      material_utilizado: materialUtilizado,
      tecnicos_responsaveis: tecnicosResponsaveis,
      usuario_nome: user?.nome || usuarioSalvo,
    }])

    if (!error) {
      setDescricaoAtualizacao(''); setMaterialUtilizado(''); setTecnicosResponsaveis('')
      setModalAtualizacao(false); carregarDetalhes()
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
    if (!error) carregarDetalhes()
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
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase border ${badgeEstilo(ordem.status)}`}>
                {ordem.status}
              </span>
            </div>
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

        {/* CARD INFORMAÇÕES PRINCIPAIS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-2xl ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-500/10 pb-4">
            <ClipboardList size={20} className="text-blue-500" />
            <h2 className="font-black uppercase tracking-tighter">Informações da OS</h2>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem.cliente} />
            <InfoItem clean={clean} Icone={Play} titulo="Status" texto={ordem.status} />
            <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem.solicitante || '-'} />
            <InfoItem clean={clean} Icone={User} titulo="Responsável" texto={nomeResponsavel} />
            <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem.maquina} />
            <InfoItem clean={clean} Icone={Calendar} titulo="Entrada" texto={new Date(ordem.created_at).toLocaleDateString('pt-BR')} />
            <InfoItem clean={clean} Icone={FileText} titulo="Descrição Original" texto={ordem.descricao} full />
            
            {ordem.cancelada && (
              <div className="col-span-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-[10px] font-black text-rose-500 uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Motivo do Cancelamento
                </p>
                <p className="text-sm font-medium">{ordem.motivo_cancelamento || 'Não informado'}</p>
              </div>
            )}
          </div>
        </section>

        {/* CARD FOTO */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-xl ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Camera size={20} className="text-blue-500" />
            <h2 className="font-black uppercase tracking-tighter">Foto do Serviço</h2>
          </div>

          {ordem.foto_url ? (
            <div className="relative group">
              <img src={ordem.foto_url} alt="OS" className="w-full h-56 object-cover rounded-2xl border border-slate-700/30" />
              <a href={ordem.foto_url} target="_blank" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
                <Search size={18} />
              </a>
            </div>
          ) : (
            <div className="h-32 rounded-2xl border-2 border-dashed border-slate-700/20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Camera size={32} opacity={0.2} />
              <span className="text-[10px] font-bold uppercase">Sem registro visual</span>
            </div>
          )}
        </section>

        {/* HISTÓRICO DE ATUALIZAÇÕES */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-xl ${
          clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-6 border-b border-slate-500/10 pb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-purple-500" />
              <h2 className="font-black uppercase tracking-tighter">Atualizações</h2>
            </div>
          </div>

          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-500/10">
            {atualizacoes.map((item) => (
              <div key={item.id} className="pl-8 relative">
                <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-4 border-[#0d1726]" />
                <div className="flex justify-between items-start">
                  <p className="font-black text-xs uppercase tracking-tight text-blue-500">{item.usuario_nome}</p>
                  <span className="text-[9px] font-bold opacity-40">{new Date(item.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm font-medium mt-2 leading-relaxed">{item.descricao}</p>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.material_utilizado && (
                    <span className="text-[10px] font-bold bg-slate-500/10 px-2 py-1 rounded flex items-center gap-1">
                      <Wrench size={10} /> {item.material_utilizado}
                    </span>
                  )}
                  {item.tecnicos_responsaveis && (
                    <span className="text-[10px] font-bold bg-slate-500/10 px-2 py-1 rounded flex items-center gap-1">
                      <Users size={10} /> {item.tecnicos_responsaveis}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* AÇÕES FIXAS INFERIORES */}
      {!osFinalizada && !osCancelada && (
        <div className={`fixed bottom-20 left-0 right-0 p-4 z-40`}>
          <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
            <button onClick={() => alterarStatus('Finalizado')} className="bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-95">
              <CheckCircle2 size={18} /> Finalizar
            </button>
            <button onClick={() => { const m = prompt('Motivo?'); if(m) alterarStatus('Cancelado', m) }} className="bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-rose-900/20 flex items-center justify-center gap-2 active:scale-95">
              <XCircle size={18} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MENU DE NAVEGAÇÃO */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t py-2 z-50 transition-colors ${
        clean ? 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]' : 'bg-[#07111f] border-slate-800'
      }`}>
        <div className="max-w-md mx-auto grid grid-cols-4 px-4">
          <MenuNav titulo="Início" Icone={LayoutGrid} clean={clean} onClick={() => router.push('/dashboard')} />
          <MenuNav ativo titulo="Ordens" Icone={ClipboardList} clean={clean} onClick={() => router.push('/ordens')} />
          <MenuNav titulo="Faturam." Icone={CircleDollarSign} clean={clean} onClick={() => router.push('/faturamento')} />
          <MenuNav titulo="Config." Icone={Settings} clean={clean} onClick={() => router.push('/configuracao')} />
        </div>
      </nav>

      {/* MODAL DE ATUALIZAÇÃO REESTILIZADO */}
      {modalAtualizacao && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end animate-in fade-in duration-300">
          <div className={`w-full max-w-md mx-auto rounded-t-[40px] p-8 pb-10 border-t transition-colors ${
            clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-slate-700'
          }`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Nova Atualização</h2>
              <button onClick={() => setModalAtualizacao(false)} className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <textarea placeholder="O que foi feito agora?" value={descricaoAtualizacao} onChange={(e) => setDescricaoAtualizacao(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none min-h-[120px] border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700 focus:border-blue-500'}`} />
              
              <input placeholder="Materiais (Peças, parafusos...)" value={materialUtilizado} onChange={(e) => setMaterialUtilizado(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700 focus:border-blue-500'}`} />

              <input placeholder="Equipe técnica" value={tecnicosResponsaveis} onChange={(e) => setTecnicosResponsaveis(e.target.value)}
                className={`w-full rounded-2xl p-4 text-sm font-medium outline-none border ${clean ? 'bg-slate-50 border-slate-200' : 'bg-[#111c2e] border-slate-700 focus:border-blue-500'}`} />

              <button onClick={salvarAtualizacao} disabled={salvandoAtualizacao}
                className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50">
                {salvandoAtualizacao ? 'Gravando...' : 'Salvar Relatório'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* COMPONENTES INTERNOS */

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
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 transition-colors ${
      ativo ? 'text-blue-500' : clean ? 'text-slate-400' : 'text-slate-500'
    }`}>
      <Icone size={22} strokeWidth={ativo ? 3 : 2} />
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-tighter ${ativo ? 'opacity-100' : 'opacity-60'}`}>
        {titulo}
      </span>
    </button>
  )
}

function badgeEstilo(status: string) {
  switch (status) {
    case 'Finalizado': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
    case 'Cancelado': return 'bg-rose-500/10 border-rose-500/20 text-rose-500'
    case 'Aguardando material': return 'bg-amber-500/10 border-amber-500/20 text-amber-500'
    default: return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  }
}