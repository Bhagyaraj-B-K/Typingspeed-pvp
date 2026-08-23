import { useEffect, useRef, useState } from 'react';

export default function ChatPanel({ messages, onSend, username }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  }

  return (
    <div className="chat-panel">
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && <div className="chat-empty">Room activity will show up here.</div>}
        {messages.map((m) => {
          const isChat = m.text.includes(': ');
          const isMe = isChat && m.text.startsWith(`${username}: `);
          return (
            <div key={m.id} className={`chat-line ${isChat ? 'chat-line-msg' : 'chat-line-system'} ${isMe ? 'chat-line-me' : ''}`}>
              {m.text}
            </div>
          );
        })}
      </div>
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-ghost">
          Send
        </button>
      </form>
    </div>
  );
}
