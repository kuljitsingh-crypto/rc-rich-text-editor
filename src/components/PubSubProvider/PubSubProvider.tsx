import React, { PropsWithChildren, useRef } from "react";
import { PubsubContext, usePubSub } from "../../hooks";

function PubSubProvider({ children }: PropsWithChildren) {
  const pubSub = usePubSub();
  return (
    <PubsubContext.Provider value={{ ...pubSub }}>
      {children}
    </PubsubContext.Provider>
  );
}

export default PubSubProvider;
