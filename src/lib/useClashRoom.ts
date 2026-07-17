import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { GameState, ItemKind, Side } from './game';

export type ClashRole = 'host' | 'guest';
export type ClashAction = { type: 'summon'; index: number; side: Side } | { type: 'item'; kind: ItemKind; side: Side } | { type: 'restart' };

export function useClashRoom(roomCode: string, role: ClashRole, onAction: (action: ClashAction) => void, onState: (game: GameState) => void) {
  const [connected, setConnected] = useState(false);
  const [opponentOnline, setOpponentOnline] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const actionRef = useRef(onAction); actionRef.current = onAction;
  const stateRef = useRef(onState); stateRef.current = onState;
  const playerId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!roomCode) return;
    const channel = supabase.channel(`clash-room-${roomCode}`, { config: { presence: { key: playerId.current } } });
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'action' }, ({ payload }) => { if (role === 'host') actionRef.current(payload as ClashAction); })
      .on('broadcast', { event: 'state' }, ({ payload }) => { if (role === 'guest') stateRef.current(payload as GameState); })
      .on('presence', { event: 'sync' }, () => setOpponentOnline(Object.keys(channel.presenceState()).some((id) => id !== playerId.current)))
      .subscribe(async (status) => {
        setConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') await channel.track({ role, joinedAt: Date.now() });
      });
    return () => { channelRef.current = null; setConnected(false); setOpponentOnline(false); void supabase.removeChannel(channel); };
  }, [roomCode, role]);

  const sendAction = useCallback((action: ClashAction) => void channelRef.current?.send({ type: 'broadcast', event: 'action', payload: action }), []);
  const sendState = useCallback((game: GameState) => void channelRef.current?.send({ type: 'broadcast', event: 'state', payload: game }), []);
  return { connected, opponentOnline, sendAction, sendState };
}
