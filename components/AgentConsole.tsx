'use client';

import { useCallback, useRef, useState } from 'react';
import type { AgentMessage, MemoryEntry } from '@/lib/types';

const initialMemory: MemoryEntry[] = [
  {
    id: 'seed-vision',
    content: 'Default focus: produce actionable strategies with measurable outcomes.',
    tags: ['foundation'],
    createdAt: new Date().toISOString(),
  strength: 0.8
  }
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export function AgentConsole() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>(initialMemory);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const submitPrompt = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!prompt.trim() || isProcessing) {
        return;
      }

      const userMessage: AgentMessage = {
        id: generateId(),
        role: 'user',
        content: prompt.trim()
      };

      setMessages(current => [...current, userMessage]);
      setPrompt('');
      setIsProcessing(true);

      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            memory
          })
        });

        if (!response.ok) {
          throw new Error('Agent call failed');
        }

        const { reply, updatedMemory } = (await response.json()) as {
          reply: AgentMessage;
          updatedMemory: MemoryEntry[];
        };

        setMessages(current => [...current, reply]);
        setMemory(updatedMemory);
      } catch (error) {
        const failure: AgentMessage = {
          id: generateId(),
          role: 'agent',
          content: 'The agent hit an unexpected issue while processing the request. Please retry with a simpler description.'
        };
        setMessages(current => [...current, failure]);
        console.error(error);
      } finally {
        setIsProcessing(false);
        textareaRef.current?.focus();
      }
    },
    [prompt, isProcessing, memory]
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-6 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-semibold text-slate-100">Agentic Command Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Deploy an autonomous operator that synthesizes plans, highlights risks, and tracks durable insights from every instruction.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex h-full flex-col gap-4">
          <div className="flex-1 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 shadow-xl backdrop-blur">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
                    <span className="text-sm uppercase tracking-[0.3em] text-slate-500">No threads yet</span>
                    <p className="max-w-sm text-sm text-slate-300">
                      Describe an initiative. The agent will orchestrate a structured response with plans, analysis, and durable memory updates.
                    </p>
                  </div>
                ) : (
                  <ol className="flex flex-col gap-4">
                    {messages.map(message => (
                      <li
                        key={message.id}
                        className={`rounded-2xl border border-[var(--border)] p-5 ${
                          message.role === 'agent' ? 'bg-slate-900/70 text-slate-100' : 'bg-indigo-500/10 text-slate-200'
                        }`}
                      >
                        <span className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                          {message.role === 'agent' ? 'Agent Reflection' : 'Directive'}
                        </span>
                        <p className="text-sm leading-relaxed text-slate-200">{message.content}</p>

                        {message.plan && message.plan.length > 0 && (
                          <div className="mt-4 rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Plan</p>
                            <ul className="mt-2 flex flex-col gap-1 text-sm text-indigo-100">
                              {message.plan.map(step => (
                                <li key={step} className="list-disc pl-4">
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {message.analysis && (
                          <div className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Analysis</p>
                            <p className="mt-2 text-sm text-cyan-100">{message.analysis}</p>
                          </div>
                        )}

                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-4 grid gap-3">
                            {message.actions.map(action => (
                              <article key={action.title} className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">{action.title}</p>
                                  <span className="text-xs text-emerald-100/70">{Math.round(action.confidence * 100)}% confidence</span>
                                </div>
                                <p className="mt-2 text-sm text-emerald-100">{action.description}</p>
                              </article>
                            ))}
                          </div>
                        )}

                        {message.reflections && message.reflections.length > 0 && (
                          <div className="mt-4 rounded-xl border border-slate-500/40 bg-slate-800/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">Reflections</p>
                            <ul className="mt-2 flex flex-col gap-2 text-sm text-slate-200/90">
                              {message.reflections.map(item => (
                                <li key={item} className="list-disc pl-4">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <form onSubmit={submitPrompt} className="border-t border-[var(--border)] bg-slate-900/80 p-4">
                <div className="rounded-2xl border border-indigo-500/30 bg-black/20 p-3 shadow-inner">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={event => setPrompt(event.target.value)}
                    onKeyDown={event => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        const form = event.currentTarget.form;
                        if (form) {
                          event.preventDefault();
                          form.requestSubmit();
                        }
                      }
                    }}
                    placeholder="Walk the agent through the initiative, including constraints, metrics, and any hard requirements."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-transparent bg-transparent text-sm text-slate-200 outline-none focus:border-indigo-400"
                    disabled={isProcessing}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {isProcessing ? 'Agent synthesizing response…' : 'Press ⌘ + Enter to deploy a directive.'}
                    </span>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="rounded-full bg-indigo-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
                    >
                      {isProcessing ? 'Processing' : 'Deploy Agent'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <aside className="flex h-full flex-col gap-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-xl backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">Cognitive Memory</h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-slate-200/90">
              {memory.map(entry => (
                <li key={entry.id} className="rounded-2xl border border-slate-600/40 bg-slate-900/60 p-3">
                  <p className="text-indigo-100">{entry.content}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{entry.tags.join(', ')}</span>
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 p-5 shadow-xl backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">Operating Notes</h2>
            <ul className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
              <li>Agent grounds decisions around measurable success metrics.</li>
              <li>Memories persist across directives to strengthen context.</li>
              <li>Confidence values highlight action certainty.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
