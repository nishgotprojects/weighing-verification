import { useEffect, useRef, useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { getChatbotResponse } from '@/services/mockServices';
import { ChatMessage } from '@/types';
import { Send, Bot, User, MessageCircle } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0', role: 'bot',
      content: 'Hello! I\'m the **Legal Metrology Assistant**. I can help you with questions about instrument verification, certificates, fees, the Legal Metrology Act, and more.\n\nWhat would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    const botResponse = getChatbotResponse(input);
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'bot', content: botResponse, timestamp: new Date() };
    setMessages(m => [...m, userMsg, botMsg]);
    setInput('');
  };

  const quickQuestions = ['How do I apply for verification?', 'How long is a certificate valid?', 'What is a serial number?', 'What are the fees?'];

  return (
    <Shell title="Legal Metrology Chatbot">
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--navy)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white' }}>Legal Metrology Assistant</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>AI-powered guidance on verification & compliance</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'bot' ? 'var(--navy)' : 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'bot' ? <Bot size={16} color="white" /> : <User size={16} color="white" />}
                </div>
                <div style={{
                  maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  background: msg.role === 'bot' ? '#f8fafc' : 'var(--blue)',
                  color: msg.role === 'bot' ? 'var(--text)' : 'white',
                  fontSize: '0.875rem', lineHeight: 1.6,
                  border: msg.role === 'bot' ? '1px solid var(--border)' : 'none',
                }}>
                  {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {quickQuestions.map(q => (
              <button key={q} className="btn btn-secondary btn-sm" onClick={() => { setInput(q); }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.625rem' }}>
            <input
              className="form-input" style={{ flex: 1 }}
              placeholder="Ask about verification, certificates, fees..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="btn btn-primary" onClick={send} disabled={!input.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
