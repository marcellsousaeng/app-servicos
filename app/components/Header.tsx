'use client'

import { useRouter } from 'next/navigation'

export default function Header({ titulo }: { titulo: string }) {
  const router = useRouter()

  return (
    <div className="flex justify-between items-center mb-6">
      
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
      </div>

      <button
        onClick={() => router.push('/dashboard')}
        className="bg-black text-white px-4 py-2 rounded-xl"
      >
        ← Dashboard
      </button>

    </div>
  )
}