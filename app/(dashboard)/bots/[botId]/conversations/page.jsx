'use client';
import { redirect } from 'next/navigation';

export default function BotConversationsRedirect() {
  redirect('/inbox');
}