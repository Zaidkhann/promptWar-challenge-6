import React from "react";

interface MarkdownMessageProps {
  content: string;
}

/**
 * Lightweight, safe parser for assistant response markdown formatting.
 * Handles bolding, code spans, lists, headers, and line breaks without unsafe HTML injection.
 */
export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const lines = content.split("\n");

  const renderInline = (text: string): React.ReactNode[] => {
    // Split by bold (**bold**) and inline code (`code`)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const tokens = text.split(regex);

    tokens.forEach((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={idx} className="font-bold text-slate-900 dark:text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={idx}
            className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-cyan-800 dark:text-cyan-300 border border-slate-200 dark:border-slate-700"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token) {
        parts.push(<span key={idx}>{token}</span>);
      }
    });

    return parts;
  };

  const elements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`list_${elements.length}`} className="list-decimal pl-5 space-y-1 my-2">
            {currentListItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list_${elements.length}`} className="list-disc pl-5 space-y-1 my-2">
            {currentListItems}
          </ul>
        );
      }
      currentListItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      elements.push(<div key={`empty_${idx}`} className="h-2" />);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4_${idx}`} className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3_${idx}`} className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    // Bullet List
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      currentListItems.push(
        <li key={`li_${idx}`} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {renderInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Numbered List (e.g. "1. ")
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!isNumberedList) flushList();
      isNumberedList = true;
      currentListItems.push(
        <li key={`li_${idx}`} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {renderInline(numMatch[2])}
        </li>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p_${idx}`} className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 my-1">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-0.5 text-xs text-slate-800 dark:text-slate-200">{elements}</div>;
}
