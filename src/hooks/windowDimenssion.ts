import React, { useContext, useMemo, useRef } from "react";

type CallbackType = (parms: { width: number; height: number }) => void;

type WindowDimensionContext = {
  subscribeForResize: (name: string, cb: CallbackType) => void;
  unsubscribeForResize: (name: string) => void;
  notifyOnResize: (params: { width: number; height: number }) => void;
};

export const windowDimensionContext =
  React.createContext<WindowDimensionContext>({} as WindowDimensionContext);

export const useWindowDimesionContext = () => {
  const context = useContext(windowDimensionContext);
  return context;
};

export const useWindowDimen = () => {
  const callbacks = useRef<{ [name: string]: CallbackType }>({});
  const subscribe = (name: string, cb: CallbackType) => {
    callbacks.current[name] = cb;
  };

  const throttledCallback = useMemo(() => {
    let timerId: any = null;
    return (callback: any, ...args: any) => {
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        callback(...args);
      }, 100);
    };
  }, []);

  const unsubscribe = (name: string) => {
    delete callbacks.current[name];
  };

  const throttledNotify = (params: { width: number; height: number }) => {
    const callbackArr = Object.values(callbacks.current);
    callbackArr.forEach((callback) => callback(params));
  };

  const notifyAll = (params: { width: number; height: number }) => {
    throttledCallback(throttledNotify, params);
  };

  return {
    subscribeForResize: subscribe,
    unsubscribeForResize: unsubscribe,
    notifyOnResize: notifyAll,
  };
};
