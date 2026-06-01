import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAI';
import DiagnosticPanel from './DiagnosticPanel';

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useAIChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Asistente de Mantenimiento</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTab('chat')}
                className={cn(
                  'p-1 rounded text-white/70 hover:text-white hover:bg-blue-500',
                  tab === 'chat' && 'text-white bg-blue-500'
                )}
                title="Chat"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTab('diagnose')}
                className={cn(
                  'p-1 rounded text-white/70 hover:text-white hover:bg-blue-500',
                  tab === 'diagnose' && 'text-white bg-blue-500'
                )}
                title="Diagnóstico"
              >
                <Wrench className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-white/70 hover:text-white hover:bg-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {tab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[400px]">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Pregúntame sobre equipos,</p>
                    <p>historial de mantenimiento,</p>
                    <p>o diagnósticos.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-2 text-sm',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <Bot className="h-6 w-6 mt-1 text-blue-600 shrink-0" />
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <User className="h-6 w-6 mt-1 text-slate-600 shrink-0" />
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 text-sm">
                    <Bot className="h-6 w-6 mt-1 text-blue-600 shrink-0" />
                    <div className="bg-slate-100 rounded-lg px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={loading}
                  className="text-sm"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          )}

          {tab === 'diagnose' && <DiagnosticPanel />}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all"
        title="Asistente AI"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
