'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type Note = {
  id: string
  title: string
  content: string
  category: string
  created_at: string
}

export default function SharedNotePage() {
  const params = useParams()
  const token = params.token as string
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSharedNote()
  }, [token])

  async function fetchSharedNote() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('share_token', token)
        .eq('is_shared', true)
        .single()

      if (error) {
        setError('共有メモが見つかりませんでした')
        return
      }

      if (data) {
        setNote(data)
      }
    } catch (err) {
      setError('共有メモの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">読み込み中...</div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/notes" className="text-blue-400 hover:underline">← メモ一覧に戻る</Link>
          <div className="mt-8 bg-red-600 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">エラー</h2>
            <p>{error || '共有メモが見つかりませんでした'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/notes" className="text-blue-400 hover:underline">← メモ一覧に戻る</Link>
        
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-3xl font-bold">{note.title}</h1>
            <div className="flex gap-2 items-center">
              <span className="text-xs bg-purple-600 px-2 py-1 rounded">🔗 共有メモ</span>
              <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                {note.category}
              </span>
            </div>
          </div>
          
          <p className="text-gray-300 whitespace-pre-wrap mt-4 mb-4">{note.content}</p>

          <div className="text-sm text-gray-500 border-t border-gray-700 pt-4">
            作成日: {new Date(note.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>
    </div>
  )
}

