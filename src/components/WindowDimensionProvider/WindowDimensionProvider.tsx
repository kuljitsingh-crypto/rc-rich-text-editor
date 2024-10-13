import React, { PropsWithChildren } from "react";
import { useWindowDimen, windowDimensionContext } from "../../hooks";

export function WindowDimensionProvider({ children }: PropsWithChildren) {
  const value = useWindowDimen();
  return (
    <windowDimensionContext.Provider value={value}>
      {children}
    </windowDimensionContext.Provider>
  );
}
