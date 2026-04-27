'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, Plus, ClipboardList, User, Monitor, 
  FileText, Camera, Search, Users, LayoutGrid, 
  CircleDollarSign, Settings, X, Layers, CheckCircle2, XCircle, Loader2
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
}

type FotoOS = {
  id: string
  url: string
}

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id

  const [ordem, setOrdem] = useState<OrdemServico | null>(null)
  const [fotos, setFotos] = useState<FotoOS[]>([]) // Novo estado para múltiplas fotos
  const [nomeResponsavel, setNomeResponsavel] = useState('-')
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [materiais, setMateriais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviandoFoto, setEnviandoFoto] = useState(false) // Feedback de upload
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  
  const [descricaoAtualizacao, setDescricaoAtualizacao] = useState('')
  const [tecnicosResponsaveis, setTecnicosResponsaveis] = useState('')
  const [modalAtualizacao, setModalAtualizacao] = useState(false)

  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean' | null
    if (temaSalvo) setTema(temaSalvo)
    carregarDados()
  }, [])

  async function carregarDados() {
    const id = Number(id_os)
    
    // Carregar Dados da OS
    const { data: osData } = await supabase.from('ordens_servico').select('*').eq('id', id).single()
    if (!osData) return setCarregando(false)
    setOrdem(osData)

    // Carregar Fotos da Nova Tabela
    const { data: fotosData } = await supabase.from('fotos_os').select('id, url').eq('id_os', id)
    setFotos(fotosData || [])

    // Carregar Responsável
    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', osData.usuario_responsavel).single()
    setNomeResponsavel(user?.nome || osData.usuario_responsavel || '-')

    // Carregar Histórico
    const { data: upds } = await supabase.from('os_atualizacoes').select('*').eq('ordem_servico_id', id).order('created_at', { ascending: false })
    setAtualizacoes(upds || [])

    // Carregar Materiais
    const { data: mats } = await supabase.from('materiais_os').select('*').eq('id_os', id)
    setMateriais(mats || [])

    setCarregando(false)
  }

  // Função para adicionar foto dentro do relatório
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
      carregarDados() // Atualiza a galeria na tela
    } catch (err) {
      alert("Erro ao subir imagem")
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvarAtualizacao() {
    if (!ordem || !descricaoAtualizacao.trim()) return
    const usuarioSalvo = localStorage.getItem('usuario')
    const { data: user } = await supabase.from('usuarios').select('nome').eq('usuario', usuarioSalvo).single()
    
    const { error } = await supabase.from('os_atualizacoes').insert([{
      ordem_servico_id: ordem.id,
      descricao: descricaoAtualizacao,
      tecnicos_responsaveis: tecnicosResponsaveis,
      usuario_nome: user?.nome || usuarioSalvo,
    }])

    if (!error) {
      setDescricaoAtualizacao(''); setModalAtualizacao(false); carregarDados()
    }
  }

  const clean = tema === 'clean'
  const encerrada = ordem?.status === 'Finalizado' || ordem?.status === 'Cancelado'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-bold">Sincronizando...</div>

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      <main className="max-w-md mx-auto px-5 pt-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button onClick={() => router.push('/ordens')} className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${clean ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0d1726] border-slate-700 text-white'}`}>
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black uppercase italic tracking-tighter">OS #{ordem?.numero_os ?? ordem?.id}</h1>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${badgeEstilo(ordem?.status || '')}`}>
              {ordem?.status}
            </span>
          </div>
          {!encerrada && (
            <button onClick={() => setModalAtualizacao(true)} className="h-12 px-4 rounded-2xl flex items-center gap-2 text-xs font-black uppercase bg-blue-600 text-white shadow-lg active:scale-95 transition-all">
              <Plus size={16} /> Atualizar
            </button>
          )}
        </div>

        {/* INFO PRINCIPAIS */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <InfoItem clean={clean} Icone={User} titulo="Cliente" texto={ordem?.cliente} />
            <InfoItem clean={clean} Icone={Monitor} titulo="Máquina" texto={ordem?.maquina} />
            <InfoItem clean={clean} Icone={Users} titulo="Solicitante" texto={ordem?.solicitante || '-'} />
            <InfoItem clean={clean} Icone={User} titulo="Responsável" texto={nomeResponsavel} />
            <InfoItem clean={clean} Icone={FileText} titulo="Descrição Original" texto={ordem?.descricao} full />
          </div>
        </section>

        {/* GALERIA DE FOTOS (COM BOTÃO DE CÂMERA) */}
        <section className={`rounded-3xl p-6 mb-5 border shadow-sm ${clean ? 'bg-white border-slate-100' : 'bg-[#0d1726] border-slate-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera size={20} className="text-blue-500" />
              <h2 className="font-black uppercase tracking-tighter">Fotos do Registro</h2>
            </div>
            
            {/* BOTÃO DE CÂMERA DENTRO DO RELATÓRIO */}
            {!encerrada && (
              <label className="flex items-center gap-2 bg-blue-600/10 text-blue-500 px-3 py-2 rounded-xl border border-blue-500/20 cursor-pointer active:scale-95 transition-all">
                {enviandoFoto ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <span className="text-[10px] font-black uppercase">Anexar</span>
                <input type="file" multiple hidden accept="image/*" onChange={handleAddFoto} disabled={enviandoFoto} />
              </label>
            )}
          </div>

          {fotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((f) => (
                <div key={f.id} className="relative group">
                  <img src={f.url} alt="Registro" className="w-full h-32 object-cover rounded-xl border border-slate-700/30" />
                  <a href={f.url} target="_blank" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                    <Search size={20} className="text-white" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 rounded-2xl border-2 border-dashed border-slate-500/10 flex flex-col items-center justify-center text-slate-500 gap-1">
              <Camera size={24} opacity={0.3} />
              <span className="text-[9px] font-bold uppercase">Nenhuma foto anexada</span>
            </div>
          )}
        </section>

        {/* MATERIAIS */}
        <div className="mb-6">
          {!encerrada && (
            <button onClick={() => router.push(`/ordens/${id_os}/material`)} className="w-full py-4 mb-4 rounded-2xl border-2 border-dashed border-blue-500/20 text-blue-400 font-black uppercase italic tracking-tight flex items-center justify-center gap-2">
              <Plus size={20} /> Acrescentar Material
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

        {/* HISTÓRICO DE MÃO DE OBRA */}
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

        {/* AÇÕES FINAIS */}
        {!encerrada && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            <button onClick={() => alert('Lógica de cancelamento')} className="flex flex-col items-center justify-center p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 active:scale-95 transition-all">
              <XCircle size={28} className="mb-2" />
              <span className="text-[10px] font-black uppercase">Cancelar OS</span>
            </button>
            <button onClick={() => alert('Lógica de finalização')} className="flex flex-col items-center justify-center p-5 rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
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

      {/* MODAL DE ATUALIZAÇÃO (Omitido por brevidade, mantém o seu original) */}
    </div>
  )
}

// Funções auxiliares mantidas conforme o seu original...
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
    default: return 'bg-blue-500/10 border-blue-500/20 text-blue-500'
  }
}