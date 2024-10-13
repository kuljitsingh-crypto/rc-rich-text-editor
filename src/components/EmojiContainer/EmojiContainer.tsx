import React, { MutableRefObject, useRef, useState } from "react";
import { emojiCategories, EmojiCategory, emojis } from "./emojis";
import css from "./EmojiContainer.module.css";
import { classnames } from "../../utills";

const NEAREST_EMOJI_THRESHOLD = 0; // 10px

type EmojiContainerProps = {
  onEmojiSelect?: (emoji: string) => void;
  className?: string;
  inputRef?:
    | MutableRefObject<HTMLElement | null>
    | ((el: HTMLElement | null) => void);
};

type RefObject = {
  [key: string]: string;
};
function EmojiContainer(props: EmojiContainerProps) {
  const { onEmojiSelect, className, inputRef } = props;
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>("smileys");
  const categoryref = useRef<Record<string, HTMLElement>>({});
  const timeoutId = useRef<any | null>(null);
  const emojiPos = useRef<RefObject>({});
  const firstEmojiOffset = useRef(0);

  const selectEmojiCategory =
    (emojiName: EmojiCategory) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setEmojiCategory(emojiName);
      categoryref.current[emojiName]?.scrollIntoView({ behavior: "smooth" });
    };

  const selectEmoji =
    (emoji: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onEmojiSelect === "function") {
        onEmojiSelect(emoji);
      }
    };

  const addCateogryRef = (name: EmojiCategory) => (el: HTMLElement | null) => {
    if (!el) return;
    if (name === "smileys") {
      firstEmojiOffset.current = el.offsetTop;
    }
    const pos = name === "smileys" ? 0 : el.offsetTop;
    emojiPos.current[pos] = name;
    categoryref.current[name] = el;
  };

  const getClosestEmoji = (
    currentPos: number,
    refPositions: (number | string)[]
  ) => {
    let tempDiff,
      diff = Number.POSITIVE_INFINITY,
      pos = -1;
    for (let num of refPositions) {
      tempDiff = currentPos - (num as number) + NEAREST_EMOJI_THRESHOLD;
      if (tempDiff < 0) break;
      if (tempDiff < diff) {
        pos = num as number;
        diff = tempDiff;
      }
    }
    return emojiPos.current[pos];
  };

  const processScroll = (scrollPos: number) => {
    const nearestEmoji = getClosestEmoji(
      scrollPos + firstEmojiOffset.current,
      Object.keys(emojiPos.current)
    ) as EmojiCategory;
    if (nearestEmoji) {
      setEmojiCategory(nearestEmoji);
    }
  };

  const throttledEventHandler = (el: HTMLElement) => (e: Event) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      processScroll(el.scrollTop);
    }, 100);
  };

  const bottomContainerRefCb = (el: HTMLElement | null) => {
    if (!el) return;
    el.addEventListener("scroll", throttledEventHandler(el));
  };

  const refCb = (el: HTMLDivElement) => {
    if (!el || !inputRef) return;
    if (typeof inputRef === "function") {
      inputRef(el);
    } else {
      inputRef.current = el;
    }
  };

  const rootClass = classnames(css.root, className);
  return (
    <div className={rootClass} ref={refCb}>
      <div className={css.top}>
        {emojiCategories.map((emoji) => (
          <button
            key={emoji.value}
            onClick={selectEmojiCategory(emoji.value)}
            className={classnames(css.btnCategory, {
              [css.selectedButtonCategory]: emoji.value === emojiCategory,
            })}>
            {emoji.labelEmoji}
          </button>
        ))}
      </div>
      <div className={css.bottom} ref={bottomContainerRefCb}>
        {Object.values(emojis).map((emoji) => {
          return (
            <div
              key={emoji.value}
              className={css.btnLableValueContainer}
              ref={addCateogryRef(emoji.value)}>
              <label className={css.categoryName}>{emoji.label}</label>
              <div className={css.emojiContainer}>
                {emoji.emojis.map((e, index) => {
                  const name = `${emoji.value}-${index}`;
                  return (
                    <button
                      key={name}
                      name={name}
                      id={name}
                      aria-label={e}
                      onClick={selectEmoji(e)}
                      className={css.emojiBtn}>
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EmojiContainer;
