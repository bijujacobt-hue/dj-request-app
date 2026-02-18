import { useState } from 'react';

export default function EventClosed({ event }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ guest_name: '', contact_info: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, ...form })
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit:', err);
    }
  };

  return (
    <div className="min-h-screen ghibli-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-2">{event.name}</h1>
        <p className="text-slate-400 mb-8">This event has ended</p>

        {submitted ? (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <p className="text-green-400 font-medium">Thanks! Your message has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4 text-left">
            <p className="text-sm text-slate-400 text-center mb-4">Want to get in touch with the DJ?</p>
            <input
              type="text"
              placeholder="Your name"
              required
              value={form.guest_name}
              onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Email or phone"
              required
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <textarea
              placeholder="Message (optional)"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className="w-full bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Send Message
            </button>
          </form>
        )}

        {/* Footer */}
        {event.footer_text && (
          <div className="mt-8 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">{event.footer_text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
