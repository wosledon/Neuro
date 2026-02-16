import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export interface ChatSource {
  content: string;
  score: number;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  isStreaming?: boolean;
}

interface UseChatSignalROptions {
  onAnswerChunk?: (chunk: string) => void;
  onAnswerComplete?: (sources: ChatSource[]) => void;
  onSearchComplete?: (data: { count: number; sources: ChatSource[] }) => void;
  onError?: (error: string) => void;
  autoConnect?: boolean;
}

export function useChatSignalR(options: UseChatSignalROptions = {}) {
  const { 
    onAnswerChunk, 
    onAnswerComplete, 
    onSearchComplete,
    onError, 
    autoConnect = true 
  } = options;
  
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    const API_BASE_URL = import.meta.env.DEV 
      ? ''
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5146');

    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= maxReconnectAttempts) {
            return null;
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
      .build();

    // 监听搜索完成事件
    newConnection.on('SearchComplete', (data: { count: number; sources: ChatSource[] }) => {
      console.log('🔍 SearchComplete:', data);
      onSearchComplete?.(data);
    });

    // 监听回答片段
    newConnection.on('AnswerChunk', (chunk: string) => {
      console.log('📤 AnswerChunk:', chunk.substring(0, 50));
      onAnswerChunk?.(chunk);
    });

    // 监听回答完成
    newConnection.on('AnswerComplete', (data: { sources: ChatSource[] }) => {
      console.log('✅ AnswerComplete:', data);
      setIsStreaming(false);
      onAnswerComplete?.(data.sources);
    });

    // 监听错误
    newConnection.on('Error', (errorMessage: string) => {
      console.error('❌ Error:', errorMessage);
      setIsStreaming(false);
      setError(errorMessage);
      onError?.(errorMessage);
    });

    // 连接状态变化
    newConnection.onreconnecting((error) => {
      console.warn('Chat SignalR 正在重连...', error);
      setIsConnected(false);
      reconnectAttempts.current++;
    });

    newConnection.onreconnected((connectionId) => {
      console.log('Chat SignalR 已重连, ConnectionId:', connectionId);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newConnection.onclose((error) => {
      console.log('Chat SignalR 连接已关闭', error);
      setIsConnected(false);
      setIsStreaming(false);
    });

    try {
      await newConnection.start();
      console.log('Chat SignalR 连接成功');
      setIsConnected(true);
      setConnection(newConnection);
      reconnectAttempts.current = 0;
    } catch (err) {
      console.error('Chat SignalR 连接失败:', err);
      const errorMsg = err instanceof Error ? err.message : '连接失败';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onAnswerChunk, onAnswerComplete, onSearchComplete, onError]);

  const disconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
      setConnection(null);
      setIsConnected(false);
      setIsStreaming(false);
    }
  }, [connection]);

  const sendMessage = useCallback(async (question: string, topK?: number, sessionId?: string) => {
    if (!connection || !isConnected) {
      const errorMsg = '未连接到服务器';
      setError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    try {
      console.log('📨 发送消息:', { question, topK, sessionId });
      setIsStreaming(true);
      setError(null);
      await connection.invoke('StreamAsk', question, topK ?? 5, sessionId ?? '');
      console.log('✅ 消息发送成功');
      return true;
    } catch (err) {
      console.error('❌ 发送消息失败:', err);
      const errorMsg = err instanceof Error ? err.message : '发送失败';
      setError(errorMsg);
      setIsStreaming(false);
      onError?.(errorMsg);
      return false;
    }
  }, [connection, isConnected, onError]);

  const cancelStream = useCallback(async () => {
    if (connection) {
      try {
        await connection.stop();
        setIsStreaming(false);
        // 重新连接
        await connect();
      } catch (err) {
        console.error('取消流失败:', err);
      }
    }
  }, [connection, connect]);

  // 使用 ref 防止重复连接和清理
  const isConnecting = useRef(false);
  const hasCleanedUp = useRef(false);

  useEffect(() => {
    hasCleanedUp.current = false;
    
    if (autoConnect && !isConnecting.current) {
      isConnecting.current = true;
      connect().finally(() => {
        isConnecting.current = false;
      });
    }

    return () => {
      if (!hasCleanedUp.current) {
        hasCleanedUp.current = true;
        disconnect();
      }
    };
  }, [autoConnect]); // 只依赖 autoConnect，避免重复连接

  return {
    isConnected,
    isStreaming,
    error,
    connect,
    disconnect,
    sendMessage,
    cancelStream
  };
}
