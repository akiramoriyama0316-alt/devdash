'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Snippet = {
  id: string
  title: string
  code: string
  language: string
  created_at: string
}

export default function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')

  // データベースから取得
  useEffect(() => {
    fetchSnippets()
  }, [])

  async function fetchSnippets() {
    const { data } = await supabase
      .from('snippets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setSnippets(data)
  }

  // 新規追加
  async function addSnippet() {
    if (!title || !code) return

    await supabase
      .from('snippets')
      .insert([{ title, code, language }])

    setTitle('')
    setCode('')
    fetchSnippets()
  }

  // コピー機能
  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    alert('コピーしました！')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* ヘッダー */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/" className="text-blue-400 hover:underline">← ホームに戻る</Link>
        <h1 className="text-3xl font-bold mt-4">📝 スニペット管理</h1>
      </div>

      {/* 追加フォーム */}
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">新規追加</h2>
        
        <input
          type="text"
          placeholder="タイトル (例: React useStateの使い方)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded"
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="css">CSS</option>
        </select>

        <textarea
          placeholder="コードを入力..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-3 mb-3 bg-gray-700 rounded h-32"
        />

        <button
          onClick={addSnippet}
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
        >
          追加
        </button>
      </div>

      {/* スニペット一覧 */}
      <div className="max-w-4xl mx-auto space-y-4">
        {snippets.map((snippet) => (
          <div key={snippet.id} className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold">{snippet.title}</h3>
              <span className="text-sm bg-gray-700 px-2 py-1 rounded">{snippet.language}</span>
            </div>
            
            <pre className="bg-gray-900 p-4 rounded overflow-x-auto mb-3">
              <code>{snippet.code}</code>
            </pre>

            <button
              onClick={() => copyCode(snippet.code)}
              className="bg-green-600 px-4 py-1 rounded text-sm hover:bg-green-700"
            >
              コピー
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}