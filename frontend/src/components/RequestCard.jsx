import { addVote, removeVote } from '../utils/api';

export default function RequestCard({ request, guestId, onVoteChanged, onDelete }) {
  const hasVoted = request.voters?.some(v => v.guest_id === guestId);
  const canDelete = onDelete && request.vote_count === 1 && hasVoted;

  const handleVote = async () => {
    try {
      if (hasVoted) {
        await removeVote(request.id, guestId);
      } else {
        await addVote(request.id, guestId);
      }
      onVoteChanged();
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleDelete = () => {
    if (!confirm('Remove your request?')) return;
    onDelete(request.id);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const voterNames = request.voters || [];
  const displayVoters = voterNames.slice(0, 2).map(v => v.display_name);
  const extraCount = voterNames.length - 2;

  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-700 overflow-hidden">
      {request.thumbnail_url && (
        <a href={request.source_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
          <img
            src={request.thumbnail_url}
            alt=""
            className="w-12 h-9 sm:w-16 sm:h-12 object-cover rounded"
          />
        </a>
      )}

      <div className="flex-1 min-w-0">
        {request.source_url ? (
          <a href={request.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white truncate block hover:text-purple-300 transition-colors">
            {request.title}
          </a>
        ) : (
          <p className="text-sm font-medium text-white truncate">{request.title}</p>
        )}
        {request.artist && (
          <p className="text-xs text-slate-400 truncate">{request.artist}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">
          {displayVoters.join(', ')}
          {extraCount > 0 && ` +${extraCount} more`}
          {request.duration_seconds && (
            <span className="ml-2 text-slate-600">{formatDuration(request.duration_seconds)}</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canDelete && (
          <button
            onClick={handleDelete}
            className="text-slate-600 hover:text-red-400 text-lg p-1 transition-colors"
            title="Remove your request"
          >
            &times;
          </button>
        )}
        <button
          onClick={handleVote}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[3rem] justify-center ${
            hasVoted
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <svg className="w-4 h-4" fill={hasVoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z M4 21h-1a2 2 0 01-2-2v-7a2 2 0 012-2h1" />
          </svg>
          {request.vote_count}
        </button>
      </div>
    </div>
  );
}
