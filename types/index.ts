export enum ReactorAIModel {
  REACTOR = "reactor-mk1"
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = "assistant" | "user";
