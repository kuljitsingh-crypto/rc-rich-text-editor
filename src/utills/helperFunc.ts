import {
  blockStyle,
  elementInlineStyle,
  ElementInlineStyleKeys,
  headerStyle,
  inlineStyle,
  listStyle,
  topbarButton,
  TopbarButtonKeys,
} from "../constant";
import DOMPurify from "dompurify";

export const DATE_STYLE_ATTR_NAME = "data-stylenames";
export const ZERO_WIDTH_TEXT = "\u200B";
const hTags = ["h1", "h2", "h3", "h4", "h5", "h6"];
const blockElement: Set<string> = new Set(["p", "li", "div", ...hTags]);

type CreateRange = {
  startElement?: HTMLElement | Node;
  startOffset?: number;
  endElement?: HTMLElement | Node;
  endOffset?: number;
  startAfter?: Node | HTMLElement;
  endAfter?: Node | HTMLElement;
};

function getElementStyleAndDataAttribute(element: HTMLElement | null) {
  const dataAttr = element?.getAttribute(DATE_STYLE_ATTR_NAME) || "";
  const styleAttr = element?.getAttribute("style") || "";
  return { style: styleAttr, dataAttr: dataAttr };
}

function concactStyleNames({
  names,
  sourceName,
  targetName,
}: {
  names?: string[];
  sourceName?: string;
  targetName?: string;
}) {
  if (names?.length) {
    return names.join(",");
  } else if (sourceName && targetName) {
    return sourceName + "," + targetName;
  } else if (sourceName && !targetName) {
    return sourceName;
  } else if (!sourceName && targetName) {
    return targetName;
  }
  return "";
}

function splitStyleNames(name: string) {
  if (!name) return [];
  return name?.split(",") || [];
}

const createRegexForBtnNameRemv = (name: string) => {
  const regxStr = `(${name},|,${name}|${name})`;
  return new RegExp(regxStr, "g");
};

export function getTextSelection() {
  if (window && window.getSelection) {
    return window.getSelection();
  } else if (document && document.getSelection) {
    return document.getSelection();
  } else return null;
}

export function createDocumentElement(params: {
  name: keyof HTMLElementTagNameMap;
  textContent?: string;
  inlineStyle?: string;
  dataAttr?: { name: string; value: string };
}) {
  const { name, textContent, inlineStyle, dataAttr } = params;
  const element = document.createElement(name);
  if (textContent) {
    element.innerText = textContent;
  }
  if (inlineStyle) {
    element.setAttribute("style", inlineStyle);
  }
  if (dataAttr && dataAttr.value && dataAttr.name) {
    element.setAttribute(dataAttr.name, dataAttr.value);
  }
  return element;
}

export function createTextNode(textContent: string) {
  const textNode = document.createTextNode(textContent);
  return textNode;
}

export function getCurrentCursorContainer(selection: Selection | null) {
  if (selection === null || selection.anchorNode === null) return null;
  let currentCursorContainer: Node | null = null;
  if (selection.anchorNode.parentElement == undefined) {
    currentCursorContainer =
      selection.anchorNode.nodeType == Node.TEXT_NODE
        ? selection.anchorNode.parentNode
        : selection.anchorNode;
  } else {
    currentCursorContainer =
      selection.anchorNode.nodeType == Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;
  }
  return currentCursorContainer as HTMLElement | null;
}

export const getSelectionRangeAndContainer = () => {
  const selection = getTextSelection();
  const rangeCount = selection?.rangeCount ?? 0;
  const cursorContainer = getCurrentCursorContainer(selection);
  const range = rangeCount > 0 ? selection?.getRangeAt(0) : null;
  return { selection, range, cursorContainer };
};

export function getParentElement(
  element: HTMLElement | null,
  refElment?: HTMLElement | null,
  includeAnchorTag = false
): HTMLElement | null {
  let tag: HTMLElement | null = element,
    tagName = element?.nodeName.toLowerCase();
  while (
    tag !== null &&
    tag !== refElment &&
    !blockElement.has(tagName || "") &&
    (!includeAnchorTag || tagName !== "a")
  ) {
    tag = tag.parentElement;
    tagName = tag?.nodeName.toLowerCase();
  }
  return tag;
}

