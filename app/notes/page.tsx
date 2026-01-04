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
  user_id?: string
  is_shared?: boolean
  share_token?: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    checkUser()
    fetchNotes()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNotes()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    filterNotes()
  }, [searchQuery, notes])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  function filterNotes() {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.category.toLowerCase().includes(query)
    )
    setFilteredNotes(filtered)
  }

  async function fetchNotes() {
    try {
      setLoading(true)
      let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      // 認証済みの場合は自分のメモと共有メモを取得
      if (user) {
        const { data, error } = await query
          .or(`user_id.eq.${user.id},is_shared.eq.true`)
        
        if (error) {
          setError('メモの取得に失敗しました: ' + error.message)
          return
        }
        
        if (data) setNotes(data)
      } else {
        // 未認証の場合は共有メモのみ取得
        const { data, error } = await query
          .eq('is_shared', true)
        
        if (error) {
          setError('メモの取得に失敗しました: ' + error.message)
          return
        }
        
        if (data) setNotes(data)
      }
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
      const noteData: any = { title, content, category }
      
      if (user) {
        noteData.user_id = user.id
        noteData.is_shared = false
      }

      const { error } = await supabase
        .from('notes')
        .insert([noteData])

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

  function exportNotes(format: 'json' | 'csv') {
    const dataToExport = filteredNotes.length > 0 ? filteredNotes : notes
    
    if (format === 'json') {
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess('JSON形式でエクスポートしました！')
      setTimeout(() => setSuccess(null), 3000)
    } else if (format === 'csv') {
      const headers = ['タイトル', 'カテゴリ', '内容', '作成日']
      const rows = dataToExport.map(note => [
        note.title,
        note.category,
        note.content.replace(/\n/g, ' '),
        new Date(note.created_at).toLocaleDateString('ja-JP')
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `notes_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess('CSV形式でエクスポートしました！')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  async function handleAuth() {
    try {
      setLoading(true)
      setError(null)
      
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) {
          setError('サインアップに失敗しました: ' + error.message)
          return
        }
        
        setSuccess('アカウントを作成しました！確認メールを確認してください。')
        setShowAuthModal(false)
        setEmail('')
        setPassword('')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          setError('ログインに失敗しました: ' + error.message)
          return
        }
        
        setUser(data.user)
        setSuccess('ログインしました！')
        setShowAuthModal(false)
        setEmail('')
        setPassword('')
        fetchNotes()
      }
    } catch (err) {
      setError('認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setSuccess('ログアウトしました')
    setTimeout(() => setSuccess(null), 3000)
    fetchNotes()
  }

  async function toggleShare(note: Note) {
    try {
      setLoading(true)
      const shareToken = note.share_token || crypto.randomUUID()
      const { error } = await supabase
        .from('notes')
        .update({ 
          is_shared: !note.is_shared,
          share_token: shareToken
        })
        .eq('id', note.id)

      if (error) {
        setError('共有設定の更新に失敗しました: ' + error.message)
        return
      }

      setSuccess(note.is_shared ? '共有を解除しました' : '共有を有効にしました')
      setTimeout(() => setSuccess(null), 3000)
      fetchNotes()
    } catch (err) {
      setError('共有設定の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  function copyShareLink(note: Note) {
    if (!note.share_token) return
    
    const shareUrl = `${window.location.origin}/notes/shared/${note.share_token}`
    navigator.clipboard.writeText(shareUrl)
    setSuccess('共有リンクをコピーしました！')
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-2">
          <Link href="/" className="text-blue-400 hover:underline">← ホームに戻る</Link>
          <div className="flex gap-2">
            {user ? (
              <>
                <span className="text-sm text-gray-400 py-2">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login')
                  setShowAuthModal(true)
                }}
                className="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-3xl font-bold">📚 学習メモ</h1>
          <div className="flex gap-2">
            <button
              onClick={() => exportNotes('json')}
              className="bg-green-600 px-4 py-2 rounded text-sm hover:bg-green-700"
              title="JSON形式でエクスポート"
            >
              📥 JSON
            </button>
            <button
              onClick={() => exportNotes('csv')}
              className="bg-green-600 px-4 py-2 rounded text-sm hover:bg-green-700"
              title="CSV形式でエクスポート"
            >
              📥 CSV
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
            >
              {showAddForm ? 'キャンセル' : '+ メモを追加'}
            </button>
          </div>
        </div>
      </div>

      {/* 検索バー */}
      <div className="max-w-4xl mx-auto mb-6">
        <input
          type="text"
          placeholder="🔍 タイトル、内容、カテゴリで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-400">
            {filteredNotes.length}件のメモが見つかりました
          </div>
        )}
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
        {!loading && (searchQuery ? filteredNotes : notes).length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {searchQuery ? '検索結果がありません' : 'メモがありません。追加ボタンからメモを作成してください。'}
          </div>
        )}
        {(searchQuery ? filteredNotes : notes).map((note) => (
          <div key={note.id} className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold">{note.title}</h3>
              <div className="flex gap-2 items-center">
                {note.is_shared && (
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded" title="共有中">
                    🔗 共有
                  </span>
                )}
                <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                  {note.category}
                </span>
              </div>
            </div>
            
            <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>

            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500">
                {new Date(note.created_at).toLocaleDateString('ja-JP')}
              </div>
              <div className="flex gap-2">
                {user && note.user_id === user.id && (
                  <>
                    {note.is_shared && note.share_token && (
                      <button
                        onClick={() => copyShareLink(note)}
                        disabled={loading}
                        className="bg-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="共有リンクをコピー"
                      >
                        📋 リンク
                      </button>
                    )}
                    <button
                      onClick={() => toggleShare(note)}
                      disabled={loading}
                      className="bg-yellow-600 px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {note.is_shared ? '🔒 非共有' : '🔓 共有'}
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      disabled={loading}
                      className="bg-red-600 px-4 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      削除
                    </button>
                  </>
                )}
                {!user && note.is_shared && (
                  <span className="text-xs text-gray-400">共有メモ</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 認証モーダル */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {authMode === 'login' ? 'ログイン' : 'サインアップ'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false)
                  setEmail('')
                  setPassword('')
                  setError(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded"
                disabled={loading}
              />
              <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAuth()
                }}
              />
              <button
                onClick={handleAuth}
                disabled={loading}
                className="w-full bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : authMode === 'login' ? 'ログイン' : 'サインアップ'}
              </button>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="w-full text-blue-400 hover:underline text-sm"
              >
                {authMode === 'login' ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}