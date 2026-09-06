/**
 * BharatStandards AI - Assistant TypeScript Definitions
 * Type contracts for conversations, messages, evidence sources, and RAG copilot responses.
 */

export type ConfidenceLevelType = 'HIGH' | 'MEDIUM' | 'LOW';

export type SourceType = 'STANDARD' | 'REQUIREMENT' | 'DOCUMENT' | 'DOCUMENT_CHUNK';

export type MessageRoleType = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type QueryCategoryType =
  | 'STANDARD_DISCOVERY'
  | 'REQUIREMENT_EXPLANATION'
  | 'DOCUMENT_QUESTION'
  | 'COMPLIANCE_QUESTION'
  | 'BIS_SERVICE_GUIDANCE'
  | 'GENERAL';

export interface AssistantSource {
  id?: number;
  message_id?: number;
  source_type: SourceType;
  source_id?: string | null;
  title: string;
  page?: number | null;
  clause?: string | null;
  snippet: string;
  relevance_score: number;
  is_demo: boolean;
  created_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRoleType;
  content: string;
  confidence?: ConfidenceLevelType | null;
  recommended_actions?: string[];
  disclaimer?: string | null;
  created_at: string;
  sources?: AssistantSource[];
}

export interface Conversation {
  id: number;
  user_id: number;
  product_id?: number | null;
  product_name?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string | null;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface AssistantChatRequest {
  message: string;
  conversation_id?: number | null;
  product_id?: number | null;
}

export interface AssistantChatResponse {
  answer: string;
  confidence: ConfidenceLevelType;
  sources: AssistantSource[];
  recommended_actions: string[];
  disclaimer: string;
  conversation_id: number;
  message_id: number;
  is_demo: boolean;
}

export interface ComplianceSummaryBrief {
  score: number;
  status: string;
  passed_count: number;
  partial_count: number;
  missing_count: number;
  standard_number?: string;
}

export interface ProductContext {
  product_id: number;
  name: string;
  category: string;
  manufacturer?: string | null;
  model_number?: string | null;
  description?: string | null;
  technical_details?: string | null;
  compliance_summary?: ComplianceSummaryBrief | null;
  suggested_prompts: string[];
}