export function getAnchorParentTag(
  element: HTMLElement | null,
  refElment?: HTMLElement
): HTMLElement | null {
  let tag: HTMLElement | null = element,
    tagName = element?.nodeName.toLowerCase();
  while (
    tag !== null &&
    tag !== refElment &&
    !blockElement.has(tagName || "") &&
    tagName !== "a"
  ) {
    tag = tag.parentElement;
    tagName = tag?.nodeName.toLowerCase();
  }
  if (tagName === "a") return tag;
  return null;
}

export const createZeroWidthTextNode = () => {
  return createTextNode(ZERO_WIDTH_TEXT);
};

export const createAnchorNode = ({
  textContent,
  openInNewTab,
  url,
  style,
  dataAttr,
}: {
  textContent: string;
  openInNewTab?: boolean;
  url: string;
  style?: string;
  dataAttr?: { name: string; value: string };
}) => {
  const anchorElement = createDocumentElement({
    name: "a",
    inlineStyle: style,
    dataAttr,
  });
  anchorElement.appendChild(createTextNode(textContent));
  anchorElement.setAttribute("href", url);
  if (openInNewTab) {
    anchorElement.setAttribute("target", "_blank");
  }
  return anchorElement as HTMLAnchorElement;
};

export function getElementStyle() {
  let tag = getSelectionRangeAndContainer()
    .cursorContainer as HTMLElement | null;
  let tagName = tag?.nodeName.toLowerCase();
  const dataAttr: string[] = [];
  while (tag !== null && !blockElement.has(tagName || "")) {
    const attr = splitStyleNames(getElementStyleAndDataAttribute(tag).dataAttr);
    if (attr) {
      dataAttr.push(...attr);
    }
    if (tag.nodeName.toLowerCase() === "a") {
      dataAttr.push("link");
    }
    tag = tag.parentElement;
    tagName = tag?.nodeName.toLowerCase();
  }
  const attr = splitStyleNames(getElementStyleAndDataAttribute(tag).dataAttr);
  if (attr) {
    dataAttr.push(...attr);
  }
  const tagname = tag?.nodeName?.toLowerCase();

  if (tagname === "li") {
    const parentTagName = tag?.parentElement?.tagName?.toLowerCase();
    if (parentTagName === "ol") {
      dataAttr.push(topbarButton.orderedList.value);
    } else if (parentTagName === "ul") {
      dataAttr.push(topbarButton.unorderedList.value);
    }
  }
  const hTag = tagname && hTags.includes(tagname) ? tagname : undefined;
  return { styleNames: dataAttr, hTag };
}

export const createRange = ({
  startAfter,
  startElement,
  startOffset,
  endElement,
  endOffset,
  endAfter,
}: CreateRange) => {
  const newRange = document.createRange();
  if (
    startElement &&
    endElement &&
    typeof endOffset === "number" &&
    typeof startOffset === "number"
  ) {
    newRange.setStart(startElement, startOffset);
    newRange.setEnd(endElement, endOffset);
  } else if (startAfter) {
    newRange.setStartAfter(startAfter);
  } else if (endAfter) {
    newRange.setEndAfter(endAfter);
  }
  return newRange;
};

export const getStyleType = (buttonName: TopbarButtonKeys) => {
  const style = {
    isInlineStyle: false,
    isBlockStyle: false,
    isListStyle: false,
    isEmojiStyle: false,
    isLinkStyle: false,
    isHeadingStyle: false,
  };
  const name = buttonName as any;
  if (inlineStyle.has(name)) {
    style.isInlineStyle = true;
  } else if (blockStyle.has(name)) {
    style.isBlockStyle = true;
  } else if (listStyle.has(name)) {
    style.isListStyle = true;
  } else if (buttonName === "emoji") {
    style.isEmojiStyle = true;
  } else if (buttonName === "link") {
    style.isLinkStyle = true;
  } else if (headerStyle.has(name)) {
    style.isHeadingStyle = true;
  }
  return style;
};

export const applyStyleFromNames = ({
  element,
  names,
}: {
  element: HTMLElement;
  names: any[];
}) => {
  const style: { style: string; dataAttr: string } = {
    style: "",
    dataAttr: "",
  };
  let name: TopbarButtonKeys;
  for (name of names) {
    style.style += elementInlineStyle[name] || "";
    style.dataAttr = concactStyleNames({
      sourceName: style.dataAttr,
      targetName: name,
    });
  }
  element.setAttribute(DATE_STYLE_ATTR_NAME, style.dataAttr);
  element.setAttribute("style", style.style);
};

