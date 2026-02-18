import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { createNegotiation, getNegotiation, addMessage } from '../api/negotiations';
import type { Message, NegotiationWithMessages } from '../types/negotiation';

export function useNegotiationSession() {
  const { isAuthenticated } = useAuth();
  const [currentNegotiationId, setCurrentNegotiationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track the latest request to handle race conditions
  const loadRequestIdRef = useRef(0);

  const startNewNegotiation = useCallback(
    async (topic: string, negotiation_type: string) => {
      if (!isAuthenticated) {
        setCurrentNegotiationId(null);
        setMessages([]);
        return null;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const negotiation = await createNegotiation(topic, negotiation_type);
        setCurrentNegotiationId(negotiation.id);
        setMessages([]);
        return negotiation.id;
      } catch (error) {
        console.error('Failed to start negotiation:', error);
        setLoadError('Failed to start negotiation. Please try again.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated]
  );

  const loadNegotiation = useCallback(
    async (id: number): Promise<NegotiationWithMessages | null> => {
      // Increment request ID to track this specific request
      const requestId = ++loadRequestIdRef.current;
      console.log(`[loadNegotiation] Starting load for negotiation_id=${id}, requestId=${requestId}, isAuthenticated=${isAuthenticated}`);

      if (!isAuthenticated) {
        console.warn(`[loadNegotiation] Aborting: user not authenticated`);
        return null;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        console.log(`[loadNegotiation] Fetching negotiation_id=${id} from API...`);
        const negotiation: NegotiationWithMessages = await getNegotiation(id);

        // Check if this request is still the latest one (race condition protection)
        if (requestId !== loadRequestIdRef.current) {
          console.log(`[loadNegotiation] Discarding stale response for negotiation_id=${id}, requestId=${requestId} (current=${loadRequestIdRef.current})`);
          return null;
        }

        console.log(`[loadNegotiation] Success: loaded negotiation_id=${negotiation.id} with ${negotiation.messages?.length ?? 0} messages`);

        // Ensure messages array exists and is valid
        const safeMessages = Array.isArray(negotiation.messages) ? negotiation.messages : [];

        setCurrentNegotiationId(negotiation.id);
        setMessages(safeMessages);
        return { ...negotiation, messages: safeMessages };
      } catch (error: any) {
        // Check if this request is still the latest one
        if (requestId !== loadRequestIdRef.current) {
          console.log(`[loadNegotiation] Discarding stale error for negotiation_id=${id}`);
          return null;
        }

        const errorMessage = error?.message || 'Unknown error';
        console.error(`[loadNegotiation] FAILED for negotiation_id=${id}:`, {
          message: errorMessage,
          error,
        });
        setLoadError(`Failed to load negotiation (ID: ${id}). ${errorMessage}`);
        return null;
      } finally {
        // Only clear loading state if this is still the latest request
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(false);
        }
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
    setLoadError(null);
  }, []);

  const clearError = useCallback(() => {
    setLoadError(null);
  }, []);

  return {
    currentNegotiationId,
    messages,
    isLoading,
    loadError,
    startNewNegotiation,
    loadNegotiation,
    saveMessage,
    clearSession,
    clearError,
  };
}
