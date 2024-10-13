import React, { act, useContext, useRef } from "react";
import { TopbarButtonKeys } from "../constant";
import { getStyleType } from "../utills";

type PubSubType = {
  [name: string]: (status: boolean) => void;
};

type ActiveSubscribeType = "inline" | "block" | "list";

type activeSubscriber = {
  [name in ActiveSubscribeType]: Set<TopbarButtonKeys>;
};
export const usePubSub = () => {
  const pubsubList = useRef<PubSubType>({});
  const activeSubscribers = useRef<activeSubscriber>({
    inline: new Set(),
    block: new Set(),
    list: new Set(),
  });

  const addOrRemoveSubscriber = (
    subscribeRef: Set<TopbarButtonKeys>,
    name: TopbarButtonKeys,
    status: boolean
  ) => {
    if (status) {
      subscribeRef.add(name);
    } else {
      subscribeRef.delete(name);
    }
  };

  const updateSusciberStatus = (name: TopbarButtonKeys, status: boolean) => {
    if (!name) return;
    const type = getStyleType(name);
    if (type.isInlineStyle) {
      addOrRemoveSubscriber(activeSubscribers.current.inline, name, status);
    } else if (type.isBlockStyle) {
      addOrRemoveSubscriber(activeSubscribers.current.block, name, status);
    } else if (type.isListStyle) {
      addOrRemoveSubscriber(activeSubscribers.current.list, name, status);
    }
  };

  const subscribe = (params: {
    name: string;
    subscribeCb: (status: boolean) => void;
  }) => {
    const { name, subscribeCb } = params;
    pubsubList.current[name] = subscribeCb;
  };

  const unsubscribe = (name: string) => {
    delete pubsubList.current[name];
  };

  const notifySelected = (params: { [name: string]: boolean }) => {
    const entries = Object.entries(params || {});
    for (let entry of entries) {
      const [key, status] = entry;
      pubsubList.current[key]?.(status);
      updateSusciberStatus(key as TopbarButtonKeys, status);
    }
  };

  const notifyAll = (status: boolean) => {
    for (let key in pubsubList.current) {
      pubsubList.current[key]?.(status);
      updateSusciberStatus(key as TopbarButtonKeys, status);
    }
  };

  const notifySelectedWithSelectStatus = (names: string[]) => {
    for (let name of names) {
      pubsubList.current[name]?.(true);
      updateSusciberStatus(name as TopbarButtonKeys, true);
    }
  };

  const notifySelectedWithUnselectStatus = (names: string[]) => {
    for (let name of names) {
      pubsubList.current[name]?.(false);
      updateSusciberStatus(name as TopbarButtonKeys, false);
    }
  };

  const getActiveSubscribers = (
    type: ActiveSubscribeType
  ): TopbarButtonKeys[] => {
    if (!type) return [];
    return Array.from(activeSubscribers.current?.[type] || []);
  };

  return {
    subscribe,
    unsubscribe,
    notifySelected,
    notifyAll,
    notifySelectedWithUnselectStatus,
    notifySelectedWithSelectStatus,
    getActiveSubscribers,
    updateSusciberStatus,
  };
};

type PubsubReturnType = typeof usePubSub;

export const PubsubContext = React.createContext<ReturnType<PubsubReturnType>>(
  {} as any
);

export const usePubSubContext = () => {
  const context = useContext(PubsubContext);
  return context;
};