const hasOnlyZeroWidthTextNode = (element: HTMLElement | null) => {
  if (!element) return false;
  const textContent = element.textContent || "";
  const textContentLen = textContent.length || 0;
  return textContentLen <= 1 && textContent.trim() === ZERO_WIDTH_TEXT;
};

const hasElementOnlyText = (element: HTMLElement): boolean => {
  if (element.children.length > 0) {
    return false;
  }
  return element.innerHTML.trim() === element.textContent?.trim();
};

const getStyleDetails = (buttonName: TopbarButtonKeys) => {
  const style = {
    ...getStyleType(buttonName),
    style: "",
  };
  if (style.isInlineStyle) {
    style.style +=
      elementInlineStyle[buttonName as ElementInlineStyleKeys] || "";
  } else if (style.isBlockStyle) {
    style.style +=
      elementInlineStyle[buttonName as ElementInlineStyleKeys] || "";
  } else if (style.isListStyle) {
    style.style = "";
  } else if (style.isEmojiStyle) {
    style.style = "";
  } else if (style.isLinkStyle) {
    style.style = "";
  } else if (style.isHeadingStyle) {
    style.style = "";
  }
  return style;
};

export const moveCursorPos = ({
  selection,
  cursorElement,
  startAfter,
}: {
  selection: Selection | null;
  cursorElement?: HTMLElement | Node;
  startAfter?: HTMLElement | null;
}) => {
  if (!selection) return;
  const newRange = startAfter
    ? createRange({ startAfter })
    : cursorElement
    ? createRange({
        startElement: cursorElement,
        endElement: cursorElement,
        startOffset: cursorElement.childNodes.length,
        endOffset: cursorElement.childNodes.length,
      })
    : null;

  if (newRange) {
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
};

const checkIsCursorInEnd = ({
  cursorContainer,
  styleDepth,
  range,
}: {
  cursorContainer: HTMLElement | null;
  styleDepth: number;
  range: Range;
}): boolean => {
  const hasZeroWidthChar = hasOnlyZeroWidthTextNode(cursorContainer);
  const containerTextContentLen = cursorContainer?.textContent?.length || 0;
  const rangeOffset = range.startOffset;
  const status =
    containerTextContentLen === rangeOffset ||
    hasZeroWidthChar ||
    styleDepth === 0;

  return status;
};

const moveSourceChildrenToTarget = ({
  targetElement,
  sourceElement,
}: {
  targetElement: HTMLElement | null;
  sourceElement: HTMLElement | null;
}) => {
  while (sourceElement?.firstChild) {
    targetElement?.appendChild(sourceElement.firstChild);
  }
};

const moveSibilingToTarget = ({
  targetElement,
  sourceElement,
}: {
  targetElement: HTMLElement | null;
  sourceElement: HTMLElement | null;
}) => {
  while (sourceElement?.nextElementSibling) {
    targetElement?.appendChild(sourceElement.nextElementSibling);
  }
};

const insertSpanTagWithStyle = ({
  range,
  selection,
  style,
  dataAttr,
  textContent,
}: {
  range: Range;
  selection: Selection | null;
  style?: string;
  dataAttr?: { name: string; value: string };
  textContent?: string;
}) => {
  const spanElement = createDocumentElement({
    name: "span",
    inlineStyle: style,
    dataAttr,
  });
  const text = textContent ?? ZERO_WIDTH_TEXT;
  spanElement.appendChild(createTextNode(text));
  range.insertNode(spanElement);
  moveCursorPos({ selection, cursorElement: spanElement });
  return spanElement as HTMLSpanElement;
};

const insertAnchorTagWithStyle = ({
  range,
  selection,
  openInNewTab,
  textContent,
  url,
  style,
  dataAttr,
}: {
  range: Range;
  selection: Selection | null;
  openInNewTab?: boolean;
  textContent: string;
  url: string;
  style?: string;
  dataAttr?: {
    name: string;
    value: string;
  };
}) => {
  const anchorElement = createAnchorNode({
    textContent,
    openInNewTab,
    url,
    style,
    dataAttr,
  });
  range.insertNode(anchorElement);
  moveCursorPos({ selection, cursorElement: anchorElement });
  return anchorElement;
};

const getElementStyleAndStyleName = (element: HTMLElement | null) => {
  const style = {
    style: "",
    styleName: "",
  };
  const stle = getElementStyleAndDataAttribute(element);
  style.styleName = stle.dataAttr;
  style.style = stle.style;
  return style;
};

const getParentStyles = (tag: HTMLElement | null, includeAnchorTag = false) => {
  const parentStyles = {
    style: "",
    styleName: "",
  };
  let styleDepth = 0,
    tagName = tag?.nodeName.toLowerCase();
  while (
    tag !== null &&
    !blockElement.has(tagName || "") &&
    (!includeAnchorTag || tagName !== "a")
  ) {
    const { style, styleName: dataAttr } = getElementStyleAndStyleName(tag);
    parentStyles.styleName = dataAttr
      ? concactStyleNames({
          sourceName: parentStyles.styleName,
          targetName: dataAttr,
        })
      : parentStyles.styleName;
    parentStyles.style += style;
    styleDepth++;
    tag = tag.parentElement;
    tagName = tag?.nodeName.toLowerCase();
  }
  return { parentStyles, parentTag: tag, styleDepth };
};

const addOrUpdateSpan = ({
  dataAttribute,
  styleDepth,
  selection,
  range,
  newStyle,
  cursorContainer,
  textContent,
}: {
  dataAttribute: string;
  styleDepth: number;
  selection: Selection | null;
  range: Range;
  newStyle: string;
  cursorContainer: HTMLElement | null;
  textContent?: string;
}) => {
  if (styleDepth > 0) {
    const hasOnlyZeroWidthChar = hasOnlyZeroWidthTextNode(cursorContainer);
    if (hasOnlyZeroWidthChar) {
      cursorContainer?.setAttribute("style", newStyle);
      cursorContainer?.setAttribute(DATE_STYLE_ATTR_NAME, dataAttribute);
      return;
    }
  }
  const dataAttr = {
    name: DATE_STYLE_ATTR_NAME,
    value: dataAttribute,
  };
  const newRange =
    styleDepth > 0 && cursorContainer
      ? createRange({
          startAfter: cursorContainer,
        })
      : range;

  return insertSpanTagWithStyle({
    range: newRange,
    selection,
    style: newStyle,
    dataAttr,
    textContent,
  });
};

const deleteOrAppendTextNode = ({
  cursorContainer,
  selection,
  textContent,
}: {
  cursorContainer: HTMLElement | null;
  selection: Selection | null;
  textContent?: string;
}) => {
  const parentElement = cursorContainer?.parentElement;
  const element = parentElement || cursorContainer;
  const nextSibling = cursorContainer?.nextElementSibling ?? null;
  if (parentElement && hasOnlyZeroWidthTextNode(cursorContainer)) {
    parentElement.removeChild(cursorContainer);
    if (hasElementOnlyText(parentElement)) {
      return;
    }
  }
  if (element) {
    const text = textContent ?? ZERO_WIDTH_TEXT;
    const emptySpanChild = createDocumentElement({ name: "span" });
    emptySpanChild.appendChild(createTextNode(text));
    element.insertBefore(emptySpanChild, nextSibling);
    moveCursorPos({ selection, startAfter: emptySpanChild });
    return emptySpanChild;
  }
};

const addSpanInBetween = ({
  range,
  selection,
  startOffset,
  endOffset,
  hasStyleAndDataAttr,
  newDataAttr,
  newStyle,
  cursorContainer,
  currentAttr,
  currentStyle,
  textContent,
}: {
  range: Range;
  selection: Selection | null;
  startOffset: number;
  endOffset: number;
  hasStyleAndDataAttr: boolean;
  newDataAttr: string;
  newStyle: string;
  cursorContainer: HTMLElement | null;
  currentAttr: string | null | undefined;
  currentStyle: string | null | undefined;
  textContent?: string;
}) => {
  const endRange = createRange({
    startElement: range.startContainer,
    endElement: range.endContainer,
    startOffset,
    endOffset,
  });
  let dataAttr = undefined,
    style = undefined;
  if (hasStyleAndDataAttr) {
    dataAttr = {
      name: DATE_STYLE_ATTR_NAME,
      value: newDataAttr,
    };
    style = newStyle;
  }
  const newRange = createRange({
    startAfter: cursorContainer as HTMLElement,
  });
  if (endRange && currentAttr && currentStyle) {
    const content = endRange.extractContents();
    const element = insertSpanTagWithStyle({
      range: newRange,
      selection: null,
      style: currentStyle,
      dataAttr: {
        name: DATE_STYLE_ATTR_NAME,
        value: currentAttr,
      },
    });
    element.innerText = content.textContent || ZERO_WIDTH_TEXT;
  }
  return insertSpanTagWithStyle({
    range: newRange,
    selection,
    style,
    dataAttr,
    textContent,
  });
};

const toggleInlineStyle = ({
  buttonName,
  cursorContainer,
  status,
  style,
  selection,
  range,
  textContent,
}: {
  textContent?: string;
  buttonName: TopbarButtonKeys;
  selection: Selection | null;
  range: Range;
  status: boolean;
  cursorContainer: HTMLElement | null;
  style: ReturnType<typeof getStyleDetails>;
}) => {
  const newDataAttrValue = buttonName;

  const {
    parentStyles: { style: pStyle, styleName: pStyleName },
    parentTag,
    styleDepth,
  } = getParentStyles(cursorContainer, true);
  let withParentDataAttr = "",
    withParentStyle = "";
  if (status) {
    withParentDataAttr =
      newDataAttrValue + (pStyleName ? `,${pStyleName}` : "");
    withParentStyle = style.style + pStyle;
  } else {
    const regex = createRegexForBtnNameRemv(newDataAttrValue);
    withParentDataAttr = pStyleName.replace(regex, "");
    withParentStyle = pStyle.replace(style.style, "");
  }
  const containerTextContentLen = cursorContainer?.textContent?.length || 0;
  const styleAndData = getElementStyleAndDataAttribute(cursorContainer);
  const currentElementDataAtt = styleAndData.dataAttr;
  const currentElementStyle = styleAndData.style;
  const rangeOffset = range.startOffset;
  const isCursorIsInEnd = checkIsCursorInEnd({
    cursorContainer,
    range,
    styleDepth,
  });
  const hasStyleAndDataAttr = !!(withParentDataAttr && withParentStyle);
  if (!isCursorIsInEnd) {
    return addSpanInBetween({
      range,
      selection,
      cursorContainer,
      startOffset: rangeOffset,
      endOffset: containerTextContentLen,
      currentAttr: currentElementDataAtt,
      currentStyle: currentElementStyle,
      newDataAttr: withParentDataAttr,
      newStyle: withParentStyle,
      hasStyleAndDataAttr,
      textContent,
    });
  }
  if (!hasStyleAndDataAttr) {
    return deleteOrAppendTextNode({ cursorContainer, selection, textContent });
  }
  return addOrUpdateSpan({
    newStyle: withParentStyle,
    dataAttribute: withParentDataAttr,
    styleDepth,
    selection,
    range,
    cursorContainer,
    textContent,
  });
};

const toggleBlockStyle = ({
  refContainer,
  style,
  buttonName,
  status,
}: {
  refContainer?: HTMLElement | null;
  style: string;
  buttonName: string;
  status: boolean;
}) => {
  const parentElement = refContainer ? getParentElement(refContainer) : null;
  if (status) {
    parentElement?.setAttribute("style", style);
    parentElement?.setAttribute(DATE_STYLE_ATTR_NAME, buttonName);
  } else {
    parentElement?.removeAttribute("style");
    parentElement?.removeAttribute(DATE_STYLE_ATTR_NAME);
  }
};

const replaceLiWithPTag = ({
  currenLiElement,
  selection,
}: {
  currenLiElement: HTMLElement | null;
  selection: Selection | null;
}) => {
  if (currenLiElement?.nodeName?.toLowerCase() !== "li") return;
  const parentElement = currenLiElement?.parentElement;
  const isEndChild = parentElement?.lastElementChild === currenLiElement;
  const isFirstChild = parentElement?.firstElementChild === currenLiElement;
  const { dataAttr, style } = getElementStyleAndDataAttribute(currenLiElement);
  const pElement = createDocumentElement({
    name: "p",
    dataAttr: { name: DATE_STYLE_ATTR_NAME, value: dataAttr },
    inlineStyle: style,
  });
  moveSourceChildrenToTarget({
    sourceElement: currenLiElement,
    targetElement: pElement,
  });
  if (!pElement.textContent?.length) {
    pElement.appendChild(createZeroWidthTextNode());
  }
  if (isFirstChild) {
    parentElement?.parentElement?.insertBefore(pElement, parentElement);
  } else if (isEndChild) {
    parentElement?.parentElement?.insertBefore(
      pElement,
      parentElement?.nextElementSibling
    );
  } else {
    const grandParentTag = parentElement?.nodeName.toLowerCase() as any;
    if (grandParentTag) {
      const targetElement = createDocumentElement({ name: grandParentTag });
      moveSibilingToTarget({
        targetElement,
        sourceElement: currenLiElement,
      });
      parentElement?.parentElement?.insertBefore(
        targetElement,
        parentElement?.nextElementSibling
      );
    }
    parentElement?.parentElement?.insertBefore(
      pElement,
      parentElement?.nextElementSibling
    );
  }
  moveCursorPos({ selection, cursorElement: pElement });
  parentElement?.removeChild(currenLiElement);
  if ((parentElement?.children.length || 0) <= 1) {
    parentElement?.parentElement?.removeChild(parentElement);
  }
  return pElement;
};

const addLiAtCorrectPosition = ({
  liElement,
  listElement,
  currentElement,
  parentElement,
}: {
  listElement: HTMLElement;
  liElement: HTMLElement;
  currentElement: HTMLElement;
  parentElement: HTMLElement | null;
}) => {
  const newListTag = listElement.nodeName.toLowerCase();
  const prevSibling =
    currentElement.previousElementSibling as HTMLElement | null;
  const nextSibling = currentElement.nextElementSibling as HTMLElement | null;
  const prevSiblingTag = prevSibling?.nodeName.toLowerCase();
  const nextSiblingTag = nextSibling?.nodeName.toLowerCase();
  if (prevSiblingTag === nextSiblingTag && newListTag === prevSiblingTag) {
    prevSibling?.appendChild(liElement);
    moveSourceChildrenToTarget({
      sourceElement: nextSibling,
      targetElement: prevSibling,
    });
    parentElement?.removeChild(currentElement);
    if (nextSibling) {
      parentElement?.removeChild(nextSibling);
    }
  } else if (newListTag === prevSiblingTag) {
    prevSibling?.appendChild(liElement);
    parentElement?.removeChild(currentElement);
  } else if (newListTag === nextSiblingTag) {
    nextSibling?.insertBefore(liElement, nextSibling.firstElementChild);
    parentElement?.removeChild(currentElement);
  } else {
    listElement.appendChild(liElement);
    parentElement?.replaceChild(listElement, currentElement);
  }
};

const toggleListStyle = ({
  refContainer,
  buttonName,
}: {
  refContainer?: HTMLElement | null;
  buttonName: string;
}) => {
  const parentElement = refContainer ? getParentElement(refContainer) : null;

  if (!parentElement) return;
  const grandParent = parentElement?.parentElement;
  const isLiParent = parentElement?.nodeName.toLowerCase() == "li";
  const grandParentName = grandParent?.nodeName.toLowerCase();
  const isSameGrandParent = isLiParent
    ? (grandParentName === "ol" && buttonName === "orderedList") ||
      (grandParentName === "ul" && buttonName === "unorderedList")
    : false;
  let cursorContainer = parentElement;
  const selection = getTextSelection();
  if (isSameGrandParent) {
    const pElement = replaceLiWithPTag({
      currenLiElement: parentElement,
      selection,
    });
    return pElement;
  }
  const listElement = createDocumentElement({
    name: buttonName === "orderedList" ? "ol" : "ul",
  });
  if (isLiParent) {
    moveSourceChildrenToTarget({
      sourceElement: grandParent,
      targetElement: listElement,
    });
    grandParent?.parentElement?.replaceChild(listElement, grandParent);
  } else {
    const { dataAttr, style } = getElementStyleAndDataAttribute(parentElement);
    const liElement = createDocumentElement({
      name: "li",
      inlineStyle: style,
      dataAttr: { name: DATE_STYLE_ATTR_NAME, value: dataAttr },
    });
    moveSourceChildrenToTarget({
      targetElement: liElement,
      sourceElement: parentElement,
    });
    addLiAtCorrectPosition({
      liElement,
      listElement,
      currentElement: parentElement,
      parentElement: grandParent,
    });
    cursorContainer = liElement;
  }
  moveCursorPos({ selection, cursorElement: cursorContainer });
  return cursorContainer;
};

const addAnchorInBetween = ({
  range,
  selection,
  startOffset,
  endOffset,
  title,
  openInNewTab,
  cursorContainer,
  currentAttr,
  currentStyle,
  url,
}: {
  range: Range;
  selection: Selection | null;
  startOffset: number;
  endOffset: number;
  cursorContainer: HTMLElement | null;
  currentAttr: string | undefined;
  currentStyle: string | undefined;
  title: string;
  openInNewTab: boolean;
  url: string;
}) => {
  const endRange = createRange({
    startElement: range.startContainer,
    endElement: range.endContainer,
    startOffset,
    endOffset,
  });
  const endContent = endRange.extractContents()?.textContent?.trim();

  const newRange = createRange({
    startAfter: cursorContainer as HTMLElement,
  });
  if (endRange && endContent && currentAttr && currentStyle) {
    const element = insertSpanTagWithStyle({
      range: newRange,
      selection: null,
      style: currentStyle,
      dataAttr: {
        name: DATE_STYLE_ATTR_NAME,
        value: currentAttr,
      },
    });
    element.innerText = endContent;
  }
  insertAnchorTagWithStyle({
    range: newRange,
    selection,
    textContent: title,
    openInNewTab,
    url,
    style: currentStyle,
    dataAttr: currentAttr
      ? { name: DATE_STYLE_ATTR_NAME, value: currentAttr }
      : undefined,
  });
};

const addAnchorInEnd = ({
  linkData,
  refContainer,
  selection,
  style,
  dataAttr,
  insideParent,
}: {
  linkData: { url: string; title: string; openInNewTab?: boolean };
  refContainer: HTMLElement;
  selection: Selection | null;
  style?: string;
  dataAttr?: { name: string; value: string };
  insideParent?: boolean;
}) => {
  const anchorElement = createAnchorNode({
    textContent: linkData.title,
    url: linkData.url,
    openInNewTab: linkData.openInNewTab,
    style,
    dataAttr,
  });
  if (insideParent) {
    refContainer.appendChild(anchorElement);
  } else {
    refContainer.parentElement?.insertBefore(
      anchorElement,
      refContainer.nextElementSibling
    );
  }
  moveCursorPos({ selection, cursorElement: anchorElement });
};

const toggleLinkStyle = ({
  refContainer,
  inputRef,
  buttonName,
  extraData,
  parentSelection: selection,
  parentRange: range,
}: {
  refContainer?: HTMLElement | null;
  inputRef?: HTMLElement | null;
  buttonName: string;
  extraData: unknown;
  parentSelection: Selection | null;
  parentRange: Range | null;
}) => {
  if (!refContainer) return;
  const linkData = extraData as {
    title: string;
    url: string;
    openInNewTab: boolean;
  };
  const anchorNode = getAnchorParentTag(refContainer);
  if (anchorNode) {
    const { dataAttr, style } = getElementStyleAndDataAttribute(anchorNode);
    const spanElement = createDocumentElement({
      name: "span",
      dataAttr: { name: DATE_STYLE_ATTR_NAME, value: dataAttr },
      inlineStyle: style,
    });
    moveSourceChildrenToTarget({
      sourceElement: anchorNode,
      targetElement: spanElement,
    });
    anchorNode?.parentElement?.replaceChild(spanElement, anchorNode);
    moveCursorPos({ selection, cursorElement: spanElement });
    return;
  }
  const isCusorInsideEditableDiv =
    inputRef && selection && selection.anchorNode
      ? inputRef.contains(selection.anchorNode)
      : false;

  if (!range || !isCusorInsideEditableDiv) {
    addAnchorInEnd({ refContainer, selection, linkData, insideParent: true });
    return;
  }
  const refContainerTag = refContainer?.nodeName.toLowerCase();
  const insideBlockParent = blockElement.has(refContainerTag);
  if (insideBlockParent) {
    addAnchorInEnd({
      refContainer,
      selection,
      linkData,
      insideParent: true,
    });
    return;
  }
  const {
    parentStyles: { style: pStyle, styleName: pStyleName },
  } = getParentStyles(refContainer, true);
  const endContentLength = range.endContainer.textContent?.length || 0;
  const startOffset = range.startOffset;
  const endOffset =
    endContentLength >= range.endOffset ? endContentLength : range.endOffset;
  addAnchorInBetween({
    currentAttr: pStyleName,
    currentStyle: pStyle,
    cursorContainer: refContainer,
    range,
    selection,
    startOffset: startOffset,
    endOffset: endOffset,
    ...linkData,
  });
};

const toggleHeadingStyle = ({
  refContainer,
  buttonName,
  extraData,
  parentSelection: selection,
  parentRange: range,
}: {
  refContainer?: HTMLElement | null;
  buttonName: string;
  extraData: unknown;
  parentSelection: Selection | null;
  parentRange: Range | null;
}) => {
  const parentElement = refContainer ? getParentElement(refContainer) : null;
  if (!parentElement) return;
  const { tagName: newTag } = extraData as { tagName: string };
  const tagName = parentElement?.nodeName.toLowerCase();
  if (tagName === newTag) return;
  const isLiParentTag = tagName === "li";
  const grandParent = parentElement.parentElement;
  const isFirstLiChild = grandParent?.firstElementChild === parentElement;
  const isLastLiChild = grandParent?.lastElementChild === parentElement;
  const { dataAttr, style } = getElementStyleAndDataAttribute(parentElement);
  const tagElement = createDocumentElement({
    name: newTag as any,
    inlineStyle: style,
    dataAttr: { name: DATE_STYLE_ATTR_NAME, value: dataAttr },
  });
  moveSourceChildrenToTarget({
    sourceElement: parentElement,
    targetElement: tagElement,
  });
  const hasOneChildren = grandParent?.children.length === 1;
  if (!isLiParentTag) {
    grandParent?.replaceChild(tagElement, parentElement);
  } else if (hasOneChildren) {
    grandParent?.parentElement?.replaceChild(tagElement, grandParent);
  } else if (isFirstLiChild) {
    grandParent?.removeChild(parentElement);
    grandParent?.parentElement?.insertBefore(tagElement, grandParent);
  } else if (isLastLiChild) {
    grandParent?.removeChild(parentElement);
    grandParent?.parentElement?.insertBefore(
      tagElement,
      grandParent?.nextElementSibling
    );
  } else {
    const grandParentTag = grandParent?.nodeName.toLowerCase() as any;
    if (grandParentTag) {
      const targetElement = createDocumentElement({ name: grandParentTag });
      moveSibilingToTarget({ targetElement, sourceElement: parentElement });
      grandParent?.parentElement?.insertBefore(
        targetElement,
        grandParent?.nextElementSibling
      );
    }
    grandParent?.removeChild(parentElement);
    grandParent?.parentElement?.insertBefore(
      tagElement,
      grandParent?.nextElementSibling
    );
  }
  moveCursorPos({ selection, cursorElement: tagElement });
  return tagElement;
};

export function toggleElementStyle(param: {
  buttonName: TopbarButtonKeys;
  status: boolean;
  refContainer?: HTMLElement | null;
  extraData?: unknown;
  textContent?: string;
  inputRef?: HTMLElement | null;
  parentSelection: Selection | null;
  parentRange: Range | null;
}) {
  const {
    buttonName,
    status,
    refContainer,
    extraData,
    textContent,
    inputRef,
    parentSelection,
    parentRange,
  } = param;
  const style = getStyleDetails(buttonName);
  if (style.isInlineStyle) {
    const { cursorContainer, selection, range } =
      getSelectionRangeAndContainer();
    if (!range || !cursorContainer) return;
    toggleInlineStyle({
      buttonName,
      status,
      cursorContainer,
      style,
      selection,
      range,
      textContent,
    });
  } else if (style.isBlockStyle) {
    toggleBlockStyle({ buttonName, refContainer, style: style.style, status });
  } else if (style.isListStyle) {
    return toggleListStyle({ refContainer, buttonName });
  } else if (style.isEmojiStyle) {
    const selection = getTextSelection();
    const textNode = createTextNode(extraData as string);
    refContainer?.appendChild(textNode);
    moveCursorPos({ selection, startAfter: textNode as any });
  } else if (style.isLinkStyle) {
    toggleLinkStyle({
      refContainer,
      buttonName,
      extraData,
      inputRef,
      parentSelection,
      parentRange,
    });
  } else if (style.isHeadingStyle) {
    return toggleHeadingStyle({
      refContainer,
      extraData,
      parentRange,
      parentSelection,
      buttonName,
    });
  }
}
