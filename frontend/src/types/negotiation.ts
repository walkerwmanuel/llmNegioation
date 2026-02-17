export interface Negotiation {
  id: number;
  topic: string;
  negotiation_type: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  negotiation_id: number;
  role: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
  original_content?: string | null;
}

export interface NegotiationWithMessages extends Negotiation {
  messages: Message[];
}
