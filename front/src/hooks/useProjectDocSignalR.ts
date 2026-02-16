import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export interface DocGenProgress {
  projectId: string;
  status: number;
  statusText: string;
  progress: number;
  message: string;
  lastDocGenAt?: string;
}

interface UseProjectDocSignalROptions {
  onProgress?: (progress: DocGenProgress) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export function useProjectDocSignalR(options: UseProjectDocSignalROptions = {}) {
  const { onProgress, onError, autoConnect = true } = options;
  
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    const API_BASE_URL = import.meta.env.DEV 
      ? ''
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5146');

    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/project-doc`, {
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

    // 监听文档生成进度
    newConnection.on('DocGenProgress', (progress: DocGenProgress) => {
      console.log('📨 收到文档生成进度:', progress);
      onProgress?.(progress);
    });

    // 连接状态变化
    newConnection.onreconnecting((error) => {
      console.warn('ProjectDoc SignalR 正在重连...', error);
      setIsConnected(false);
      reconnectAttempts.current++;
    });

    newConnection.onreconnected((connectionId) => {
      console.log('ProjectDoc SignalR 已重连, ConnectionId:', connectionId);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newConnection.onclose((error) => {
      console.log('ProjectDoc SignalR 连接已关闭', error);
      setIsConnected(false);
    });

    try {
      await newConnection.start();
      console.log('ProjectDoc SignalR 连接成功');
      setIsConnected(true);
      setConnection(newConnection);
      reconnectAttempts.current = 0;
    } catch (err) {
      console.error('ProjectDoc SignalR 连接失败:', err);
      const error = err instanceof Error ? err : new Error('连接失败');
      setError(error);
      onError?.(error);
    }
  }, [onProgress, onError]);

  const disconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
      setConnection(null);
      setIsConnected(false);
    }
  }, [connection]);

  const subscribeProject = useCallback(async (projectId: string) => {
    if (connection && isConnected) {
      await connection.invoke('SubscribeProject', projectId);
    }
  }, [connection, isConnected]);

  const unsubscribeProject = useCallback(async (projectId: string) => {
    if (connection && isConnected) {
      await connection.invoke('UnsubscribeProject', projectId);
    }
  }, [connection, isConnected]);

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
    error,
    connect,
    disconnect,
    subscribeProject,
    unsubscribeProject
  };
}
