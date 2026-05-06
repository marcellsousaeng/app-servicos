'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { 
  ChevronLeft, ClipboardList, User, Monitor, 
  FileText, Camera, Users, LayoutGrid, 
  CircleDollarSign, Settings, CheckCircle2, XCircle, Loader2,
  PlayCircle, PauseCircle, Pencil, Download, X, Calendar, Package, Clock
} from 'lucide-react'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function DetalhesOSPage() {
  const params = useParams()
  const router = useRouter()
  const id_os = params.id
  const printRef = useRef<HTMLDivElement>(null)

  const [ordem, setOrdem] = useState<any>(null)
  const [fotos, setFotos] = useState<any[]>([])
  const [atualizacoes, setAtualizacoes] = useState<any[]>([])
  const [materiais, setMateriais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [tema, setTema] = useState<'dark' | 'clean'>('dark')
  const [gerandoPDF, setGerandoPDF] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

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
    
    // Pequeno delay para garantir renderização das imagens com crossOrigin
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const element = printRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff", // Relatórios sempre fundo branco
        windowWidth: 800 // Largura fixa para manter a proporção do modelo
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Relatorio_OS_${ordem?.numero_os || id_os}.pdf`)
    } catch (error) {
      alert("Erro ao gerar PDF")
    } finally {
      setGerandoPDF(false)
    }
  }

  const clean = tema === 'clean'

  if (carregando) return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>

  return (
    <div className={`min-h-screen pb-32 ${clean ? 'bg-slate-50 text-slate-900' : 'bg-[#07111f] text-white'}`}>
      
      {/* BOTÕES DE AÇÃO (MOBILE) */}
      <div className="max-w-md mx-auto px-5 pt-6 flex items-center justify-between no-print">
        <button onClick={() => router.push('/ordens')} className="p-3 rounded-xl border border-slate-700 bg-[#0d1726]">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button onClick={gerarPDF} disabled={gerandoPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase">
            {gerandoPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            PDF
          </button>
        </div>
      </div>

      {/* --- MODELO DE RELATÓRIO (O QUE VAI PARA O PDF) --- */}
      <div ref={printRef} className="bg-white text-slate-900 p-0 sm:p-4 max-w-[800px] mx-auto overflow-hidden">
        
        {/* CABEÇALHO ESTILO DIVISA */}
        <header className="relative flex justify-between items-start bg-[#001529] text-white p-8 rounded-b-[40px] mb-8">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-4">
               <div className="w-10 h-10 bg-yellow-500 rounded flex items-center justify-center text-black font-black">D</div>
               <span className="text-2xl font-black tracking-tighter uppercase italic">Divisa <span className="text-yellow-500 text-xs block -mt-2">TORNEARIA</span></span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Relatório de Serviço</h1>
            <p className="opacity-60 text-xs font-bold uppercase mb-4">Ordem de Serviço</p>
            <h2 className="text-4xl font-black text-blue-400 mb-4">OS #{ordem?.numero_os || ordem?.id}</h2>
            <div className="bg-emerald-600 px-6 py-1 rounded-full inline-block text-[10px] font-black uppercase italic">
              {ordem?.status}
            </div>
          </div>

          <div className="z-10 text-right space-y-6 mt-2">
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold opacity-50 uppercase">Data</p>
                <p className="text-sm font-black">{new Date(ordem?.created_at).toLocaleDateString()}</p>
              </div>
              <Calendar className="text-blue-400" size={24} />
            </div>
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold opacity-50 uppercase">Técnico Responsável</p>
                <p className="text-sm font-black">{ordem?.usuario_responsavel || 'Jackson'}</p>
              </div>
              <User className="text-blue-400" size={24} />
            </div>
          </div>

          {/* Efeito Decorativo do Fundo */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 rounded-bl-full pointer-events-none"></div>
        </header>

        <div className="px-8 pb-12">
          {/* SEÇÃO: DADOS DA OS */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
              <ClipboardList size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Dados da Ordem de Serviço</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              <InfoRelatorio Icone={User} label="Cliente" valor={ordem?.cliente} />
              <InfoRelatorio Icone={Monitor} label="Máquina" valor={ordem?.maquina} />
              <InfoRelatorio Icone={Users} label="Solicitante" valor={ordem?.solicitante || 'Não Informado'} />
              <InfoRelatorio Icone={User} label="Técnico" valor={ordem?.usuario_responsavel || 'Jackson'} />
              <div className="col-span-2 pt-4 border-t border-slate-200">
                <div className="flex gap-3">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0"><FileText size={16} className="text-blue-600"/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">Descrição</p>
                    <p className="text-xs font-bold leading-relaxed">{ordem?.descricao}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO: FOTOS E MATERIAIS */}
          <div className="grid grid-cols-5 gap-6 mb-10">
            <div className="col-span-3">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                <Camera size={18} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Fotos de Campo</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {fotos.slice(0, 2).map(f => (
                  <img key={f.id} src={f.url} crossOrigin="anonymous" className="w-full h-56 object-cover rounded-[30px] border-4 border-white shadow-sm" />
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                <Package size={18} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Peças / Materiais</h3>
              </div>
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[30px] p-6 h-fit">
                 {materiais.length > 0 ? materiais.map(m => (
                   <div key={m.id} className="flex justify-between items-center mb-4 last:mb-0">
                     <span className="text-[10px] font-black uppercase tracking-tighter">{m.descricao}</span>
                     <span className="text-xs font-black text-blue-600">x{m.quantidade}</span>
                   </div>
                 )) : <p className="text-[10px] opacity-40 italic">Nenhum material listado</p>}
              </div>
            </div>
          </div>

          {/* SEÇÃO: HISTÓRICO */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
              <Clock size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Histórico</h3>
            </div>
            <div className="space-y-3">
              {atualizacoes.slice(0, 3).map(at => (
                <div key={at.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-purple-600 mb-1">
                      {new Date(at.created_at).toLocaleDateString()} - {at.tecnicos_responsaveis || at.usuario_nome || 'Jackson'}
                    </p>
                    <p className="text-[10px] font-bold uppercase leading-tight">{at.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ASSINATURA */}
          <div className="flex justify-end mt-16">
            <div className="w-64 border-2 border-slate-100 p-6 rounded-[30px] text-center">
               <p className="text-[10px] font-black uppercase mb-8">Recebido por</p>
               <div className="border-b border-slate-300 w-full mb-2"></div>
               <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Data: ___/___/___</p>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <footer className="bg-slate-900 text-white p-6 flex justify-between items-center rounded-t-[30px]">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-black font-black text-[10px]">D</div>
              <span className="text-xs font-black uppercase italic italic">Divisa</span>
           </div>
           <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
             Obrigado por confiar em nosso trabalho! Qualidade e segurança em cada serviço.
           </p>
        </footer>
      </div>

      {/* MODAL FOTO EXPANDIDA (APENAS TELA) */}
      {fotoExpandida && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-4 no-print" onClick={() => setFotoExpandida(null)}>
          <button className="absolute top-6 right-6 text-white"><X size={32}/></button>
          <img src={fotoExpandida} className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

function InfoRelatorio({ Icone, label, valor }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
        <Icone size={18} className="text-blue-600" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
        <p className="text-xs font-black uppercase">{valor || '-'}</p>
      </div>
    </div>
  )
}