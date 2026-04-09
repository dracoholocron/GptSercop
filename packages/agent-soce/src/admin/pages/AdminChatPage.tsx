import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useStreamChat, type RagChunk } from '../hooks/useStreamChat.js';

// ─── Types ───────────────────────────────────────────────

interface Folder { id: string; name: string; icon: string; color: string; sortOrder: number; _count?: { chats: number } }
interface Chat {
  id: string; title: string; folderId: string | null; catalogIds: string[]; providerId: string | null;
  systemPrompt: string | null; isPinned: boolean; createdAt: string; updatedAt: string;
  folder?: { id: string; name: string; icon: string; color: string } | null;
  messages?: MsgPreview[]; _count?: { messages: number };
}
interface MsgPreview { content: string; role: string; createdAt: string }
interface Msg {
  id: string; chatId: string; role: string; content: string;
  ragChunksUsed?: RagChunk[] | null; providerId?: string | null; model?: string | null;
  tokensIn?: number | null; tokensOut?: number | null; latencyMs?: number | null;
  feedbackRating?: number | null; createdAt: string;
}
interface ChatDetail extends Chat { messages: Msg[] }
interface Catalog { id: string; name: string; slug: string; icon: string }
interface LLMProvider { id: string; name: string; type: string; model: string; isDefault: boolean }

// ─── Component ───────────────────────────────────────────

