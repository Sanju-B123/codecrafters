import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  Send,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  Layers,
  FileText,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Info,
  X,
  MessageSquare,
  HelpCircle,
  Menu,
  SlidersHorizontal,
  Box,
  CornerDownLeft,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Upload,
} from 'lucide-react';
import { assistantService } from '@/services/assistantService';
import { productService } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from '@/components/ui';

export const AssistantPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Active Thread Messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Active Sources (for right-hand panel)
  const [activeSources, setActiveSources] = useState([]);

  // Product Context State
  const [productContext, setProductContext] = useState(null);
  const [loadingProductContext, setLoadingProductContext] = useState(false);

  // Input & Sending State
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Mobile Drawers
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const defaultPrompts = [
    'Which standards may apply to an electric storage water heater?',
    'Explain clause 4.1 in simple language',
    'What are the test requirements for insulation resistance?',
    'What documents are required for BIS ISI mark certification?',
    'How do I apply for BIS lab testing service?',
  ];

  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    addToast({
      type: 'success',
      title: 'Copied',
      message: 'Response copied to clipboard.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (msgIndex) => {
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === 'USER') {
        handleSend(messages[i].content);
        break;
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load Product Context if productId is in URL
  useEffect(() => {
    if (!productId) {
      setProductContext(null);
      return;
    }

    let isMounted = true;
    setLoadingProductContext(true);
    assistantService
      .getProductContext(productId)
      .then((data) => {
        if (isMounted) setProductContext(data);
      })
      .catch((err) => {
        console.warn('Could not fetch product context for assistant:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingProductContext(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Fetch Conversations List
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const list = await assistantService.getConversations(productId || null);
      setConversations(list || []);

      // If active conversation not set and list has items, select the first one
      if (list && list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [productId, activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load Messages for Active Conversation
  useEffect(() => {
    if (!activeConvId) {
      // New or empty conversation state
      setMessages([]);
      setActiveSources([]);
      return;
    }

    let isMounted = true;
    setLoadingMessages(true);
    assistantService
      .getConversation(activeConvId)
      .then((convDetail) => {
        if (!isMounted) return;
        setMessages(convDetail.messages || []);

        // Aggregate latest sources from assistant messages in this conversation
        const assistantMsgs = (convDetail.messages || []).filter((m) => m.role === 'ASSISTANT');
        if (assistantMsgs.length > 0) {
          const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
          setActiveSources(lastAssistant.sources || []);
        } else {
          setActiveSources([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load conversation details:', err);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Could not load conversation history.',
        });
      })
      .finally(() => {
        if (isMounted) setLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConvId, addToast]);

  // Start a New Conversation
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setActiveSources([]);
    setInputQuery('');
    setMobileHistoryOpen(false);
  };

  // Delete Conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await assistantService.deleteConversation(convId);
      addToast({
        type: 'success',
        title: 'Conversation Deleted',
        message: 'The chat history has been removed.',
      });
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
        setActiveSources([]);
      }
      fetchConversations();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete conversation.',
      });
    }
  };

  // Send Message
  const handleSend = async (queryToSend = null) => {
    const text = (queryToSend !== null ? queryToSend : inputQuery).trim();
    if (!text || isSending) return;

    setInputQuery('');

    // Optimistically append user message to thread
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || 0,
      role: 'USER',
      content: text,
      created_at: new Date().toISOString(),
      sources: [],
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const resp = await assistantService.sendMessage({
        message: text,
        conversation_id: activeConvId,
        product_id: productId ? parseInt(productId, 10) : null,
      });

      // Update active conversation ID if this was a new thread
      if (!activeConvId && resp.conversation_id) {
        setActiveConvId(resp.conversation_id);
      }

      // Assistant response message
      const assistantMsg = {
        id: resp.message_id,
        conversation_id: resp.conversation_id,
        role: 'ASSISTANT',
        content: resp.answer,
        confidence: resp.confidence,
        confidence_reason: resp.confidence_reason,
        confidence_guidance: resp.confidence_guidance,
        actions: resp.actions || [],
        recommended_actions: resp.recommended_actions || [],
        citations: resp.citations || resp.sources || [],
        disclaimer: resp.disclaimer,
        created_at: new Date().toISOString(),
        sources: resp.sources || [],
        intent: resp.intent,
        latency_ms: resp.latency_ms,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setActiveSources(resp.sources || []);
      fetchConversations();
    } catch (err) {
      console.error('AI chat failed:', err);
      const errMsg = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || 0,
        role: 'ASSISTANT',
        content:
          err.status === 429
            ? 'Rate limit reached. Please wait a moment before asking another question.'
            : 'AI service encountered an unexpected error. Please verify your connection or try again.',
        confidence: 'LOW',
        recommended_actions: ['Try rephrasing your inquiry with specific clause numbers or standards.'],
        created_at: new Date().toISOString(),
        sources: [],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Render markdown text formatting (bolding, lists, headers, code, tables)
  const renderFormattedContent = (content) => {
    if (!content) return null;

    // Simple markdown line-by-line renderer
    const lines = content.split('\n');
    const elements = [];

    let inTable = false;
    let tableRows = [];

    const flushTable = (keyIndex) => {
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${keyIndex}`} className="overflow-x-auto my-3">
            <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg">
              <tbody>
                {tableRows.map((row, rIdx) => {
                  const isHeader = rIdx === 0;
                  const cells = row
                    .split('|')
                    .map((c) => c.trim())
                    .filter((c) => c.length > 0);
                  if (row.includes('---')) return null; // Separator row
                  return (
                    <tr
                      key={rIdx}
                      className={
                        isHeader
                          ? 'bg-slate-100 dark:bg-slate-800 font-bold'
                          : 'border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }
                    >
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                          {renderInlineStyles(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check Table row
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableRows.push(trimmed);
        return;
      } else if (inTable) {
        flushTable(idx);
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1">
            {trimmed.replace('### ', '')}
          </h4>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h5 key={idx} className="font-bold text-xs uppercase tracking-wider text-bharat-800 dark:text-bharat-300 mt-2 mb-1">
            {trimmed.replace('#### ', '')}
          </h5>
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed">
            {renderInlineStyles(trimmed.substring(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={idx} className="ml-4 list-decimal text-xs text-slate-700 dark:text-slate-300 my-0.5 leading-relaxed">
            {renderInlineStyles(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
      } else if (trimmed === '') {
        elements.push(<div key={idx} className="h-1.5" />);
      } else {
        elements.push(
          <p key={idx} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
            {renderInlineStyles(trimmed)}
          </p>
        );
      }
    });

    if (inTable) flushTable('end');
    return elements;
  };

  const renderInlineStyles = (text) => {
    // Bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col max-w-[1600px] mx-auto -mt-2 sm:-mt-4">
      {/* 1. Header Bar with Trust & Product Indicators */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Bot className="w-5 h-5 text-saffron-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                BharatStandards AI
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 uppercase font-mono">
                DEMO AI MODE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Evidence-grounded responses
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Your intelligent standards and compliance assistant.
            </p>
          </div>
        </div>

        {/* Mobile toggles & Product badge */}
        <div className="flex items-center gap-2">
          {productContext && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
              <Box className="w-3.5 h-3.5 text-bharat-700 dark:text-bharat-400" />
              <span>Product: <strong>{productContext.name}</strong></span>
            </div>
          )}

          <button
            onClick={() => setMobileHistoryOpen(!mobileHistoryOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Conversation History"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileSourcesOpen(!mobileSourcesOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Sources & Evidence"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three-Column Workspace */}
      <div className="flex-1 flex overflow-hidden pt-3 gap-4">
        {/* Left Column: Conversation History */}
        <div
          className={`
            fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 lg:w-72 bg-white dark:bg-slate-900 md:bg-transparent
            flex flex-col border-r md:border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-4 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${mobileHistoryOpen ? 'translate-x-0 shadow-2xl p-4' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conversations
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="primary"
                size="xs"
                onClick={handleNewChat}
                className="gap-1 text-[11px] font-bold"
                startIcon={<Plus className="w-3 h-3" />}
              >
                New Chat
              </Button>
              <button
                onClick={() => setMobileHistoryOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left">
            {loadingConversations ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No conversations yet. Ask a question to start.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileHistoryOpen(false);
                  }}
                  className={`
                    group p-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-start justify-between gap-2
                    ${
                      activeConvId === conv.id
                        ? 'bg-bharat-900 text-white shadow-sm dark:bg-bharat-800'
                        : 'bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate leading-snug">
                      {conv.title}
                    </div>
                    {conv.last_message && (
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          activeConvId === conv.id ? 'text-bharat-200' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {conv.last_message}
                      </p>
                    )}
                    {conv.product_name && (
                      <span
                        className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded mt-1 ${
                          activeConvId === conv.id
                            ? 'bg-bharat-800 text-bharat-100'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {conv.product_name}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition-opacity flex-shrink-0 ${
                      activeConvId === conv.id ? 'text-bharat-300' : ''
                    }`}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Backdrop for Mobile History */}
        {mobileHistoryOpen && (
          <div
            onClick={() => setMobileHistoryOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          />
        )}

        {/* Center Column: Chat Thread & Input */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 text-left">
            {messages.length === 0 && !loadingMessages && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-bharat-50 dark:bg-slate-800 text-bharat-800 dark:text-bharat-300 flex items-center justify-center border border-bharat-200 dark:border-slate-700 shadow-sm">
                  <Sparkles className="w-7 h-7 text-saffron-500 animate-pulse" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ask BharatStandards AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Search standards, evaluate uploaded test reports, understand statutory verification clauses, and address compliance gaps.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="w-full max-w-lg pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Suggested Inquiries
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(productContext?.suggested_prompts || defaultPrompts).map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(prompt)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-bharat-500 hover:bg-bharat-50/50 dark:hover:bg-slate-800/80 transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message Thread */}
            {messages.map((m, mIdx) => {
              const isUser = m.role === 'USER';
              return (
                <div
                  key={m.id || mIdx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-bharat-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4 text-saffron-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5 text-xs space-y-3.5 shadow-sm ${
                      isUser
                        ? 'bg-bharat-900 text-white rounded-tr-none'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                    }`}
                  >
                    {/* Top Metadata in Assistant Message */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700 pb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-bharat-900 dark:text-bharat-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Grounded Standards Analysis</span>
                          </div>

                          {m.confidence && (
                            <span
                              title={m.confidence_guidance || m.confidence_reason || `Confidence: ${m.confidence}`}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase border cursor-help ${
                                m.confidence === 'HIGH'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : m.confidence === 'MEDIUM'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {m.confidence === 'HIGH' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {m.confidence === 'MEDIUM' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              {m.confidence === 'LOW' && <HelpCircle className="w-3 h-3 text-rose-500" />}
                              <span>{m.confidence} Confidence</span>
                            </span>
                          )}
                        </div>

                        {/* Message Toolbar: Copy & Retry */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.content, m.id || mIdx)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[10px]"
                            title="Copy response markdown"
                          >
                            {copiedId === (m.id || mIdx) ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500 font-semibold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRetry(mIdx)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[10px]"
                            title="Retry inquiry"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content Rendering */}
                    <div className="space-y-2">
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed font-normal">{m.content}</p>
                      ) : (
                        renderFormattedContent(m.content)
                      )}
                    </div>

                    {/* Inline Evidence & Citations Pills */}
                    {!isUser && ((m.citations && m.citations.length > 0) || (m.sources && m.sources.length > 0)) && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Cited Evidence ({(m.citations || m.sources).length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(m.citations || m.sources).map((cit, cIdx) => {
                            const isDoc = cit.source_type === 'DOCUMENT' || cit.source_type === 'DOCUMENT_CHUNK';
                            const targetRoute = cit.target_route || (isDoc ? `/documents/${cit.source_id || ''}` : `/standards/${cit.source_id || ''}`);
                            return (
                              <Link
                                key={cIdx}
                                to={targetRoute}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-bharat-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors shadow-xs group"
                              >
                                <span className="font-mono text-[10px] text-slate-400 font-bold">[{cIdx + 1}]</span>
                                <span className="truncate max-w-[170px]">{cit.citation_label || cit.standard_number || cit.title}</span>
                                {cit.clause && <span className="text-slate-400 text-[10px]">Cl. {cit.clause}</span>}
                                {cit.is_demo ? (
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 uppercase">Demo</span>
                                ) : (
                                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">Verified</span>
                                )}
                                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-bharat-600" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recommended Actionable Next Steps */}
                    {!isUser && m.actions && m.actions.length > 0 ? (
                      <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 space-y-2">
                        <strong className="block font-bold uppercase tracking-wider text-[10px] text-indigo-900 dark:text-indigo-300">
                          Recommended Actionable Next Steps
                        </strong>
                        <div className="flex flex-wrap gap-2">
                          {m.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => navigate(act.route)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 text-xs font-semibold shadow-xs transition-colors"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      !isUser && m.recommended_actions && m.recommended_actions.length > 0 && (
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
                          <strong className="block font-bold uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-400">
                            Recommended Actionable Next Steps
                          </strong>
                          <ul className="space-y-1 list-disc list-inside">
                            {m.recommended_actions.map((act, aIdx) => (
                              <li key={aIdx} className="leading-snug">
                                {act}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}

                    {/* Disclaimer & Message Footer */}
                    {!isUser && (
                      <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                        <span className="italic">
                          {m.disclaimer || 'AI-assisted informational guidance. Not an official BIS legal determination.'}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {m.latency_ms && (
                            <span className="font-mono text-[9px] text-slate-400">{m.latency_ms}ms</span>
                          )}
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* User message timestamp */}
                    {isUser && (
                      <div className="text-right text-[10px] text-bharat-200 pt-0.5">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-bharat-900 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4 text-saffron-400 animate-spin" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 text-xs space-y-2 max-w-sm">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-saffron-500 animate-pulse" />
                    <span>Searching standards & analyzing evidence...</span>
                  </div>
                  <Skeleton className="h-3 w-48 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips (Above Input) */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
              Quick:
            </span>
            {(productContext?.suggested_prompts || defaultPrompts).slice(0, 4).map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSend(prompt)}
                disabled={isSending}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-bharat-500 hover:bg-bharat-50/60 dark:hover:bg-slate-800/80 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2.5">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about Indian Standards, verification clauses, test report evidence, or open compliance gaps..."
                disabled={isSending}
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bharat-500 resize-none max-h-32"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSend()}
              disabled={isSending || !inputQuery.trim()}
              className="h-9 px-4 rounded-xl shadow-sm text-xs font-bold gap-1.5 flex-shrink-0"
              endIcon={<Send className="w-3.5 h-3.5" />}
            >
              <span>Send</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Sources & Evidence Panel (Desktop) & Drawer (Mobile) */}
        <div
          className={`
            fixed lg:static inset-y-0 right-0 z-40 w-80 lg:w-72 xl:w-80 bg-white dark:bg-slate-900 lg:bg-transparent
            flex flex-col border-l lg:border-l border-slate-200 dark:border-slate-800 pl-0 lg:pl-4 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${mobileSourcesOpen ? 'translate-x-0 shadow-2xl p-4' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Layers className="w-4 h-4 text-bharat-700 dark:text-bharat-400" />
              <span>Sources & Evidence</span>
            </div>
            <button
              onClick={() => setMobileSourcesOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-left">
            {/* Active Product Summary Card */}
            {productContext && (
              <Card className="border-bharat-200 dark:border-slate-700 bg-bharat-50/40 dark:bg-slate-800/40">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-bharat-800 dark:text-bharat-300 uppercase tracking-wider">
                      Selected Product
                    </span>
                    <Badge variant="primary" size="sm">
                      {productContext.category}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {productContext.name}
                  </h4>
                  {productContext.compliance_summary && (
                    <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-500">Readiness Score:</span>
                      <span className="font-mono font-bold text-bharat-800 dark:text-bharat-300">
                        {productContext.compliance_summary.score}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Retrieved Sources List */}
            {activeSources.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <FileText className="w-6 h-6 mx-auto opacity-50 text-slate-400" />
                <p>No active sources cited yet. Ask a question to see verified standard references and evidence citations.</p>
              </div>
            ) : (
              activeSources.map((source, sIdx) => {
                const isDoc = source.source_type === 'DOCUMENT' || source.source_type === 'DOCUMENT_CHUNK';
                const linkHref = isDoc
                  ? `/documents/${source.source_id || ''}`
                  : `/standards/${source.source_id || ''}`;

                return (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            isDoc
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {source.source_type}
                        </span>
                        {source.is_demo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 uppercase">
                            DEMO DATA
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        {Math.round(source.relevance_score * 100)}% Match
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                      {source.title}
                    </h5>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {source.clause && (
                        <div>
                          <strong>Clause:</strong> {source.clause}
                        </div>
                      )}
                      {source.page && (
                        <div>
                          <strong>Page:</strong> {source.page}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-100 dark:border-slate-800 line-clamp-4 leading-relaxed">
                      "{source.snippet}"
                    </p>

                    <div className="pt-1 flex items-center justify-end">
                      <Link
                        to={linkHref}
                        className="text-[11px] font-semibold text-bharat-700 dark:text-bharat-300 hover:underline flex items-center gap-1"
                      >
                        <span>Open {isDoc ? 'Document' : 'Standard'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Backdrop for Mobile Sources */}
        {mobileSourcesOpen && (
          <div
            onClick={() => setMobileSourcesOpen(false)}
            className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          />
        )}
      </div>
    </div>
  );
};
