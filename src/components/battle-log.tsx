import { useEffect, useRef } from 'react';
import type { BattleLog } from '../types';
import './battle-log.css';

interface BattleLogPanelProps {
  logs: BattleLog[];
}

function teamClass(team?: 'player' | 'enemy'): string {
  if (team === 'player') return 'log-team-player';
  if (team === 'enemy') return 'log-team-enemy';
  return '';
}

export function BattleLogPanel({ logs }: BattleLogPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="battle-log">
      <h3 className="log-title">戦闘ログ</h3>
      <div className="log-list" ref={listRef}>
        {logs.map((log) => (
          <div key={log.id} className={`log-entry ${teamClass(log.team)}`}>
            {log.team && (
              <span className={`log-team-tag ${log.team === 'player' ? 'tag-player' : 'tag-enemy'}`}>
                {log.team === 'player' ? '味方' : '敵'}
              </span>
            )}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
