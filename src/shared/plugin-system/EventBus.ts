/**
 * Simple EventBus for plugin communication
 * Enables async, decoupled communication between plugins
 */

import type { EventBus as IEventBus } from './types';

export class EventBus implements IEventBus {
  private listeners = new Map<string, Set<(data: any) => void>>();

  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  once(event: string, handler: (data: any) => void): void {
    const onceHandler = (data: any) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  // Utility method to clear all listeners (for testing/cleanup)
  clear(): void {
    this.listeners.clear();
  }

  // Debug method to see registered events
  getEvents(): string[] {
    return Array.from(this.listeners.keys());
  }
}