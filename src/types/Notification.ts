export type Notification = {
  id: string;
  type: 'transfer' | 'receipt' | 'info';
  title: string;
  message: string;
  transferId?: string;
  fromBranch?: string;
  toBranch?: string;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
};