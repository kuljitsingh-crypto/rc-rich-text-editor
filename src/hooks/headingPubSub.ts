import React, { useContext, useRef } from "react";

type HeadingCb = (tagName: string) => void;
type HeadingContext = {
  notifyHeaderCb: (tagName: string) => void;
  subscribeHeaderCb: (cb: HeadingCb) => void;
  unsubscribeHeaderSb: () => void;
};

export const HeadingPubSubContext = React.createContext<HeadingContext>(
  {} as HeadingContext
);

export const useHeadingPubSubContext = () => {
  const context = useContext(HeadingPubSubContext);
  return context;
};

export const useHeadingPubSub = () => {
  const headingCbRef = useRef<HeadingCb | null>(null);

  const notify = (tagName: string) => {
    headingCbRef.current?.(tagName);
  };

  const subscribe = (cb: HeadingCb) => {
    headingCbRef.current = cb;
  };

  const unsubscribe = () => {
    headingCbRef.current = null;
  };

  return {
    notifyHeaderCb: notify,
    subscribeHeaderCb: subscribe,
    unsubscribeHeaderSb: unsubscribe,
  };
};
