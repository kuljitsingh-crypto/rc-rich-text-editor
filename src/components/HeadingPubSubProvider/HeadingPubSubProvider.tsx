import React, { PropsWithChildren, useRef } from "react";
import { HeadingPubSubContext, useHeadingPubSub } from "../../hooks";

export function HeadingPubsubProvider({ children }: PropsWithChildren) {
  const pubSub = useHeadingPubSub();
  return (
    <HeadingPubSubContext.Provider value={{ ...pubSub }}>
      {children}
    </HeadingPubSubContext.Provider>
  );
}
