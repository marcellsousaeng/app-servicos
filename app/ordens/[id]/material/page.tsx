'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Layers, CircleDot, PipetteIcon as Pipe } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'

export default function AdicionarMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const id_os = params.id
  
  const [tipo, setTipo] = useState('') 
  const [loading, setLoading] = useState(false)
  const [tema, setTema] = useState<'dark' | 'clean'>('clean')

  const [dados, setDados] = useState({
    descricao: '',
    espessura: '',
    diametro: '',
    comprimento: '',
    largura: '',
    quantidade: '1'
  })

  // Carrega o tema da configuração
  useEffect(() => {
    const temaSalvo = localStorage.getItem('tema-app') as 'dark' | 'clean'
    if (temaSalvo) setTema(temaSalvo)
  }, [])

  async function salvarMaterial() {
    setLoading(true)
    
    const novoMaterial = {
      id_os: id_os,
      tipo,
      ...dados,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase.from('materiais_os').insert([novoMaterial])

    if (error) {
      console.error(error)
      const pendentes = JSON.parse(localStorage.getItem('materiais_pendentes') || '[]')
      localStorage.setItem('materiais_pendentes', JSON.stringify([...pendentes, novoMaterial]))
      alert('Salvo localmente (modo offline)')
    }

    setLoading(false)
    router.back()
  }

  const clean = tema === 'clean'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${clean ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#07111f] text-white'} pb-10`}>
      <header className={`p-6 flex items-center gap-4 border-b transition-colors ${clean ? 'bg-white border-slate-200' : 'bg-[#0d1726] border-white/10'}`}>
        <button onClick={() => router.back()} className={`p-2 rounded-full ${clean ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/5 text-white'}`}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase italic tracking-tighter">Acrescentar Material</h1>
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">OS #{id_os}</p>
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6">
        <section>
          <label className={`text-[10px] font-bold uppercase mb-3 block ${clean ? 'text-slate-400' : 'opacity-50'}`}>Tipo de Material</label>
          <div className="grid grid-cols-3 gap-3">
            <BotaoTipo clean={clean} ativo={tipo === 'chapa'} onClick={() => setTipo('chapa')} label="Chapa" Icone={Layers} />
            <BotaoTipo clean={clean} ativo={tipo === 'eixo'} onClick={() => setTipo('eixo')} label="Eixo" Icone={CircleDot} />
            <BotaoTipo clean={clean} ativo={tipo === 'tubo'} onClick={() => setTipo('tubo')} label="Tubo" Icone={Pipe} />
          </div>
        </section>

        {tipo && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Opcional: Removido campo de descrição se não for usar, ou mantido apenas como input geral */}
            <div className="grid grid-cols-2 gap-4">
              {tipo === 'chapa' && (
                <>
                  <InputGeral clean={clean} label="Espessura (mm)" placeholder="0.00" value={dados.espessura} onChange={(v: string) => setDados({...dados, espessura: v})} />
                  <InputGeral clean={clean} label="Largura (mm)" placeholder="0.00" value={dados.largura} onChange={(v: string) => setDados({...dados, largura: v})} />
                </>
              )}

              {(tipo === 'eixo' || tipo === 'tubo') && (
                <InputGeral clean={clean} label="Diâmetro (mm)" placeholder="Ø 0.00" value={dados.diametro} onChange={(v: string) => setDados({...dados, diametro: v})} />
              )}

              <InputGeral clean={clean} label="Comprimento (mm)" placeholder="0.00" value={dados.comprimento} onChange={(v: string) => setDados({...dados, comprimento: v})} />
              <InputGeral clean={clean} label="Qtd" type="number" value={dados.quantidade} onChange={(v: string) => setDados({...dados, quantidade: v})} />
            </div>

            <button
              onClick={salvarMaterial}
              disabled={loading}
              className="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase mt-6 flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              <Save size={20} />
              {loading ? 'Gravando...' : 'Confirmar Material'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function BotaoTipo({ ativo, onClick, label, Icone, clean }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
        ativo 
          ? 'bg-blue-600 border-blue-400 text-white shadow-md' 
          : clean 
            ? 'bg-white border-slate-200 text-slate-400' 
            : 'bg-[#0d1726] border-white/5 text-slate-500'
      }`}
    >
      <Icone size={24} className="mb-2" />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  )
}

function InputGeral({ label, placeholder, value, onChange, type = "text", clean }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-[10px] font-bold uppercase ml-1 ${clean ? 'text-slate-400' : 'opacity-40'}`}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${
          clean 
            ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-300' 
            : 'bg-[#0d1726] border-white/10 text-white placeholder:text-slate-600'
        } w-full`}
      />
    </div>
  )
}