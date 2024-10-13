import React, { useRef } from "react";
import { TopbarButtonKeys, TopbarButtonSelectFunc } from "../constant";

export const useTopbarSelectedButtons = () => {
  const topbarSelectedButtons = useRef<Set<TopbarButtonKeys>>(new Set());
  const toggleTopbarButton: TopbarButtonSelectFunc["toggle"] = (
    buttonName: TopbarButtonKeys
  ) => {
    if (topbarSelectedButtons.current.has(buttonName)) {
      topbarSelectedButtons.current.delete(buttonName);
    } else {
      topbarSelectedButtons.current.add(buttonName);
    }
  };

  const removeTopbarButton: TopbarButtonSelectFunc["remove"] = (
    buttonName: TopbarButtonKeys
  ) => {
    topbarSelectedButtons.current.delete(buttonName);
  };

  const addTopbarButton: TopbarButtonSelectFunc["add"] = (
    buttonName: TopbarButtonKeys
  ) => {
    topbarSelectedButtons.current.add(buttonName);
  };

  const addMultiTopbarButton: TopbarButtonSelectFunc["multiAdd"] = (
    buttonNames: TopbarButtonKeys[]
  ) => {
    buttonNames.forEach((name) => topbarSelectedButtons.current.add(name));
  };

  const isTopbarButtonSelected: TopbarButtonSelectFunc["isSelected"] = (
    buttonName: TopbarButtonKeys
  ) => {
    return topbarSelectedButtons.current.has(buttonName);
  };

  const clearTopbarButtonSelection: TopbarButtonSelectFunc["clear"] = () => {
    topbarSelectedButtons.current.clear();
  };

  return {
    isTopbarButtonSelected,
    toggleTopbarButton,
    addTopbarButton,
    removeTopbarButton,
    addMultiTopbarButton,
    clearTopbarButtonSelection,
    topbarSelectedButtons: topbarSelectedButtons.current,
  };
};
