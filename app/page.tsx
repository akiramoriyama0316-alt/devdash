import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 p-6">
        <h1 className="text-3xl font-bold">DevDash</h1>
        <p className="text-gray-400 mt-2">開発者専用ダッシュボード</p>
      </header>

      {/* メインコンテンツ */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">
          
          {/* スニペットカード */}
          <Link href="/snippets">
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">📝 スニペット</h2>
              <p className="text-gray-400">よく使うコードを保存</p>
            </div>
          </Link>

          {/* アイデアカード */}
          <Link href="/ideas">
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">💡 アイデア</h2>
              <p className="text-gray-400">アプリアイデアをメモ</p>
            </div>
          </Link>

          {/* メモカード */}
          <Link href="/notes">
            <div className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition cursor-pointer">
              <h2 className="text-2xl font-bold mb-2">📚 学習メモ</h2>
              <p className="text-gray-400">学んだことを記録</p>
            </div>
          </Link>

        </div>
      </main>
    </div>
  )
}