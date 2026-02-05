import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createNegotiation, getNegotiation, addMessage } from '../api/negotiations';
import { Message, NegotiationWithMessages } from '../types/negotiation';

export function useNegotiationSession() {
  const { isAuthenticated } = useAuth();
  const [currentNegotiationId, setCurrentNegotiationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const startNewNegotiation = useCallback(
    async (topic: string, negotiation_type: string) => {
      if (!isAuthenticated) {
        setCurrentNegotiationId(null);
        setMessages([]);
        return null;
      }

      setIsLoading(true);
      try {
        const negotiation = await createNegotiation(topic, negotiation_type);
        setCurrentNegotiationId(negotiation.id);
        setMessages([]);
        return negotiation.id;
      } catch (error) {
        console.error('Failed to start negotiation:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const loadNegotiation = useCallback(
    async (id: number) => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const negotiation: NegotiationWithMessages = await getNegotiation(id);
        setCurrentNegotiationId(negotiation.id);
        setMessages(negotiation.messages);
      } catch (error) {
        console.error('Failed to load negotiation:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const saveMessage = useCallback(
    async (role: string, content: string) => {
      if (!isAuthenticated || !currentNegotiationId) {
        // Still add to local messages even if not authenticated
        const localMessage: Message = {
          id: Date.now(),
          negotiation_id: 0,
          role,
          content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, localMessage]);
        return localMessage;
      }

      try {
        const message = await addMessage(currentNegotiationId, role, content);
        setMessages((prev) => [...prev, message]);
        return message;
      } catch (error) {
        console.error('Failed to save message:', error);
        // Still add to local state even if API fails
        const localMessage: Message = {
          id: Date.now(),
          negotiation_id: currentNegotiationId,
          role,
          content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, localMessage]);
        return localMessage;
      }
    },
    [isAuthenticated, currentNegotiationId]
  );

  const clearSession = useCallback(() => {
    setCurrentNegotiationId(null);
    setMessages([]);
  }, []);

  return {
    currentNegotiationId,
    messages,
    isLoading,
    startNewNegotiation,
    loadNegotiation,
    saveMessage,
    clearSession,
  };
}
