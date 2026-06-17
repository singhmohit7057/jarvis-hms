
import { toast } from 'sonner';

interface ToastMessages {
  loading: string;
  success: string;
  error: string;
}

interface UseToastReturn {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  promise: <T>(promise: Promise<T>, messages: ToastMessages) => Promise<T>;
}

/**
 * Typed convenience wrapper around sonner's toast API.
 * Returns stable methods that can be called without importing sonner directly.
 */
export function useToast(): UseToastReturn {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
    promise: <T>(promise: Promise<T>, messages: ToastMessages): Promise<T> => {
      // sonner returns a special object; we unwrap to plain Promise via the original promise
      toast.promise(promise, messages);
      return promise;
    },
  };
}
