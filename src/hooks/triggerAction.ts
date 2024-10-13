import { useState } from "react";

export const useTriggerAction = () => {
  const [triggerAction, setTriggerAction] = useState(0);

  const enableTriggerAction = () => {
    setTriggerAction((triggerAction) => triggerAction + 1);
  };

  return { triggerAction, enableTriggerAction };
};
