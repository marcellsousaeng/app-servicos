'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Layers, CircleDot, PipetteIcon as Pipe, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'

export default function AdicionarMaterialPage() {
  const router = useRouter()
  const params = useParams()
  const id_os = params.id
  
  const [tipo, setTipo] = useState('') 
  const [loading, setLoading] = useState(false)

  const [dados, setDados] = useState({
    descricao: '',
    espessura: '',
    diametro: '',
    comprimento: '',
    largura: '',
    quantidade: '1'
  })

  async function salvarMaterial() {
    if (!dados.descricao) return alert('Dê uma descrição ao material')
    
    setLoading(true)
    
    const novoMaterial = {
      id_os: id_os,
      tipo,
      ...dados,
      created_at: new Date().toISOString()
    }

    // Salva no Supabase
    const { error } = await supabase.from('materiais_os').insert([novoMaterial])

    if (error) {
      console.error(error)
      // Se der erro (ex: sem internet), salva no LocalStorage para sincronizar depois
      const pendentes = JSON.parse(localStorage.getItem('materiais_pendentes') || '[]')
      localStorage.setItem('materiais_pendentes', JSON.stringify([...pendentes, novoMaterial]))
      alert('Salvo localmente (modo offline)')
    }

    setLoading(false)
    router.back()
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white pb-10">
      <header className="p-6 flex items-center gap-4 border-b border-white/10 bg-[#0d1726]">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-black uppercase italic">Acrescentar Material</h1>
          <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">OS #{id_os}</p>
        </div>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6">
        <section>
          <label className="text-[10px] font-bold uppercase opacity-50 mb-3 block">Tipo de Material</label>
          <div className="grid grid-cols-3 gap-3">
            <BotaoTipo ativo={tipo === 'chapa'} onClick={() => setTipo('chapa')} label="Chapa" Icone={Layers} />
            <BotaoTipo ativo={tipo === 'eixo'} onClick={() => setTipo('eixo')} label="Eixo" Icone={CircleDot} />
            <BotaoTipo ativo={tipo === 'tubo'} onClick={() => setTipo('tubo')} label="Tubo" Icone={Pipe} />
          </div>
        </section>

        {tipo && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <InputGeral 
              label="Descrição (Ex: Aço 1045, Nylon)" 
              value={dados.descricao}
              onChange={(v: string) => setDados({...dados, descricao: v})}
            />

            <div className="grid grid-cols-2 gap-4">
              {tipo === 'chapa' && (
                <>
                  <InputGeral label="Espessura (mm)" placeholder="0.00" value={dados.espessura} onChange={(v: string) => setDados({...dados, espessura: v})} />
                  <InputGeral label="Largura (mm)" placeholder="0.00" value={dados.largura} onChange={(v: string) => setDados({...dados, largura: v})} />
                </>
              )}

              {(tipo === 'eixo' || tipo === 'tubo') && (
                <InputGeral label="Diâmetro (mm)" placeholder="Ø 0.00" value={dados.diametro} onChange={(v: string) => setDados({...dados, diametro: v})} />
              )}

              <InputGeral label="Comprimento (mm)" placeholder="0.00" value={dados.comprimento} onChange={(v: string) => setDados({...dados, comprimento: v})} />
              <InputGeral label="Qtd" type="number" value={dados.quantidade} onChange={(v: string) => setDados({...dados, quantidade: v})} />
            </div>

            <button
              onClick={salvarMaterial}
              disabled={loading}
              className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase mt-6 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
            >
              <Save size={20} />
              {loading ? 'Gravando...' : 'Salvar na OS'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function BotaoTipo({ ativo, onClick, label, Icone }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
        ativo ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0d1726] border-white/5 text-slate-500'
      }`}
    >
      <Icone size={24} className="mb-2" />
      <span className="text-[10px] font-black uppercase">{label}</span>
    </button>
  )
}

function InputGeral({ label, placeholder, value, onChange, type = "text" }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase opacity-40 ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-[#0d1726] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-white w-full"
      />
    </div>
  )
}