import toast, { Toast, ToastPosition } from 'react-hot-toast';

interface NotificationOptions {
  duration?: number;
  position?: ToastPosition;
}

export const notify = {
  success: (message: string, options?: NotificationOptions) => {
    return toast.success(message, {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        border: '1px solid #00F3FF',
        boxShadow: '0 0 12px rgba(0, 243, 255, 0.333)',
      },
      iconTheme: {
        primary: '#00F3FF',
        secondary: '#1A1A1A',
      },
      duration: options?.duration,
      position: options?.position,
    });
  },

  error: (message: string, options?: NotificationOptions) => {
    return toast.error(message, {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        border: '1px solid #FF0033',
        boxShadow: '0 0 12px rgba(255, 0, 51, 0.333)',
      },
      iconTheme: {
        primary: '#FF0033',
        secondary: '#1A1A1A',
      },
      duration: options?.duration,
      position: options?.position,
    });
  },

  loading: (message: string, options?: NotificationOptions) => {
    return toast.loading(message, {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        border: '1px solid #00F3FF',
        boxShadow: '0 0 12px rgba(0, 243, 255, 0.333)',
      },
      duration: options?.duration,
      position: options?.position,
    });
  },

  dismiss: (toastId: Toast['id']) => {
    toast.dismiss(toastId);
  },
};
