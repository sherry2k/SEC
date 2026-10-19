// Save as: components/MessagesClient.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Send, Check, CheckCheck, ChevronLeft } from "lucide-react";
import { uaeDateKey, formatUaeTime } from "@/lib/attendance";
import type { DirectoryEntry } from "@/lib/messages";

type ThreadMessage = {
  id: string;
  body: string;
  senderId: number;
  createdAt: string;
  seenAt: string | null;
  fromMe: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarStyle(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return { background: `linear-gradient(135deg, hsl(${hash} 55% 42%), hsl(${(hash + 36) % 360} 55% 32%))` };
}

function roleLabel(role: string) {
  if (role === "master_admin") return "Master Admin";
  if (role === "admin") return "Admin";
  if (role === "finance") return "Finance";
  return "Staff";
}

function dayLabel(dateStr: string, todayKey: string, yesterdayKey: string) {
  const d = new Date(dateStr);
  const key = uaeDateKey(d);
  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export default function MessagesClient({
  currentUser,
  initialDirectory,
}: {
  currentUser: { id: number; name: string };
  initialDirectory: DirectoryEntry[];
}) {
  const [directory, setDirectory] = useState<DirectoryEntry[]>(initialDirectory);
  const [query, setQuery] = useState("");
  const [activeUserId, setActiveUserId] = useState<number | null>(initialDirectory[0]?.userId ?? null);
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(false);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshDirectory = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/people", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setDirectory(data.people);
    } catch {
      // Silent — next poll retries.
    }
  }, []);

  const loadThread = useCallback(async (userId: number, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/${userId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setThread(data.messages);
    } catch {
      // Silent — next poll retries.
    } finally {
      if (!opts?.silent) setLoadingThread(false);
    }
  }, []);

  // Poll the directory for new messages/unread counts.
  useEffect(() => {
    const id = setInterval(refreshDirectory, 6000);
    return () => clearInterval(id);
  }, [refreshDirectory]);

  // Load + poll the open thread; the GET itself marks it seen server-side.
  useEffect(() => {
    if (activeUserId === null) return;
    loadThread(activeUserId);
    const id = setInterval(() => loadThread(activeUserId, { silent: true }), 3000);
    return () => clearInterval(id);
  }, [activeUserId, loadThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const activePerson = directory.find((p) => p.userId === activeUserId) ?? null;

  function selectPerson(userId: number) {
    setActiveUserId(userId);
    setShowThreadOnMobile(true);
  }

  async function submitDraft() {
    const text = draft.trim();
    if (!text || activeUserId === null || sending) return;

    setSending(true);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const optimistic: ThreadMessage = {
      id: `pending-${Date.now()}`,
      body: text,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      seenAt: null,
      fromMe: true,
    };
    setThread((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/messages/${activeUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setThread((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
      } else {
        setThread((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    } catch {
      setThread((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
      refreshDirectory();
    }
  }

  const filtered = directory.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  const todayKey = uaeDateKey(new Date());
  const yesterdayKey = uaeDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  let lastDay = "";

  return (
    <div className="flex h-[calc(100vh-150px)] min-h-[480px] overflow-hidden rounded-lg border border-[var(--sec-line)] bg-white">
      {/* Conversation list */}
      <aside
        className={`w-full flex-col border-r border-[var(--sec-line)] sm:w-72 sm:flex-none sm:flex ${
          showThreadOnMobile ? "hidden" : "flex"
        }`}
      >
        <div className="flex-none px-4 pb-2.5 pt-4">
          <h1 className="text-[17px] font-bold text-[var(--sec-ink)]">Messages</h1>
          <label className="mt-2.5 flex items-center gap-2 rounded-md border border-[var(--sec-line)] px-2.5 py-1.5 text-[var(--sec-muted)]">
            <Search size={14} className="shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people"
              className="w-full bg-transparent text-[13px] text-[var(--sec-ink)] outline-none placeholder:text-[var(--sec-muted)]"
            />
          </label>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {filtered.map((p) => (
            <button
              key={p.userId}
              onClick={() => selectPerson(p.userId)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors ${
                p.userId === activeUserId ? "bg-[var(--sec-blue)]/10" : "hover:bg-black/[0.03]"
              }`}
            >
              <span
                style={avatarStyle(p.name)}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
              >
                {initials(p.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-1.5">
                  <span className="truncate text-[13.5px] font-semibold text-[var(--sec-ink)]">{p.name}</span>
                  {p.lastMessageAt && (
                    <span className="flex-none text-[11px] text-[var(--sec-muted)]">
                      {formatUaeTime(new Date(p.lastMessageAt))}
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-between gap-1.5">
                  <span className="truncate text-[12.5px] text-[var(--sec-muted)]">
                    {p.lastMessage ? `${p.lastMessageFromMe ? "You: " : ""}${p.lastMessage}` : "No messages yet"}
                  </span>
                  {p.unreadCount > 0 && (
                    <span className="flex h-[18px] min-w-[18px] flex-none items-center justify-center rounded-full bg-amber-500 px-1 text-[10.5px] font-semibold text-white">
                      {p.unreadCount}
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-[var(--sec-muted)]">No one matches that search.</p>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`min-w-0 flex-1 flex-col sm:flex ${showThreadOnMobile ? "flex" : "hidden"}`}>
        {activePerson ? (
          <>
            <header className="flex flex-none items-center gap-2.5 border-b border-[var(--sec-line)] px-4 py-3">
              <button
                onClick={() => setShowThreadOnMobile(false)}
                className="-ml-1 p-1 text-[var(--sec-muted)] sm:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft size={18} />
              </button>
              <span
                style={avatarStyle(activePerson.name)}
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
              >
                {initials(activePerson.name)}
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold text-[var(--sec-ink)]">{activePerson.name}</p>
              </span>
              <span className="flex-none rounded-md bg-[var(--sec-blue)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--sec-blue)]">
                {roleLabel(activePerson.role)}
              </span>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {loadingThread && thread.length === 0 && (
                <p className="text-center text-[13px] text-[var(--sec-muted)]">Loading…</p>
              )}
              {thread.map((m) => {
                const label = dayLabel(m.createdAt, todayKey, yesterdayKey);
                const showDivider = label !== lastDay;
                lastDay = label;
                return (
                  <div key={m.id}>
                    {showDivider && (
                      <div className="my-2 flex justify-center">
                        <span className="rounded-full bg-black/[0.04] px-3 py-1 text-[11px] text-[var(--sec-muted)]">
                          {label}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                      <div className={`flex max-w-[62%] flex-col gap-1 ${m.fromMe ? "items-end" : "items-start"}`}>
                        <span
                          className={`rounded-2xl px-3 py-2 text-[13.5px] leading-snug ${
                            m.fromMe
                              ? "rounded-br-[4px] bg-[var(--sec-blue)] text-white"
                              : "rounded-bl-[4px] bg-black/[0.04] text-[var(--sec-ink)]"
                          }`}
                        >
                          {m.body}
                        </span>
                        <span className="flex items-center gap-1 px-1 text-[10.5px] text-[var(--sec-muted)]">
                          {formatUaeTime(new Date(m.createdAt))}
                          {m.fromMe &&
                            (m.seenAt ? (
                              <span className="flex items-center gap-0.5 text-emerald-600">
                                <CheckCheck size={12} /> Seen
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <Check size={12} /> Sent
                              </span>
                            ))}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitDraft();
              }}
              className="flex flex-none items-end gap-2.5 border-t border-[var(--sec-line)] px-3.5 py-3"
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitDraft();
                  }
                }}
                rows={1}
                placeholder="Write a message"
                className="max-h-[110px] flex-1 resize-none rounded-md border border-[var(--sec-line)] bg-[color:var(--sec-bg,#f5f7fa)] px-3 py-2 text-[13.5px] text-[var(--sec-ink)] outline-none focus:border-[var(--sec-blue)]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-md bg-[var(--sec-blue)] text-white disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex h-full flex-1 items-center justify-center text-[13px] text-[var(--sec-muted)]">
            Select someone to start messaging.
          </div>
        )}
      </section>
    </div>
  );
}
