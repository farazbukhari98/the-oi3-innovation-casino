export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  department: string;
  deviceId: string;
  registeredAt: number;
  playerAvatar?: string;
  layer1Completed?: boolean;
  layer2Completed?: boolean;
  layer1Selection?: string;
  layer1SubmittedAt?: number;
  layer2SubmittedAt?: number;
}

export type Department = string;
