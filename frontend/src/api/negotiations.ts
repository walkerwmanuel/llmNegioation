import { apiClient } from './client';
import type { Negotiation, NegotiationWithMessages, Message, NegotiationSettings } from '../types/negotiation';

export async function getNegotiations(): Promise<Negotiation[]> {
  const response = await apiClient.get<{ negotiations: Negotiation[] }>('/api/negotiations');
  return response.negotiations;
}

export async function getNegotiation(id: number): Promise<NegotiationWithMessages> {
  return apiClient.get<NegotiationWithMessages>(`/api/negotiations/${id}`);
}

export async function createNegotiation(
  topic: string,
  negotiation_type: string,
  settings?: NegotiationSettings
): Promise<Negotiation> {
  return apiClient.post<Negotiation>('/api/negotiations', { topic, negotiation_type, settings });
}

export async function updateNegotiationSettings(
  id: number,
  settings: NegotiationSettings
): Promise<Negotiation> {
  return apiClient.patch<Negotiation>(`/api/negotiations/${id}/settings`, { settings });
}

export async function deleteNegotiation(id: number): Promise<void> {
  await apiClient.delete(`/api/negotiations/${id}`);
}

export async function addMessage(
  negotiationId: number,
  role: string,
  content: string
): Promise<Message> {
  return apiClient.post<Message>(`/api/negotiations/${negotiationId}/messages`, { role, content });
}
