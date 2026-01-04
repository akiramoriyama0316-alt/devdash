'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Note = {
  id: string
  title: string
  content: string
  category: string
  created_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setNotes(data)
  }

  async function addNote() {
    if (!title || !content) return

    await supabase
      .from('notes')
      .insert([{ title, content, category }])

    setTitle('')
    setContent('')
    fetchNotes()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/" className="text-blue-400 hover:underline">← ホームに戻る</Link>
        <h1 className="text-3xl font-bold mt-4">📚 学習メモ</h1>
      </div>

      {/* 追加フォーム */}
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">新規メモ</h2>
        
        <input
          type="text"
          placeholder="タイトル (例: useEffectの使い方)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded"
        >
          <option value="general">一般</option>
          <option value="react">React</option>
          <option value="nextjs">Next.js</option>
          <option value="css">CSS</option>
          <option value="error">エラー解決</option>
        </select>

        <textarea
          placeholder="メモ内容..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded h-40"
        />

        <button
          onClick={addNote}
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
        >
          追加
        </button>
      </div>

      {/* メモ一覧 */}
      <div className="max-w-4xl mx-auto space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{note.title}</h3>
              <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                {note.category}
              </span>
            </div>
            
            <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>

            <div className="text-sm text-gray-500 mt-3">
              {new Date(note.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}