// polyfill all `core-js` features, including early-stage proposals:
import "core-js";

import React, { useEffect, useRef, useState } from "react";
import "../../main.css";
import DOMPurify from "dompurify";
import EditableTopbar, {
  TopbarControlOption,
} from "../EditableTopbar/EditableTopbar";
import {
  useHeadingPubSubContext,
  usePubSubContext,
  useWindowDimesionContext,
} from "../../hooks";
import {
  applyStyleFromNames,
  createDocumentElement,
  createZeroWidthTextNode,
  getElementStyle,
  getParentElement,
  getSelectionRangeAndContainer,
  moveCursorPos,
  ZERO_WIDTH_TEXT,
  classnames,
} from "../../utills";
import { textSelectEventName } from "../../constant";
import PubSubProvider from "../PubSubProvider/PubSubProvider";
import css from "./EditableDiv.module.css";
import { HeadingPubsubProvider } from "../HeadingPubSubProvider/HeadingPubSubProvider";
import { WindowDimensionProvider } from "../WindowDimensionProvider/WindowDimensionProvider";

const stylePlatteArr = [
  "primaryColor",
  "primaryColorDark",
  "colorWhite",
  "colorBlack",
  "placeholderTextColor",
  "toolbarBorderColor",
  "editorBorderColor",
  "linkInputBorderColor",
  "linkCancelButtonHoverColor",
  "borderRadius",
  "boxShadowLinkPopupButton",
  "boxShadowToolbarButton",
  "boxShadowPopup",
] as const;

type StylePlatteKeys = (typeof stylePlatteArr)[number];

const stylePlatteSet = new Set(stylePlatteArr);

type StylePlatte = {
  [name in StylePlatteKeys]?: string;
};

type EditableDivProps = {
  label?: string;
  id: string;
  name: string;
  initialValues?: string;
  placeholder?: string;
  controlOptions?: TopbarControlOption;
  wrapperClassName?: string;
  editorClassName?: string;
  toolbarClassName?: string;
  stylePlatte?: StylePlatte;
  onTextChange?: (content: string) => Promise<void> | void;
};