export const AdminChatPage: React.FC = () => {
  const { get, post, put, del, patch } = useApi();
  const { sendMessage } = useStreamChat();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatDetail | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [streamRag, setStreamRag] = useState<RagChunk[]>([]);

  const [search, setSearch] = useState('');
  const [sidebarSection, setSidebarSection] = useState<Record<string, boolean>>({});
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');

  const [selectedCatalogs, setSelectedCatalogs] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Data Loading ────────────────────────────────────

  const loadFolders = useCallback(async () => {
    const data = await get<Folder[]>('/admin/chat/folders');
    setFolders(data ?? []);
  }, []);

  const loadChats = useCallback(async (q?: string) => {
    const path = q ? `/admin/chat/conversations?search=${encodeURIComponent(q)}` : '/admin/chat/conversations';
    const data = await get<Chat[]>(path);
    setChats(data ?? []);
  }, []);

  const loadChat = useCallback(async (id: string) => {
    const data = await get<ChatDetail>(`/admin/chat/conversations/${id}`);
    if (data) {
      setActiveChat(data);
      setSelectedCatalogs(data.catalogIds ?? []);
      setSelectedProvider(data.providerId ?? '');
      setSystemPrompt(data.systemPrompt ?? '');
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      loadFolders(),
      loadChats(),
      get<Catalog[]>('/admin/knowledge/catalogs').then((c) => setCatalogs(c ?? [])).catch(() => {}),
      get<LLMProvider[]>('/providers').catch(() => null).then((p) => {
        if (Array.isArray(p)) setProviders(p);
      }),
    ]);
  }, []);

  useEffect(() => {
    if (activeChatId) void loadChat(activeChatId);
    else setActiveChat(null);
  }, [activeChatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat?.messages, streamText]);

  // ─── Actions ─────────────────────────────────────────

  const handleNewChat = async (folderId?: string) => {
    const chat = await post<Chat>('/admin/chat/conversations', {
      folderId: folderId || undefined,
      catalogIds: selectedCatalogs,
      providerId: selectedProvider || undefined,
    });
    await loadChats();
    setActiveChatId(chat.id);
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm('¿Eliminar esta conversacion?')) return;
    await del(`/admin/chat/conversations/${id}`);
    if (activeChatId === id) { setActiveChatId(null); setActiveChat(null); }
    await loadChats();
  };

  const handlePin = async (chat: Chat) => {
    await put(`/admin/chat/conversations/${chat.id}`, { isPinned: !chat.isPinned });
    await loadChats();
    if (activeChatId === chat.id) await loadChat(chat.id);
  };

  const handleRename = async (id: string) => {
    if (!titleInput.trim()) { setEditingTitle(null); return; }
    await put(`/admin/chat/conversations/${id}`, { title: titleInput.trim() });
    setEditingTitle(null);
    await loadChats();
    if (activeChatId === id) await loadChat(id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await post('/admin/chat/folders', { name: newFolderName.trim() });
    setNewFolderName('');
    setShowNewFolder(false);
    await loadFolders();
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('¿Eliminar esta carpeta? Las conversaciones no se eliminaran.')) return;
    await del(`/admin/chat/folders/${id}`);
    await loadFolders();
    await loadChats();
  };

  const handleMoveToFolder = async (chatId: string, folderId: string | null) => {
    await put(`/admin/chat/conversations/${chatId}`, { folderId });
    await loadChats();
  };

  const handleSaveSettings = async () => {
    if (!activeChatId) return;
    await put(`/admin/chat/conversations/${activeChatId}`, {
      catalogIds: selectedCatalogs,
      providerId: selectedProvider || null,
      systemPrompt: systemPrompt || null,
    });
    setShowSettings(false);
    await loadChat(activeChatId);
  };

  const handleFeedback = async (msgId: string, rating: number) => {
    await patch(`/admin/chat/messages/${msgId}/feedback`, { rating });
    if (activeChatId) await loadChat(activeChatId);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChatId || streaming) return;
    const content = input.trim();
    setInput('');
    setStreaming(true);
    setStreamText('');
    setStreamRag([]);

    // Optimistic user bubble
    setActiveChat((prev) => prev ? {
      ...prev,
      messages: [...prev.messages, { id: 'temp-user', chatId: prev.id, role: 'user', content, createdAt: new Date().toISOString() } as Msg],
    } : prev);

    let fullText = '';
    let ragChunks: RagChunk[] = [];
    try {
      for await (const event of sendMessage(activeChatId, content)) {
        if (event.type === 'text') {
          fullText += String(event.data);
          setStreamText(fullText);
        } else if (event.type === 'rag_sources') {
          ragChunks = event.data as RagChunk[];
          setStreamRag(ragChunks);
        } else if (event.type === 'error') {
          fullText += `\n\n[Error: ${event.data}]`;
          setStreamText(fullText);
        }
      }
    } catch (e) {
      fullText += `\n\n[Error: ${(e as Error).message}]`;
      setStreamText(fullText);
    }

    setStreaming(false);
    setStreamText('');
    setStreamRag([]);
    await loadChat(activeChatId);
    await loadChats();
  };

  const handleExport = () => {
    if (!activeChat) return;
    let md = `# ${activeChat.title}\nFecha: ${new Date(activeChat.createdAt).toLocaleString()}\n---\n\n`;
    for (const m of activeChat.messages) {
      md += `**${m.role === 'user' ? 'Usuario' : 'Asistente'}:** ${m.content}\n\n`;
      if (m.ragChunksUsed?.length) {
        md += `> Fuentes: ${(m.ragChunksUsed as RagChunk[]).map((c) => c.title).join(', ')}\n\n`;
      }
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${activeChat.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─── Helpers ─────────────────────────────────────────

  const timeGroup = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return 'Ultimos 7 dias';
    return 'Anteriores';
  };

  const pinnedChats = chats.filter((c) => c.isPinned);
  const folderedChats = chats.filter((c) => c.folderId && !c.isPinned);
  const unfolderedChats = chats.filter((c) => !c.folderId && !c.isPinned);
  const groupedUnfoldered: Record<string, Chat[]> = {};
  for (const c of unfolderedChats) {
    const g = timeGroup(c.updatedAt);
    (groupedUnfoldered[g] ??= []).push(c);
  }

  const filteredChats = search
    ? chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  const displayMessages = activeChat?.messages ?? [];

  // ─── Render ──────────────────────────────────────────

  const renderChatItem = (c: Chat, showFolder = false) => {
    const isActive = c.id === activeChatId;
    return (
      <div
        key={c.id}
        onClick={() => setActiveChatId(c.id)}
        style={{ ...S.chatItem, background: isActive ? '#EBF5FF' : 'transparent', borderLeft: isActive ? '3px solid #0073E6' : '3px solid transparent' }}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('chatId', c.id)}
      >
        {editingTitle === c.id ? (
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={() => handleRename(c.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(c.id); if (e.key === 'Escape') setEditingTitle(null); }}
            autoFocus
            style={S.renameInput}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div style={S.chatItemTitle}>{c.title}</div>
        )}
        {showFolder && c.folder && <div style={S.chatItemMeta}>{c.folder.icon} {c.folder.name}</div>}
        <div style={S.chatItemMeta}>
          {c._count?.messages ?? 0} msgs &middot; {new Date(c.updatedAt).toLocaleDateString()}
        </div>
        <div style={S.chatItemActions} onClick={(e) => e.stopPropagation()}>
          <button title="Fijar" style={S.iconBtn} onClick={() => handlePin(c)}>{c.isPinned ? '★' : '☆'}</button>
          <button title="Renombrar" style={S.iconBtn} onClick={() => { setEditingTitle(c.id); setTitleInput(c.title); }}>✏️</button>
          <button title="Eliminar" style={{ ...S.iconBtn, color: '#E53E3E' }} onClick={() => handleDeleteChat(c.id)}>🗑</button>
        </div>
      </div>
    );
  };

  const RagPanel: React.FC<{ chunks: RagChunk[] }> = ({ chunks }) => {
    const [open, setOpen] = useState(false);
    if (!chunks.length) return null;
    return (
      <div style={S.ragPanel}>
        <button style={S.ragToggle} onClick={() => setOpen(!open)}>
          📎 {chunks.length} fuente{chunks.length > 1 ? 's' : ''} usada{chunks.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
        </button>
        {open && (
          <div style={S.ragList}>
            {chunks.map((c) => (
              <div key={c.id} style={S.ragChip}>
                <div style={S.ragChipTitle}>📄 {c.title}</div>
                <div style={S.ragChipMeta}>
                  Fuente: {c.source} &middot; Similitud: {Math.round((c.score ?? 0) * 100)}%
                </div>
                {c.snippet && <div style={S.ragChipSnippet}>{c.snippet}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={S.wrap}>
      {/* ─── Sidebar ──────────────────────────── */}
      <div style={S.sidebar}>
        <button style={S.newChatBtn} onClick={() => handleNewChat()}>+ Nueva Conversacion</button>

        <input
          placeholder="Buscar conversaciones..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); if (e.target.value) loadChats(e.target.value); else loadChats(); }}
          style={S.searchInput}
        />

        {filteredChats ? (
          <div style={S.sideSection}>
            <div style={S.sideSectionTitle}>Resultados</div>
            {filteredChats.map((c) => renderChatItem(c, true))}
            {filteredChats.length === 0 && <div style={S.empty}>Sin resultados</div>}
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinnedChats.length > 0 && (
              <div style={S.sideSection}>
                <div style={S.sideSectionTitle}>📌 Fijados</div>
                {pinnedChats.map((c) => renderChatItem(c))}
              </div>
            )}

            {/* Folders */}
            {folders.map((f) => {
              const folderChats = folderedChats.filter((c) => c.folderId === f.id);
              const isOpen = sidebarSection[f.id] !== false;
              return (
                <div
                  key={f.id}
                  style={S.sideSection}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const chatId = e.dataTransfer.getData('chatId'); if (chatId) handleMoveToFolder(chatId, f.id); }}
                >
                  <div style={S.folderHeader}>
                    <button style={S.iconBtn} onClick={() => setSidebarSection((p) => ({ ...p, [f.id]: !isOpen }))}>
                      {isOpen ? '▼' : '▶'}
                    </button>
                    <span style={{ ...S.sideSectionTitle, flex: 1, cursor: 'pointer' }} onClick={() => setSidebarSection((p) => ({ ...p, [f.id]: !isOpen }))}>
                      {f.icon === 'folder' ? '📁' : f.icon} {f.name} ({folderChats.length})
                    </span>
                    <button style={S.iconBtn} onClick={() => handleNewChat(f.id)} title="Nueva conversacion en carpeta">+</button>
                    <button style={{ ...S.iconBtn, color: '#E53E3E' }} onClick={() => handleDeleteFolder(f.id)} title="Eliminar carpeta">×</button>
                  </div>
                  {isOpen && folderChats.map((c) => renderChatItem(c))}
                </div>
              );
            })}

            {/* New folder button */}
            {showNewFolder ? (
              <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Nombre..." style={S.renameInput} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }} />
                <button style={S.iconBtn} onClick={handleCreateFolder}>✓</button>
                <button style={S.iconBtn} onClick={() => setShowNewFolder(false)}>×</button>
              </div>
            ) : (
              <button style={S.addFolderBtn} onClick={() => setShowNewFolder(true)}>+ Nueva Carpeta</button>
            )}

            {/* Time-grouped history */}
            {['Hoy', 'Ayer', 'Ultimos 7 dias', 'Anteriores'].map((g) => {
              const items = groupedUnfoldered[g];
              if (!items?.length) return null;
              return (
                <div key={g} style={S.sideSection}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const chatId = e.dataTransfer.getData('chatId'); if (chatId) handleMoveToFolder(chatId, null); }}
                >
                  <div style={S.sideSectionTitle}>{g}</div>
                  {items.map((c) => renderChatItem(c))}
                </div>
              );
            })}
          </>
        )}

        {/* Stats */}
        <div style={S.sideStats}>
          {folders.length} carpetas &middot; {chats.length} conversaciones
        </div>
      </div>

      {/* ─── Main Area ────────────────────────── */}
      <div style={S.main}>
        {!activeChat ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#1A202C' }}>Chat Playground</div>
            <div style={{ color: '#64748B', marginTop: 8, fontSize: 14 }}>Selecciona o crea una nueva conversacion para probar el RAG y los modelos LLM.</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={S.chatHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.chatTitle}>{activeChat.title}</div>
                <div style={S.chatMeta}>
                  {activeChat.catalogIds.length > 0 && (
                    <span style={S.badge}>📚 {activeChat.catalogIds.length} catalogo{activeChat.catalogIds.length > 1 ? 's' : ''}</span>
                  )}
                  {activeChat.providerId && (
                    <span style={S.badge}>🤖 {providers.find((p) => p.id === activeChat.providerId)?.name ?? activeChat.providerId}</span>
                  )}
                </div>
              </div>
              <button style={S.headerBtn} onClick={() => setShowSettings(!showSettings)} title="Configuracion">⚙️</button>
              <button style={S.headerBtn} onClick={handleExport} title="Exportar">⬇️</button>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div style={S.settingsPanel}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#1A202C' }}>Configuracion del chat</div>
                <label style={S.label}>Catalogos RAG</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {catalogs.map((c) => (
                    <button
                      key={c.id}
                      style={{ ...S.chipBtn, background: selectedCatalogs.includes(c.id) ? '#0073E6' : '#E2E8F0', color: selectedCatalogs.includes(c.id) ? '#fff' : '#1A202C' }}
                      onClick={() => setSelectedCatalogs((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                  {catalogs.length === 0 && <span style={{ fontSize: 12, color: '#94A3B8' }}>No hay catalogos creados</span>}
                </div>
                <label style={S.label}>Modelo LLM</label>
                <select value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)} style={S.select}>
                  <option value="">Predeterminado</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.model})</option>)}
                </select>
                <label style={{ ...S.label, marginTop: 12 }}>System Prompt (opcional)</label>
                <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} style={S.promptArea} rows={3} placeholder="Prompt personalizado para este chat..." />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={S.saveBtnPrimary} onClick={handleSaveSettings}>Guardar</button>
                  <button style={S.saveBtnSecondary} onClick={() => setShowSettings(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={S.messageArea}>
              {displayMessages.map((m) => (
                <div key={m.id} style={m.role === 'user' ? S.userRow : S.assistantRow}>
                  <div style={m.role === 'user' ? S.userBubble : S.assistantBubble}>
                    <div style={S.msgContent}>{m.content}</div>
                    {m.role === 'assistant' && m.ragChunksUsed && (m.ragChunksUsed as RagChunk[]).length > 0 && <RagPanel chunks={m.ragChunksUsed as RagChunk[]} />}
                    {m.role === 'assistant' && (
                      <div style={S.msgFooter}>
                        {m.model && <span style={S.statChip}>🤖 {m.model}</span>}
                        {m.latencyMs != null && <span style={S.statChip}>{(m.latencyMs / 1000).toFixed(1)}s</span>}
                        <button style={{ ...S.iconBtn, fontSize: 14, opacity: m.feedbackRating === 1 ? 1 : 0.4 }} onClick={() => handleFeedback(m.id, 1)}>👍</button>
                        <button style={{ ...S.iconBtn, fontSize: 14, opacity: m.feedbackRating === -1 ? 1 : 0.4 }} onClick={() => handleFeedback(m.id, -1)}>👎</button>
                        <button style={{ ...S.iconBtn, fontSize: 14 }} onClick={() => navigator.clipboard.writeText(m.content)} title="Copiar">📋</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {streaming && (
                <div style={S.assistantRow}>
                  <div style={S.assistantBubble}>
                    {streamRag.length > 0 && <RagPanel chunks={streamRag} />}
                    <div style={S.msgContent}>{streamText || <span style={{ color: '#94A3B8' }}>Pensando...</span>}</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={S.inputArea}>
              <div style={S.inputRow}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Escribe tu mensaje..."
                  style={S.textInput}
                  rows={1}
                  disabled={streaming}
                />
                <button style={{ ...S.sendBtn, opacity: streaming || !input.trim() ? 0.5 : 1 }} onClick={handleSend} disabled={streaming || !input.trim()}>
                  {streaming ? '...' : '➤'}
                </button>
              </div>
              <div style={S.inputMeta}>
                {selectedCatalogs.length > 0 && <span style={S.statChip}>📚 {selectedCatalogs.length} catalogo{selectedCatalogs.length > 1 ? 's' : ''}</span>}
                {selectedProvider && <span style={S.statChip}>🤖 {providers.find((p) => p.id === selectedProvider)?.name ?? 'Custom'}</span>}
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Shift+Enter nueva linea</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', height: '100%', minHeight: 'calc(100vh - 60px)', background: '#F8FAFC', color: '#1A202C' },
  sidebar: { width: 300, minWidth: 300, borderRight: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  newChatBtn: { margin: '12px 10px 8px', padding: '10px 16px', background: '#0073E6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  searchInput: { margin: '0 10px 8px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', color: '#1A202C', background: '#F8FAFC' },
  sideSection: { padding: '4px 0' },
  sideSectionTitle: { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, padding: '6px 12px 2px', letterSpacing: 0.5 },
  folderHeader: { display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px' },
  addFolderBtn: { margin: '4px 10px', padding: '6px 12px', background: 'transparent', color: '#64748B', border: '1px dashed #CBD5E1', borderRadius: 6, fontSize: 12, cursor: 'pointer' },

  chatItem: { padding: '8px 12px', cursor: 'pointer', position: 'relative' as const, transition: 'background 0.15s' },
  chatItemTitle: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: '#1A202C' },
  chatItemMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  chatItemActions: { position: 'absolute' as const, right: 8, top: 8, display: 'flex', gap: 2, opacity: 0.6 },
  renameInput: { flex: 1, padding: '4px 8px', border: '1px solid #0073E6', borderRadius: 4, fontSize: 13, outline: 'none', color: '#1A202C' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 4px', color: '#64748B' },
  sideStats: { marginTop: 'auto', padding: '10px 12px', fontSize: 11, color: '#94A3B8', borderTop: '1px solid #E2E8F0' },

  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },

  chatHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' },
  chatTitle: { fontSize: 16, fontWeight: 700, color: '#1A202C' },
  chatMeta: { display: 'flex', gap: 6, marginTop: 4 },
  badge: { fontSize: 11, background: '#EBF5FF', color: '#0073E6', padding: '2px 8px', borderRadius: 12, fontWeight: 500 },
  headerBtn: { background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 14 },

  settingsPanel: { padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 },
  chipBtn: { border: 'none', borderRadius: 16, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  select: { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, color: '#1A202C', background: '#FFFFFF' },
  promptArea: { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, color: '#1A202C', background: '#FFFFFF', resize: 'vertical' as const },
  saveBtnPrimary: { padding: '8px 20px', background: '#0073E6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  saveBtnSecondary: { padding: '8px 20px', background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  messageArea: { flex: 1, overflowY: 'auto' as const, padding: '20px 20px 0' },
  userRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: 12 },
  assistantRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: 12 },
  userBubble: { maxWidth: '70%', background: '#0073E6', color: '#FFFFFF', borderRadius: '16px 16px 4px 16px', padding: '12px 16px' },
  assistantBubble: { maxWidth: '80%', background: '#FFFFFF', color: '#1A202C', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', border: '1px solid #E2E8F0' },
  msgContent: { fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const },
  msgFooter: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' as const },
  statChip: { fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 10 },

  ragPanel: { marginTop: 10, borderTop: '1px solid #E2E8F0', paddingTop: 8 },
  ragToggle: { background: 'none', border: 'none', fontSize: 12, color: '#0073E6', cursor: 'pointer', fontWeight: 600, padding: 0 },
  ragList: { marginTop: 8, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  ragChip: { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px' },
  ragChipTitle: { fontSize: 12, fontWeight: 600, color: '#1A202C' },
  ragChipMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  ragChipSnippet: { fontSize: 11, color: '#475569', marginTop: 4, fontStyle: 'italic' as const },

  inputArea: { padding: '12px 20px 16px', borderTop: '1px solid #E2E8F0', background: '#FFFFFF' },
  inputRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  textInput: { flex: 1, padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'none' as const, maxHeight: 120, lineHeight: 1.5, color: '#1A202C', background: '#F8FAFC' },
  sendBtn: { padding: '10px 18px', background: '#0073E6', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, cursor: 'pointer', fontWeight: 700 },
  inputMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },

  empty: { fontSize: 12, color: '#94A3B8', padding: '8px 12px' },
};
