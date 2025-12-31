import { NextResponse } from 'next/server';
import { runAgent } from '@/lib/agent';
import type { AgentInput, MemoryEntry } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AgentInput> & { memory?: MemoryEntry[] };
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const memory = Array.isArray(body.memory) ? body.memory : [];
    const result = runAgent({ message, memory });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent execution failed', error);
    return NextResponse.json({ error: 'Agent execution failed.' }, { status: 500 });
  }
}
