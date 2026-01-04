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
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        setError('メモの取得に失敗しました: ' + error.message)
        return
      }
      
      if (data) setNotes(data)
    } catch (err) {
      setError('メモの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function addNote() {
    if (!title || !content) {
      setError('タイトルと内容を入力してください')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase
        .from('notes')
        .insert([{ title, content, category }])

      if (error) {
        setError('メモの追加に失敗しました: ' + error.message)
        return
      }

      setTitle('')
      setContent('')
      setCategory('general')
      setShowAddForm(false)
      setSuccess('メモを追加しました！')
      setTimeout(() => setSuccess(null), 3000)
      fetchNotes()
    } catch (err) {
      setError('メモの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('このメモを削除してもよろしいですか？')) return

    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) {
        setError('メモの削除に失敗しました: ' + error.message)
        return
      }

      setSuccess('メモを削除しました！')
      setTimeout(() => setSuccess(null), 3000)
      fetchNotes()
    } catch (err) {
      setError('メモの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/" className="text-blue-400 hover:underline">← ホームに戻る</Link>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold">📚 学習メモ</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
          >
            {showAddForm ? 'キャンセル' : '+ メモを追加'}
          </button>
        </div>
      </div>

      {/* エラー・成功メッセージ */}
      {error && (
        <div className="max-w-4xl mx-auto mb-4 bg-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="max-w-4xl mx-auto mb-4 bg-green-600 p-4 rounded-lg">
          {success}
        </div>
      )}

      {/* 追加フォーム */}
      {showAddForm && (
        <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">新規メモ</h2>
          
          <input
            type="text"
            placeholder="タイトル (例: useEffectの使い方)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-3 bg-gray-700 rounded"
            disabled={loading}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 mb-3 bg-gray-700 rounded"
            disabled={loading}
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
            disabled={loading}
          />

          <button
            onClick={addNote}
            disabled={loading}
            className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '追加中...' : '追加'}
          </button>
        </div>
      )}

      {/* メモ一覧 */}
      <div className="max-w-4xl mx-auto space-y-4">
        {loading && !showAddForm && (
          <div className="text-center text-gray-400">読み込み中...</div>
        )}
        {!loading && notes.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            メモがありません。追加ボタンからメモを作成してください。
          </div>
        )}
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{note.title}</h3>
              <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                {note.category}
              </span>
            </div>
            
            <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>

            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500">
                {new Date(note.created_at).toLocaleDateString('ja-JP')}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                disabled={loading}
                className="bg-red-600 px-4 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}