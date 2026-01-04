'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function CustomNode({ data, id }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [memo, setMemo] = useState(data.memo || '')

  const colors: any = {
    'border-blue-500 bg-blue-900/50': { border: '#3b82f6', bg: 'rgba(30, 58, 138, 0.5)' },
    'border-green-500 bg-green-900/50': { border: '#22c55e', bg: 'rgba(20, 83, 45, 0.5)' },
    'border-red-500 bg-red-900/50': { border: '#ef4444', bg: 'rgba(127, 29, 29, 0.5)' },
    'border-yellow-500 bg-yellow-900/50': { border: '#eab308', bg: 'rgba(113, 63, 18, 0.5)' },
    'border-purple-500 bg-purple-900/50': { border: '#a855f7', bg: 'rgba(88, 28, 135, 0.5)' },
  }

  const currentColor = colors[data.color] || colors['border-blue-500 bg-blue-900/50']

  return (
    <div 
      className="p-4 rounded-lg border-2 min-w-[150px] relative"
      style={{
        borderColor: currentColor.border,
        backgroundColor: currentColor.bg,
      }}
    >
      {/* 上 */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          background: currentColor.border,
        }}
      />
      
      {/* 下 */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          background: currentColor.border,
        }}
      />

      <div className="text-white font-bold mb-2">{data.label}</div>
      
      {isEditing ? (
        <div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full p-2 bg-gray-700 text-white rounded text-sm"
            rows={3}
            placeholder="メモを入力..."
          />
          <button
            onClick={() => {
              data.onMemoUpdate(id, memo)
              setIsEditing(false)
            }}
            className="mt-2 bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      ) : (
        <div>
          {data.memo && (
            <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{data.memo}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              {data.memo ? '編集' : 'メモ追加'}
            </button>
            <button
              onClick={() => data.onDelete(id)}
              className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

export default function IdeasPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [nodeLabel, setNodeLabel] = useState('')
  const [nodeColor, setNodeColor] = useState('blue')
  const [mapId, setMapId] = useState<string | null>(null)

  const colorOptions = [
    { name: 'blue', class: 'border-blue-500 bg-blue-900/50' },
    { name: 'green', class: 'border-green-500 bg-green-900/50' },
    { name: 'red', class: 'border-red-500 bg-red-900/50' },
    { name: 'yellow', class: 'border-yellow-500 bg-yellow-900/50' },
    { name: 'purple', class: 'border-purple-500 bg-purple-900/50' },
  ]

  useEffect(() => {
    loadMap()
  }, [])

  async function loadMap() {
    const { data } = await supabase
      .from('idea_maps')
      .select('*')
      .limit(1)
      .single()

    if (data) {
      setMapId(data.id)
      if (data.nodes && data.nodes.length > 0) {
        const loadedNodes = data.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            onDelete: deleteNode,
            onMemoUpdate: updateNodeMemo,
          },
        }))
        setNodes(loadedNodes)
      }
      if (data.edges && data.edges.length > 0) {
        setEdges(data.edges)
      }
    }
  }

  async function saveMap() {
    if (!mapId) return

    const nodesToSave = nodes.map(node => ({
      ...node,
      data: {
        label: node.data.label,
        color: node.data.color,
        memo: node.data.memo,
      },
    }))

    await supabase
      .from('idea_maps')
      .update({
        nodes: nodesToSave,
        edges: edges,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mapId)

    alert('保存しました！')
  }

  function addNode() {
    if (!nodeLabel) return

    const colorClass = colorOptions.find(c => c.name === nodeColor)?.class || colorOptions[0].class

    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: nodeLabel,
        color: colorClass,
        memo: '',
        onDelete: deleteNode,
        onMemoUpdate: updateNodeMemo,
      },
    }

    setNodes((nds) => [...nds, newNode])
    setNodeLabel('')
  }

  function deleteNode(nodeId: string) {
    if (confirm('このノードを削除しますか？')) {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId))
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    }
  }

  function updateNodeMemo(nodeId: string, memo: string) {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, memo } }
          : node
      )
    )
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      setEdges((eds) => eds.filter((edge) => !deleted.some((d) => d.id === edge.id)))
    },
    [setEdges]
  )

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (confirm('この線を削除しますか？')) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id))
      }
    },
    [setEdges]
  )

  function clearAll() {
    if (confirm('全てのノードと接続を削除しますか？')) {
      setNodes([])
      setEdges([])
    }
  }

  return (
    <div className="h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <Link href="/" className="text-blue-400 hover:underline">← ホーム</Link>
            <h1 className="text-2xl font-bold mt-2">💡 アイデアマップ</h1>
          </div>

          <div className="flex gap-3 items-center">
            <select
              value={nodeColor}
              onChange={(e) => setNodeColor(e.target.value)}
              className="p-2 bg-gray-700 rounded"
            >
              <option value="blue">🔵 青</option>
              <option value="green">🟢 緑</option>
              <option value="red">🔴 赤</option>
              <option value="yellow">🟡 黄</option>
              <option value="purple">🟣 紫</option>
            </select>

            <input
              type="text"
              placeholder="アイデアを入力..."
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNode()}
              className="p-2 bg-gray-700 rounded w-64"
            />
            
            <button
              onClick={addNode}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              追加
            </button>
            
            <button
              onClick={saveMap}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
            >
              💾 保存
            </button>
            
            <button
              onClick={clearAll}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              全削除
            </button>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-80px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgesUpdatable={true}
          edgesFocusable={true}
          fitView
          style={{ background: '#111827' }}
        >
          <Background color="#374151" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg text-sm max-w-xs">
        <h3 className="font-bold mb-2">✨ 使い方</h3>
        <ul className="space-y-1 text-gray-300">
          <li>・ノードの丸い点をドラッグ</li>
          <li>・別のノードの点まで引っ張る</li>
          <li>・離すと線が繋がる</li>
          <li>・線をクリックで削除</li>
          <li>・💾保存ボタンで永久保存</li>
        </ul>
      </div>
    </div>
  )
}