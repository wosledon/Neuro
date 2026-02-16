import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export interface SystemStatus {
  cpuUsage: number;
  memoryUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  storageUsage: number;
  storageUsed: number;
  storageTotal: number;
  uptime: string;
  timestamp: string;
}

interface UseSystemStatusSignalROptions {
  onStatusUpdate?: (status: SystemStatus) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export function useSystemStatusSignalR(options: UseSystemStatusSignalROptions = {}) {
  const { onStatusUpdate, onError, autoConnect = true } = options;
  
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    const API_BASE_URL = import.meta.env.DEV 
      ? ''  // 开发环境使用相对路径
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5146');

    // 从 localStorage 获取 token
    const token = localStorage.getItem('access_token');

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/system-status`, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= maxReconnectAttempts) {
            return null; // 停止重连
          }
          // 指数退避：1s, 2s, 4s, 8s, 16s
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .configureLogging(import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
      .build();

    // 监听系统状态更新
    newConnection.on('SystemStatusUpdated', (newStatus: SystemStatus) => {
      setStatus(newStatus);
      onStatusUpdate?.(newStatus);
      reconnectAttempts.current = 0; // 重置重连计数
    });

    // 监听错误
    newConnection.on('SystemStatusError', (errorMessage: string) => {
      const err = new Error(errorMessage);
      setError(err);
      onError?.(err);
    });

    // 连接状态变化
    newConnection.onreconnecting((error) => {
      console.warn('SignalR 正在重连...', error);
      setIsConnected(false);
      reconnectAttempts.current++;
    });

    newConnection.onreconnected((connectionId) => {
      console.log('SignalR 已重连, ConnectionId:', connectionId);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    newConnection.onclose((error) => {
      console.log('SignalR 连接已关闭', error);
      setIsConnected(false);
    });

    try {
      await newConnection.start();
      console.log('SignalR 连接成功');
      setIsConnected(true);
      setConnection(newConnection);
      reconnectAttempts.current = 0;
    } catch (err) {
      console.error('SignalR 连接失败:', err);
      const error = err instanceof Error ? err : new Error('连接失败');
      setError(error);
      onError?.(error);
    }
  }, [onStatusUpdate, onError]);

  const disconnect = useCallback(async () => {
    if (connection) {
      await connection.stop();
      setConnection(null);
      setIsConnected(false);
    }
  }, [connection]);

  const requestStatus = useCallback(async () => {
    if (connection && isConnected) {
      await connection.invoke('RequestSystemStatus');
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
    status,
    isConnected,
    error,
    connect,
    disconnect,
    requestStatus
  };
}
