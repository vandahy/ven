import { useToastStore, type ToastVariant } from '@/store/toastStore';

function show(message: string, variant: ToastVariant, durationMs?: number) {
  return useToastStore.getState().push({ message, variant, durationMs });
}

export const toast = {
  success: (message: string, durationMs?: number) => show(message, 'success', durationMs),
  error: (message: string, durationMs?: number) => show(message, 'error', durationMs),
  info: (message: string, durationMs?: number) => show(message, 'info', durationMs),
  dismiss: (id: number) => useToastStore.getState().dismiss(id),
};
