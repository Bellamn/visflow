import { Store } from 'vuex';

interface ErrorResponse {
  message: string;
  response?: {
    data: string;
    status: number;
  };
}

type Error = ErrorResponse | string;

export const errorMessage = (err: Error): string => {
  if (typeof err === 'string') {
    return err;
  }
  if (err.response && err.response.status === 404) {
    return '404 not found';
  }
  return (err.response && err.response.data) || err.message;
};

export const showSystemMessage = (store: Store<{}>, text: string, type: string, duration?: number) => {
  store.commit('message/showMessage', {
    text,
    class: type,
    duration,
  });
};

export const clearSystemMessage = (store: Store<{}>) => {
  store.commit('message/closeMessage');
};

/** Displays an error message using the system message popup. */
export const systemMessageErrorHandler = (store: Store<{}>) => {
  return (err: Error) => {
    showSystemMessage(store, errorMessage(err), 'error');
  };
};