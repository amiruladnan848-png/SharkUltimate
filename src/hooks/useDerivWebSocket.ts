import { useState, useEffect, useRef, useCallback } from 'react';
import { TickData, ConnectionStatus } from '@/types/trading';

const DERIV_APP_ID = '1089';
const WS_URL = `wss://ws.binaryws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
const MAX_HISTORY = 300;
const RECONNECT_DELAY = 3000;
const PING_INTERVAL = 25000;

interface UseDerivWebSocketReturn {
  ticks: Record<string, TickData>;
  connectionStatus: ConnectionStatus;
  subscribeTick: (symbol: string) => void;
  unsubscribeTick: (symbol: string) => void;
  priceHistory: Record<string, number[]>;
}

export const useDerivWebSocket = (): UseDerivWebSocketReturn => {
  const [ticks, setTicks] = useState<Record<string, TickData>>({});
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false, lastPing: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbols = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTime = useRef<number>(0);
  const isUnmounted = useRef(false);
  const reconnectAttempts = useRef(0);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
  }, []);

  const connect = useCallback(() => {
    if (isUnmounted.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log('[SharkWS] Connecting to Deriv API...');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmounted.current) return;
      reconnectAttempts.current = 0;
      console.log('[SharkWS] Connected');
      setConnectionStatus({ connected: true, lastPing: Date.now(), latency: 0 });

      // Re-subscribe all symbols
      subscribedSymbols.current.forEach(symbol => {
        ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
      });

      clearTimers();
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          pingTime.current = Date.now();
          ws.send(JSON.stringify({ ping: 1 }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      if (isUnmounted.current) return;
      try {
        const data = JSON.parse(event.data);

        if (data.msg_type === 'pong') {
          const latency = Date.now() - pingTime.current;
          setConnectionStatus(prev => ({ ...prev, lastPing: Date.now(), latency }));
          return;
        }

        if (data.msg_type === 'tick' && data.tick) {
          const tick = data.tick;
          const tickData: TickData = {
            symbol: tick.symbol,
            price: parseFloat(tick.quote),
            timestamp: (tick.epoch || Math.floor(Date.now() / 1000)) * 1000,
            bid: tick.bid ? parseFloat(tick.bid) : undefined,
            ask: tick.ask ? parseFloat(tick.ask) : undefined,
          };

          setTicks(prev => ({ ...prev, [tick.symbol]: tickData }));
          setPriceHistory(prev => {
            const history = prev[tick.symbol] || [];
            const newHistory = [...history, tickData.price];
            if (newHistory.length > MAX_HISTORY) newHistory.splice(0, newHistory.length - MAX_HISTORY);
            return { ...prev, [tick.symbol]: newHistory };
          });
        }

        if (data.error) {
          console.warn('[SharkWS] API Error:', data.error.message);
        }
      } catch (e) {
        console.error('[SharkWS] Parse error:', e);
      }
    };

    ws.onerror = () => {
      if (isUnmounted.current) return;
      setConnectionStatus(prev => ({ ...prev, connected: false, error: 'Connection error' }));
    };

    ws.onclose = () => {
      if (isUnmounted.current) return;
      clearTimers();
      setConnectionStatus(prev => ({ ...prev, connected: false }));
      reconnectAttempts.current++;
      const delay = Math.min(RECONNECT_DELAY * Math.pow(1.5, Math.min(reconnectAttempts.current, 5)), 30000);
      console.log(`[SharkWS] Disconnected. Reconnect in ${delay}ms`);
      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, [clearTimers]);

  useEffect(() => {
    isUnmounted.current = false;
    connect();
    return () => {
      isUnmounted.current = true;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  const subscribeTick = useCallback((symbol: string) => {
    if (subscribedSymbols.current.has(symbol)) return;
    subscribedSymbols.current.add(symbol);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
  }, []);

  const unsubscribeTick = useCallback((symbol: string) => {
    subscribedSymbols.current.delete(symbol);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ forget_all: 'ticks' }));
      // Re-subscribe remaining symbols
      subscribedSymbols.current.forEach(s => {
        wsRef.current?.send(JSON.stringify({ ticks: s, subscribe: 1 }));
      });
    }
  }, []);

  return { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory };
};