function EditableDivComponent(props: EditableDivProps) {
  const {
    label,
    name,
    id,
    placeholder,
    initialValues,
    wrapperClassName,
    toolbarClassName,
    editorClassName,
    controlOptions,
    stylePlatte = {},
    onTextChange,
  } = props;
  const [isEmptyRoot, setIsEmptyRoot] = useState(false);
  const [EmptyTag, setEmptyTag] = useState<keyof HTMLElementTagNameMap>("p");
  const contentEditableDivRef = useRef<HTMLDivElement | null>(null);
  const cursorCurrentContainerRef = useRef<{
    container: HTMLElement | null;
    range: Range | null;
    selection: Selection | null;
  }>({ container: null, range: null, selection: null });
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const isInputGetClicked = useRef(false);
  const {
    notifySelectedWithSelectStatus,
    notifyAll,
    getActiveSubscribers,
    notifySelectedWithUnselectStatus,
  } = usePubSubContext();
  const { notifyHeaderCb } = useHeadingPubSubContext();
  const { notifyOnResize } = useWindowDimesionContext();

  if (!id || !name) {
    throw new Error("id and name is required.");
  }
  const placeholderText = placeholder?.toString();
  const windowType = typeof window;

  //=============================== Helper functions =============================

  const changeCurrentCursor = (refContainer?: HTMLElement) => {
    if (refContainer) {
      cursorCurrentContainerRef.current.container = refContainer;
      cursorCurrentContainerRef.current.range = null;
      cursorCurrentContainerRef.current.selection = null;
    }
  };

  const updateCursorContainer = () => {
    const {
      selection,
      cursorContainer: container,
      range,
    } = getSelectionRangeAndContainer();
    cursorCurrentContainerRef.current.container = container;
    cursorCurrentContainerRef.current.range = range ?? null;
    cursorCurrentContainerRef.current.selection = selection;
    return { container, selection };
  };
  const getCursorContainerRef = () => {
    return cursorCurrentContainerRef.current;
  };

  const addNewParagraghLine = ({
    parentElement,
    addZeroWidthTextNode,
    addLineBreak,
    nextSibling,
    tagName,
    isPasteKeyword,
    textContent,
  }: {
    parentElement: Node;
    addZeroWidthTextNode?: boolean;
    addLineBreak?: boolean;
    nextSibling: Element | null;
    tagName?: keyof HTMLElementTagNameMap;
    isPasteKeyword?: boolean;
    textContent?: string;
  }) => {
    const pElemnt = createDocumentElement({
      name: tagName ?? "p",
      textContent,
    });
    if (addZeroWidthTextNode) {
      pElemnt.appendChild(createZeroWidthTextNode());
    }
    if (addLineBreak) {
      pElemnt.appendChild(createDocumentElement({ name: "br" }));
    }
    if (isPasteKeyword) {
      parentElement.appendChild(pElemnt);
    } else {
      parentElement.insertBefore(pElemnt, nextSibling);
    }
    return pElemnt;
  };

  const selectContainerRef = (el: HTMLDivElement | null) => {
    if (el) {
      const santizedInitialValue = initialValues
        ? DOMPurify.sanitize(initialValues)
        : "";
      contentEditableDivRef.current = el;
      if (santizedInitialValue) {
        el.innerHTML = santizedInitialValue;
      }
      if (el.children.length < 1) {
        const pElement = addNewParagraghLine({
          parentElement: el,
          addZeroWidthTextNode: true,
          nextSibling: null,
        });
        changeCurrentCursor(pElement);
      }
      updatedTextContent();
      textSelectEventName.forEach((eventName) => {
        el.removeEventListener(eventName, selectionChangeHandler);
        el.addEventListener(eventName, selectionChangeHandler);
      });
    }
  };

  const resetButtonStatus = () => {
    notifyAll(false);
  };

  const updatedInputClickStatus = (status: boolean) => {
    isInputGetClicked.current = status;
  };

  const isInputClicked = () => {
    return isInputGetClicked.current;
  };

  const processOnNewLinePress = ({
    isEnterPressed,
    isPasteKeyword,
    container,
    selection,
  }: {
    isEnterPressed: boolean;
    isPasteKeyword: boolean;
    container: HTMLElement | null;
    selection: Selection | null;
  }) => {
    const parentElement = isEnterPressed
      ? getParentElement(container)
      : container;
    const siblingTagName = parentElement?.nodeName.toLowerCase();
    const isLiTag = siblingTagName === "li";

    const tagName = (
      isEnterPressed && isLiTag ? siblingTagName : "p"
    ) as keyof HTMLElementTagNameMap;

    const activeInlineSubs = isEnterPressed
      ? getActiveSubscribers("inline")
      : [];

    const activeInlineSubsLen = activeInlineSubs.length;
    const shouldAddNewLine = isPasteKeyword || isEnterPressed;
    if (shouldAddNewLine && contentEditableDivRef.current) {
      const extraOption =
        isEnterPressed && activeInlineSubsLen < 1
          ? {
              addZeroWidthTextNode: true,
            }
          : isPasteKeyword
          ? {
              addLineBreak: true,
            }
          : {};
      let cursorElement;
      notifySelectedWithUnselectStatus([
        "justifyFull",
        "justifyCenter",
        "justifyLeft",
        "justifyRight",
      ]);

      const pElment = addNewParagraghLine({
        parentElement: isEnterPressed
          ? (parentElement?.parentElement as HTMLElement)
          : contentEditableDivRef.current,
        nextSibling: container?.nextElementSibling ?? null,
        tagName,
        ...extraOption,
        isPasteKeyword,
      });

      cursorElement = pElment;
      if (activeInlineSubs.length) {
        const spanElement = createDocumentElement({
          name: "span",
          textContent: ZERO_WIDTH_TEXT,
        });
        applyStyleFromNames({ element: spanElement, names: activeInlineSubs });
        notifySelectedWithSelectStatus(activeInlineSubs);
        pElment.appendChild(spanElement);
        cursorElement = spanElement;
      }
      if (selection && isEnterPressed) {
        moveCursorPos({ selection, cursorElement: cursorElement });
      }

      notifyHeaderCb("p");
    }
  };

  const getInputRef = () => {
    return contentEditableDivRef.current;
  };

  const updatedTextContent = () => {
    const content = contentEditableDivRef.current?.innerHTML;
    const textContent = contentEditableDivRef.current?.textContent;
    const isEmptyRoot = textContent === "​" || !textContent;
    if (isEmptyRoot) {
      const firstChildTag =
        contentEditableDivRef.current?.firstElementChild?.nodeName.toLowerCase() ||
        "p";
      setEmptyTag(firstChildTag as any);
      setIsEmptyRoot(true);
    } else {
      setEmptyTag("p");
      setIsEmptyRoot(false);
    }
    if (content && typeof onTextChange === "function") {
      const santizedContent = DOMPurify.sanitize(content);
      onTextChange(santizedContent);
    }
  };

  const updateDefaultColorPlatte = () => {
    if (typeof document === "undefined") return;
    const root = document.querySelector(":root") as HTMLElement;
    if (!root) return;
    Object.entries(stylePlatte).forEach((entry) => {
      const [key, value] = entry as [StylePlatteKeys, string];
      if (stylePlatteSet.has(key)) {
        document.documentElement.style.setProperty(`--${key}`, value);
      }
    });
  };

  // ======================= Event handlers =================
  const selectionChangeHandler = (event: Event) => {
    updateCursorContainer();
  };
  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {};

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (
      e.relatedTarget &&
      rootContainerRef.current?.contains(e.relatedTarget)
    ) {
      updatedInputClickStatus(true);
    } else {
      updatedInputClickStatus(false);
      resetButtonStatus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = e;
    const keyLwr = key.toLowerCase();
    if (keyLwr === "enter" || keyLwr === "tab") {
      e.preventDefault();
    }
    updateCursorContainer();
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const { container, selection } = getCursorContainerRef();
    const { ctrlKey, key } = e;
    const keyLwr = key.toLowerCase();
    const isPasteKeyword = ctrlKey && keyLwr === "v";
    const isEnterPressed = !!(
      (container === contentEditableDivRef.current &&
        container &&
        contentEditableDivRef.current) ||
      keyLwr === "enter"
    );
    processOnNewLinePress({
      isEnterPressed,
      isPasteKeyword,
      selection,
      container,
    });
    updatedTextContent();
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { styleNames, hTag } = getElementStyle();
    resetButtonStatus();
    updatedInputClickStatus(true);
    updateCursorContainer();
    notifyHeaderCb(hTag || "p");
    if (styleNames.length > 0) {
      notifySelectedWithSelectStatus(styleNames);
    }
  };

  const handleWindwoResize = (event: UIEvent) => {
    const { innerWidth, innerHeight } = window;
    notifyOnResize({ width: innerWidth, height: innerHeight });
  };

  const rootClasses = classnames(css.root, wrapperClassName);
  const inputClasses = classnames(css.inputContainer, editorClassName);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleWindwoResize);

      return () => {
        window.removeEventListener("resize", handleWindwoResize);
      };
    }
  }, []);

  useEffect(updateDefaultColorPlatte, []);
  return (
    <div
      className={rootClasses}
      onBlur={handleBlur}
      ref={rootContainerRef}
      tabIndex={0}>
      {label ? (
        <p>
          <label htmlFor={id}>{label}</label>
        </p>
      ) : null}
      <EditableTopbar
        controlOptions={controlOptions}
        className={toolbarClassName}
        isInputClicked={isInputClicked}
        changeCurrentCursor={changeCurrentCursor}
        getInputRef={getInputRef}
        getCursorContainerRef={getCursorContainerRef}
        updatedTextContent={updatedTextContent}
      />
      <div className={inputClasses}>
        {placeholderText && isEmptyRoot ? (
          <div className={css.placeholderContainer}>
            <EmptyTag className={css.placeholderText}>
              {placeholderText}
            </EmptyTag>
          </div>
        ) : null}
        <div
          id={id}
          contentEditable={true}
          className={css.input}
          ref={selectContainerRef}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
          style={{
            userSelect: "text",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
          role='textbox'
          aria-multiline='true'
        />
      </div>
    </div>
  );
}

function EditableDiv(props: EditableDivProps) {
  return (
    <PubSubProvider>
      <HeadingPubsubProvider>
        <WindowDimensionProvider>
          <EditableDivComponent {...props} />
        </WindowDimensionProvider>
      </HeadingPubsubProvider>
    </PubSubProvider>
  );
}

export default EditableDiv;
