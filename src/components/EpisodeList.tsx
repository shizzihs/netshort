import { Link } from 'react-router-dom';

interface Episode {
  episodeId?: string;
  shortPlayEpisodeId?: string;
  episodeNo?: number;
  isLock?: boolean;
  locked?: boolean;
  isVip?: boolean;
}

interface EpisodeListProps {
  shortPlayId: string;
  episodes: Episode[];
  currentEpisodeId?: string;
}

export default function EpisodeList({ shortPlayId, episodes, currentEpisodeId }: EpisodeListProps) {
  if (!episodes || episodes.length === 0) {
    return <div style={{ color: '#999' }}>Khong co tap nao</div>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {episodes.map((ep, index) => {
        const epId = ep.episodeId || ep.shortPlayEpisodeId || String(index + 1);
        const epNo = ep.episodeNo ?? (index + 1);
        const isLocked = ep.isLock ?? ep.locked ?? false;
        const isCurrent = currentEpisodeId === epId;

        return (
          <Link
            key={epId}
            to={`/watch/${shortPlayId}/${epId}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 8,
              background: isCurrent ? '#4f46e5' : '#f5f5f5',
              color: isCurrent ? '#fff' : isLocked ? '#ccc' : '#333',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
              border: isCurrent ? 'none' : '1px solid #eee',
            }}
          >
            {epNo}
            {isLocked && !isCurrent && (
              <span style={{ fontSize: 10, marginLeft: 2 }}>🔒</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
