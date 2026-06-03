import { useState, useEffect, useRef, useCallback } from 'react';
import { TickData, ConnectionStatus } from '@/types/trading';

// Deriv API v3 — Enhanced for High Accuracy Signal Fusion
const DERIV_APP_ID = '1089';
const WS_URL = `wss://ws.binaryws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
const MAX_HISTORY = 500;   // More history = better accuracy
const RECONNECT_BASE = 2000;
const PING_INTERVAL = 20000;
const MAX_RECONNECT_ATTEMPTS = 20;

interface UseDerivWebSocketReturn {
  ticks: Record<string, TickData>;
  connectionStatus: ConnectionStatus;
  subscribeTick: (symbol: string) => void;
  unsubscribeTick: (symbol: string) => void;
  priceHistory: Record<string, number[]>;
  requestCandles: (symbol: string, count?: number) => void;
}

export const useDerivWebSocket = (): UseDerivWebSocketReturn => {
  const [ticks, setTicks] = useState<Record<string, TickData>>({});
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false, lastPing: 0, ticksReceived: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const subscribedSymbols = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTime = useRef<number>(0);
  const isUnmounted = useRef(false);
  const reconnectAttempts = useRef(0);
  const tickCount = useRef(0);

  const clearTimers = useCallback(() => {
    if (reconnectTimer.current) { clearTimeout(reconnectTimer.current); reconnectTimer.current = null; }
    if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
  }, []);

  const connect = useCallback(() => {
    if (isUnmounted.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    console.log('[SharkWS v5] Connecting to Deriv API...');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (isUnmounted.current) return;
      reconnectAttempts.current = 0;
      console.log('[SharkWS v5] Connected');
      setConnectionStatus(prev => ({ ...prev, connected: true, lastPing: Date.now(), latency: 0, error: undefined }));

      // Re-subscribe all active symbols
      subscribedSymbols.current.forEach(symbol => {
        ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
      });

      // Start heartbeat ping
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

        // ── Live tick data from Deriv WebSocket ──
        if (data.msg_type === 'tick' && data.tick) {
          const tick = data.tick;
          const tickData: TickData = {
            symbol: tick.symbol,
            price: parseFloat(tick.quote),
            timestamp: (tick.epoch || Math.floor(Date.now() / 1000)) * 1000,
            bid: tick.bid != null ? parseFloat(tick.bid) : undefined,
            ask: tick.ask != null ? parseFloat(tick.ask) : undefined,
          };

          tickCount.current++;
          setTicks(prev => ({ ...prev, [tick.symbol]: tickData }));

          // Build high-precision price history for signal engine
          setPriceHistory(prev => {
            const history = prev[tick.symbol] || [];
            const newHistory = [...history, tickData.price];
            // Keep last MAX_HISTORY ticks, remove oldest
            if (newHistory.length > MAX_HISTORY) newHistory.splice(0, newHistory.length - MAX_HISTORY);
            return { ...prev, [tick.symbol]: newHistory };
          });

          // Update tick counter every 10 ticks
          if (tickCount.current % 10 === 0) {
            setConnectionStatus(prev => ({ ...prev, ticksReceived: tickCount.current }));
          }
        }

        // ── Historical OHLC candles for better signal initialization ──
        if (data.msg_type === 'candles' && data.candles) {
          const candles: Array<{ close: string; epoch: number }> = data.candles;
          if (data.echo_req?.ticks_history) {
            const symbol = data.echo_req.ticks_history;
            const closePrices = candles.map(c => parseFloat(c.close)).filter(p => !isNaN(p));
            if (closePrices.length > 0) {
              setPriceHistory(prev => {
                const existing = prev[symbol] || [];
                // Merge: historical candles first, then live ticks
                const merged = [...closePrices, ...existing];
                const unique = Array.from(new Set(merged)).slice(-MAX_HISTORY);
                return { ...prev, [symbol]: unique };
              });
            }
          }
        }

        // ── Tick history fallback ──
        if (data.msg_type === 'history' && data.history) {
          if (data.echo_req?.ticks_history) {
            const symbol = data.echo_req.ticks_history;
            const prices: number[] = (data.history.prices || []).map((p: string) => parseFloat(p)).filter((p: number) => !isNaN(p));
            if (prices.length > 0) {
              setPriceHistory(prev => {
                const existing = prev[symbol] || [];
                const merged = [...prices, ...existing];
                return { ...prev, [symbol]: merged.slice(-MAX_HISTORY) };
              });
            }
          }
        }

        if (data.error) {
          console.warn('[SharkWS v5] API Error:', data.error.message, data.error.code);
          // Handle invalid symbol gracefully
          if (data.error.code === 'InvalidSymbol') {
            setConnectionStatus(prev => ({ ...prev, error: `Symbol error: ${data.error.message}` }));
          }
        }
      } catch (e) {
        console.error('[SharkWS v5] Parse error:', e);
      }
    };

    ws.onerror = () => {
      if (isUnmounted.current) return;
      setConnectionStatus(prev => ({ ...prev, connected: false, error: 'WebSocket connection error' }));
    };

    ws.onclose = (ev) => {
      if (isUnmounted.current) return;
      clearTimers();
      setConnectionStatus(prev => ({ ...prev, connected: false }));
      reconnectAttempts.current++;
      if (reconnectAttempts.current > MAX_RECONNECT_ATTEMPTS) {
        console.warn('[SharkWS v5] Max reconnect attempts reached');
        return;
      }
      const delay = Math.min(RECONNECT_BASE * Math.pow(1.4, Math.min(reconnectAttempts.current, 8)), 25000);
      console.log(`[SharkWS v5] Closed (${ev.code}). Reconnect in ${Math.round(delay)}ms (attempt ${reconnectAttempts.current})`);
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
      // Subscribe to live ticks
      wsRef.current.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
  }, []);

  const unsubscribeTick = useCallback((symbol: string) => {
    subscribedSymbols.current.delete(symbol);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ forget_all: 'ticks' }));
      // Re-subscribe remaining active symbols
      subscribedSymbols.current.forEach(s => {
        wsRef.current?.send(JSON.stringify({ ticks: s, subscribe: 1 }));
      });
    }
  }, []);

  // Request historical candle data for better accuracy initialization
  const requestCandles = useCallback((symbol: string, count = 200) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count,
        end: 'latest',
        granularity: 60,  // 1-minute candles to align with TradingView
        style: 'candles',
      }));
    }
  }, []);

  return { ticks, connectionStatus, subscribeTick, unsubscribeTick, priceHistory, requestCandles };
};
