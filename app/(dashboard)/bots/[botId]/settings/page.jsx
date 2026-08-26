'use client';
import { use } from 'react';
import { redirect } from 'next/navigation';

export default function BotSettingsRedirect({ params }) {
  const unwrappedParams = use(params);
  redirect(`/bots/${unwrappedParams.botId}/customize`);
}