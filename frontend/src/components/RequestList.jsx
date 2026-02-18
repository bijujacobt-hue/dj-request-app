import RequestCard from './RequestCard';

export default function RequestList({ requests, guestId, onVoteChanged, onDelete }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg">No requests yet</p>
        <p className="text-sm mt-1">Be the first to request a song!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request, index) => (
        <div key={request.id} className="flex items-center gap-3">
          <span className="text-slate-600 text-sm font-mono w-7 text-right shrink-0 tabular-nums">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <RequestCard
              request={request}
              guestId={guestId}
              onVoteChanged={onVoteChanged}
              onDelete={onDelete}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
