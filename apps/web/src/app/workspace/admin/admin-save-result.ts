export type AdminSaveResult = {
  status: 'idle' | 'success' | 'error';
  message: string;
  refresh?: boolean;
  fields?: Record<string, string>;
};
