export const topbarButton = {
  bold: { value: "bold", label: "Bold" },
  italic: { value: "italic", label: "Italic" },
  underLine: { value: "underLine", label: "Under Line" },
  heading: { value: "heading", label: "Heading" },
  justifyLeft: { value: "justifyLeft", label: "Justify Left" },
  justifyRight: { value: "justifyRight", label: "Justify Right" },
  justifyCenter: { value: "justifyCenter", label: "Justify Center" },
  justifyFull: { value: "justifyFull", label: "Justify Full" },
  orderedList: { value: "orderedList", label: "Ordered List" },
  unorderedList: { value: "unorderedList", label: "Unordered List" },
  emoji: { value: "emoji", label: "Insert Emoji" },
  link: { value: "link", label: "Insert Link" },
  unlink: { value: "unlink", label: "Remove Link" },
} as const;

export type TopbarButtonKeys = keyof typeof topbarButton;

export const topbarButtonTuple = new Set(Object.keys(topbarButton));
export const elementInlineStyle: { [name in TopbarButtonKeys]?: string } = {
  [topbarButton.bold.value]: "font-weight:bold;",
  [topbarButton.italic.value]: "font-style: italic;",
  [topbarButton.underLine.value]: "text-decoration-line: underline;",
  [topbarButton.justifyLeft.value]: "text-align: left;",
  [topbarButton.justifyRight.value]: "text-align: right;",
  [topbarButton.justifyCenter.value]: "text-align: center;",
  [topbarButton.justifyFull.value]: "text-align: justify;",
} as const;

export const textSelectEventName: (keyof HTMLElementEventMap)[] = [
  "touchend",
  "mouseup",
  "selectionchange",
] as const;

type DefaultTopbarButtonSelectFunc<T> = (buttonName: TopbarButtonKeys) => T;
type DefaultMutliTopbarButtonSelectFunc<T> = (
  buttonName: TopbarButtonKeys[]
) => T;
export type TopbarButtonSelectFunc = {
  add: DefaultTopbarButtonSelectFunc<void>;
  remove: DefaultTopbarButtonSelectFunc<void>;
  toggle: DefaultTopbarButtonSelectFunc<void>;
  isSelected: DefaultTopbarButtonSelectFunc<boolean>;
  multiAdd: DefaultMutliTopbarButtonSelectFunc<void>;
  clear: () => void;
};

export type ElementInlineStyleKeys = keyof typeof elementInlineStyle;

export const inlineStyle = new Set([
  topbarButton.bold.value,
  topbarButton.italic.value,
  topbarButton.underLine.value,
]);

export const blockStyle = new Set([
  topbarButton.justifyLeft.value,
  topbarButton.justifyRight.value,
  topbarButton.justifyCenter.value,
  topbarButton.justifyFull.value,
]);

export const listStyle = new Set([
  topbarButton.orderedList.value,
  topbarButton.unorderedList.value,
]);

export const headerStyle = new Set([topbarButton.heading.value]);
