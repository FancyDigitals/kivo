'use client';

import React from 'react';

/**
 * Bulletproof WhatsApp Text Formatter.
 * Guaranteed 0 raw asterisks on screen.
 * Converts *bold* or **bold** into <strong> tags and strips rogue asterisks and dashes.
 */
export default function FormattedWhatsAppMessage({ text }) {
  if (!text) return null;

  // 1. Clean em-dashes and bullet hyphens
  let cleanText = text.replace(/[\u2014\u2013]/g, ', ');
  cleanText = cleanText.replace(/^[ \t]*[-–—][ \t]*/gm, '');

  const lines = cleanText.split('\n');

  return (
    <span className="space-y-1.5 block">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <span key={lineIdx} className="block h-2" />;
        }

        // Regex matches *text* or **text**
        const regex = /(\*\*|\*)(.*?)\1/g;
        const elements = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(line)) !== null) {
          // Push plain text prior to match
          if (match.index > lastIndex) {
            elements.push(line.substring(lastIndex, match.index));
          }
          
          // Push clean <strong> element
          const boldText = match[2];
          if (boldText) {
            elements.push(
              <strong key={`${lineIdx}-${match.index}`} className="font-extrabold text-slate-950">
                {boldText.replace(/\*/g, '')}
              </strong>
            );
          }
          lastIndex = regex.lastIndex;
        }

        // Push remaining text after last match
        if (lastIndex < line.length) {
          elements.push(line.substring(lastIndex));
        }

        // Strip any rogue/unmatched asterisks from string fragments
        const sanitizedElements = elements.map((item, idx) => {
          if (typeof item === 'string') {
            return item.replace(/\*/g, '');
          }
          return item;
        });

        return (
          <span key={lineIdx} className="block leading-relaxed">
            {sanitizedElements}
          </span>
        );
      })}
    </span>
  );
}