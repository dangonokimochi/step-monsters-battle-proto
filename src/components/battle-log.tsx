import { useEffect, useRef } from 'react';
import type { BattleLog } from '../types';
import './battle-log.css';

interface BattleLogPanelProps {
  logs: BattleLog[];
}

function logClass(type: BattleLog['type']): string {
  switch (type) {
    case 'damage':
      return 'log-damage';
    case 'heal':
      return 'log-heal';
    case 'miss':
      return 'log-miss';
    case 'kill':
      return 'log-kill';
    default:
      return 'log-info';
  }
}

export function BattleLogPanel({ logs }: BattleLogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="battle-log">
      <h3 className="log-title">戦闘ログ</h3>
      <div className="log-list">
        {logs.map((log) => (
          <div key={log.id} className={`log-entry ${logClass(log.type)}`}>
            {log.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
