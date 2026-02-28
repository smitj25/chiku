'use client';

import { useState, useEffect, useCallback } from 'react';

interface Document {
    filename: string;
    size_kb: number;
    uploaded: string;
}

const PLUGINS = [
    { id: 'legal', label: '⚖ Legal', color: '#60a5fa' },
    { id: 'healthcare', label: '⚕ Healthcare', color: '#34d399' },
    { id: 'engineering', label: '⚙ Engineering', color: '#fbbf24' },
];

const BACKEND_URL = 'http://localhost:8000';

export default function DocumentsPage() {
    const [activePlugin, setActivePlugin] = useState('legal');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [message, setMessage] = useState('');

    const fetchDocs = useCallback(async () => {
        try {
            const res = await fetch(
                `${BACKEND_URL}/v1/documents?plugin_id=${activePlugin}`,
                { headers: { Authorization: 'Bearer dev-test-key-123' } }
            );
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch { setDocuments([]); }
    }, [activePlugin]);

    useEffect(() => { fetchDocs(); }, [fetchDocs]);

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        setMessage('');

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('plugin_id', activePlugin);
            try {
                const res = await fetch(`${BACKEND_URL}/v1/upload`, {
                    method: 'POST',
                    headers: { Authorization: 'Bearer dev-test-key-123' },
                    body: formData,
                });
                const data = await res.json();
                if (res.ok) {
                    setMessage(`✓ ${data.message}`);
                } else {
                    setMessage(`✗ ${data.detail || 'Upload failed'}`);
                }
            } catch {
                setMessage('✗ Could not connect to backend');
            }
        }
        setUploading(false);
        fetchDocs();
    };

    const handleDelete = async (filename: string) => {
        try {
            await fetch(
                `${BACKEND_URL}/v1/documents/${encodeURIComponent(filename)}?plugin_id=${activePlugin}`,
                { method: 'DELETE', headers: { Authorization: 'Bearer dev-test-key-123' } }
            );
            setMessage(`Deleted ${filename}`);
            fetchDocs();
        } catch {
            setMessage('Delete failed');
        }
    };

    const pluginColor = PLUGINS.find(p => p.id === activePlugin)?.color || '#888';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Documents</h1>
                    <p className="text-[#8b949e] mt-1">
                        Upload source documents to your SME knowledge base. The AI will cite these — never hallucinate.
                    </p>
                </div>
            </div>

            {/* Plugin Selector */}
            <div className="flex gap-3">
                {PLUGINS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setActivePlugin(p.id)}
                        className="px-5 py-2.5 rounded-lg font-mono text-sm font-bold tracking-wide transition-all"
                        style={{
                            background: activePlugin === p.id ? p.color + '22' : '#161b22',
                            border: `2px solid ${activePlugin === p.id ? p.color : '#30363d'}`,
                            color: activePlugin === p.id ? p.color : '#8b949e',
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                className="relative rounded-xl p-10 text-center transition-all cursor-pointer"
                style={{
                    border: `2px dashed ${dragOver ? pluginColor : '#30363d'}`,
                    background: dragOver ? pluginColor + '08' : '#0d1117',
                }}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".pdf,.txt,.md,.csv"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                />
                <div className="text-4xl mb-3">{uploading ? '⏳' : '📄'}</div>
                <p className="text-white font-semibold text-lg">
                    {uploading ? 'Uploading & indexing...' : 'Drop PDF, TXT, MD, or CSV files here'}
                </p>
                <p className="text-[#8b949e] text-sm mt-1">
                    or click to browse · files are chunked and embedded into ChromaDB
                </p>
            </div>

            {/* Status Message */}
            {message && (
                <div
                    className="px-4 py-3 rounded-lg font-mono text-sm"
                    style={{
                        background: message.startsWith('✓') ? '#0a1a0a' : message.startsWith('✗') ? '#1a0a0a' : '#161b22',
                        border: `1px solid ${message.startsWith('✓') ? '#3fb95040' : message.startsWith('✗') ? '#f8514940' : '#30363d'}`,
                        color: message.startsWith('✓') ? '#3fb950' : message.startsWith('✗') ? '#f85149' : '#e6edf3',
                    }}
                >
                    {message}
                </div>
            )}

            {/* Documents Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #30363d' }}>
                <div
                    className="px-5 py-3 font-mono text-xs font-bold tracking-widest uppercase"
                    style={{ background: '#161b22', color: pluginColor, borderBottom: '1px solid #30363d' }}
                >
                    {activePlugin.toUpperCase()} KNOWLEDGE BASE · {documents.length} document{documents.length !== 1 ? 's' : ''}
                </div>

                {documents.length === 0 ? (
                    <div className="px-5 py-12 text-center" style={{ background: '#0d1117' }}>
                        <p className="text-[#484f58] text-lg">No documents uploaded yet</p>
                        <p className="text-[#484f58] text-sm mt-1">
                            Upload a PDF above to start building your knowledge base
                        </p>
                    </div>
                ) : (
                    <table className="w-full" style={{ background: '#0d1117' }}>
                        <thead>
                            <tr style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                                <th className="text-left px-5 py-3 text-[#8b949e] text-xs font-mono uppercase tracking-wider">Filename</th>
                                <th className="text-left px-5 py-3 text-[#8b949e] text-xs font-mono uppercase tracking-wider">Size</th>
                                <th className="text-left px-5 py-3 text-[#8b949e] text-xs font-mono uppercase tracking-wider">Uploaded</th>
                                <th className="text-right px-5 py-3 text-[#8b949e] text-xs font-mono uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc, i) => (
                                <tr key={i} className="border-t" style={{ borderColor: '#21262d' }}>
                                    <td className="px-5 py-3">
                                        <span className="text-white font-mono text-sm">📄 {doc.filename}</span>
                                    </td>
                                    <td className="px-5 py-3 text-[#8b949e] text-sm font-mono">
                                        {doc.size_kb} KB
                                    </td>
                                    <td className="px-5 py-3 text-[#8b949e] text-sm font-mono">
                                        {new Date(doc.uploaded).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(doc.filename)}
                                            className="text-[#f85149] hover:text-[#ff7b72] text-xs font-mono font-bold tracking-wide px-3 py-1 rounded transition-colors"
                                            style={{ background: '#f8514910', border: '1px solid #f8514930' }}
                                        >
                                            DELETE
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* How it works */}
            <div className="rounded-xl p-6" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                <h3 className="text-white font-bold text-sm mb-3 font-mono tracking-wide">HOW RAG CITATIONS WORK</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    {[
                        { emoji: '📄', text: 'Upload PDF/TXT to your plugin' },
                        { emoji: '🔪', text: 'Document is chunked into 512-word blocks' },
                        { emoji: '🧠', text: 'Chunks are embedded into ChromaDB' },
                        { emoji: '✅', text: 'Chat queries retrieve real chunks → real citations' },
                    ].map((step, i) => (
                        <div key={i} className="p-4 rounded-lg" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
                            <div className="text-2xl mb-2">{step.emoji}</div>
                            <p className="text-[#8b949e] text-xs">{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
