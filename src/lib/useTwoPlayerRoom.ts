import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type PlayerPoint = { x: number; y: number; z: number; rotation: number };
type PlayerMessage = PlayerPoint & { playerId: string };

export function useTwoPlayerRoom(roomCode: string) {
  const [connected, setConnected] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const partnerPosition = useRef<PlayerPoint | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const playerId = useRef(crypto.randomUUID());

  useEffect(() => {
    const code = roomCode.trim().toUpperCase();
    if (!code) { setConnected(false); setPartnerOnline(false); partnerPosition.current = null; return; }
    const channel = supabase.channel(`tower-room-${code}`, { config: { presence: { key: playerId.current } } });
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'player' }, ({ payload }) => {
        const message = payload as PlayerMessage;
        if (message.playerId !== playerId.current) { partnerPosition.current = message; setPartnerOnline(true); }
      })
      .on('presence', { event: 'sync' }, () => setPartnerOnline(Object.keys(channel.presenceState()).some((id) => id !== playerId.current)))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') { setConnected(true); await channel.track({ joinedAt: Date.now() }); }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnected(false);
      });
    return () => { channelRef.current = null; partnerPosition.current = null; setPartnerOnline(false); void supabase.removeChannel(channel); };
  }, [roomCode]);

  const sendPosition = useCallback((point: PlayerPoint) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'player', payload: { ...point, playerId: playerId.current } satisfies PlayerMessage });
  }, []);

  return { connected, partnerOnline, partnerPosition, sendPosition };
}
