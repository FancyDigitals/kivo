import { NextResponse } from 'next/server';
import { generateId } from '@/lib/utils/helpers';

const localAutomationsStore = new Map();

localAutomationsStore.set('auto_1', {
  id: 'auto_1',
  name: 'Keyword Trigger: Pricing Inquiry',
  trigger: 'when_message_contains',
  condition: 'price, pricing, cost, fee',
  action: 'search_catalog_and_reply',
  isActive: true,
  createdAt: new Date().toISOString(),
});

localAutomationsStore.set('auto_2', {
  id: 'auto_2',
  name: 'Human Handoff Alert',
  trigger: 'when_human_requested',
  condition: 'human, speak to person, manager',
  action: 'notify_team_and_switch_mode',
  isActive: true,
  createdAt: new Date().toISOString(),
});

export async function GET() {
  return NextResponse.json({ success: true, data: Array.from(localAutomationsStore.values()) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, trigger, condition, action } = body;

    const newRule = {
      id: generateId('auto'),
      name: name || 'New Workflow Rule',
      trigger: trigger || 'when_message_contains',
      condition: condition || '',
      action: action || 'send_message',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    localAutomationsStore.set(newRule.id, newRule);
    return NextResponse.json({ success: true, data: newRule });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}