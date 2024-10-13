import React, {
  MutableRefObject,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { inlineStyle, topbarButton, TopbarButtonKeys } from "../../constant";
import { MdFormatBold } from "react-icons/md";
import {
  BsJustifyLeft,
  BsJustifyRight,
  BsJustify,
  BsTextCenter,
  BsEmojiSmile,
} from "react-icons/bs";
import { VscListOrdered, VscItalic, VscListUnordered } from "react-icons/vsc";
import { FiUnderline } from "react-icons/fi";
import { TbLinkPlus, TbLinkOff } from "react-icons/tb";
import {
  getSelectionRangeAndContainer,
  toggleElementStyle,
  classnames,
  getCurrentCursorContainer,
} from "../../utills";
import {
  useHeadingPubSubContext,
  usePubSubContext,
  useTriggerAction,
  useWindowDimesionContext,
} from "../../hooks";
import css from "./EditableTopbar.module.css";
import EmojiContainer from "../EmojiContainer/EmojiContainer";
import InsertLinkContainer from "../InsertLinkContainer/InsertLinkContainer";
import HeaderSelect from "../HeaderSelect/HeaderSelect";

type ClickEvent = React.MouseEvent<HTMLButtonElement>;
type ButtonProps = PropsWithChildren & {
  className?: string;
  label: string;
  id: string;
  buttonRef: MutableRefObject<HTMLButtonElement | null>;
  buttonClassName?: string;
  onClick?: (event: ClickEvent) => void;
};
type ExtendedButtonProps<T> = {
  className?: string;
  icon?: React.JSX.Element;
  linkIcon?: React.JSX.Element;
  unlinkIcon?: React.JSX.Element;
  dropdownIcon?: React.JSX.Element;
  dropdownClassName?: string;
  isInputClicked: () => boolean;
  changeCurrentCursor: (refContainer?: HTMLElement) => any;
  getInputRef: () => HTMLElement | null;
  getCursorContainerRef: () => {
    container: HTMLElement | null;
    range: Range | null;
    selection: Selection | null;
  };
  updatedTextContent: () => void;
};

type MultiStepButtonProps<T extends TopbarButtonKeys = TopbarButtonKeys> =
  PropsWithChildren &
    ExtendedButtonProps<T> & {
      buttonName: TopbarButtonKeys;
      isMultiStep?: boolean;
      propsData?: unknown;
      triggerAction?: number;
      onClick?: (params?: unknown) => void;
      onButtonClickStatusChange?: (status: boolean) => void;
      onRender?: (props: {
        isButtonSelected: boolean;
        name: string;
        label: string;
        id: string;
        className: string;
        onApplyStyle: (extaData?: unknown) => void;
      }) => React.JSX.Element;
      updatedTextContent: () => void;
    };

const blockStyleList: TopbarButtonKeys[] = [
  "justifyFull",
  "justifyCenter",
  "justifyLeft",
  "justifyRight",
];

const filterOutSelectedOne = (name: TopbarButtonKeys) =>
  blockStyleList.filter((n) => name !== n);

const Button = (props: ButtonProps) => {
  const {
    children,
    onClick,
    label,
    className,
    id,
    buttonRef,
    buttonClassName,
    ...rest
  } = props;
  const handleButtonClick = (e: ClickEvent) => {
    e.preventDefault();
    if (typeof onClick === "function") {
      onClick(e);
    }
  };

  const classes = classnames(css.topbarButtonRoot, className);
  const buttonClasses = classnames(css.topbarButton, buttonClassName);
  return (
    <div className={classes}>
      <button
        type='button'
        onClick={handleButtonClick}
        aria-label={label}
        id={id}
        ref={buttonRef}
        className={buttonClasses}
        title={label}
        {...rest}>
        {children}
      </button>
    </div>
  );
};

export function MultiStepButton(props: MultiStepButtonProps) {
  const {
    className,
    buttonName: btnName,
    children,
    isMultiStep,
    propsData,
    triggerAction,
    isInputClicked,
    onClick,
    onButtonClickStatusChange,
    getInputRef,
    getCursorContainerRef,
    onRender,
    updatedTextContent,
  } = props;
  const [isButtonSelected, setIsButtonSelected] = useState(false);
  const { subscribe, unsubscribe, updateSusciberStatus } = usePubSubContext();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const button = topbarButton[btnName];
  const buttonLabel = button.label;
  const buttonName = button.value;

  const finalSubmit = (extraData?: unknown) => {
    if (!isMultiStep) {
      setIsButtonSelected((isButtonSelected) => !isButtonSelected);
    }
    const isInputGetClicked = isInputClicked();
    const isInlineStyle = inlineStyle.has(buttonName as any);
    const shouldApplyInlineStyle = isInlineStyle ? isInputGetClicked : true;
    const shouldFocuInput = isInputGetClicked;
    let toggleResult: unknown | undefined = undefined;
    const inputRef = getInputRef();
    const {
      container: cursorContainer,
      selection,
      range,
    } = getCursorContainerRef();
    if (inputRef && shouldFocuInput) {
      inputRef.focus();
    }
    let textContent = undefined;
    if (inlineStyle.has(buttonName as any)) {
      const selectedText = selection?.toString();
      const selectionContainer = getCurrentCursorContainer(selection);
      textContent =
        selectedText && inputRef?.contains(selectionContainer)
          ? selectedText
          : undefined;

      if (textContent) {
        range?.deleteContents();
      }
    }
    if (shouldApplyInlineStyle) {
      toggleResult = toggleElementStyle({
        status: !isButtonSelected,
        refContainer: cursorContainer,
        extraData: propsData || extraData,
        parentSelection: selection,
        parentRange: range,
        buttonName,
        inputRef,
        textContent,
      });
    }
    if (!isMultiStep) {
      updateSusciberStatus(btnName, !isButtonSelected);
    }
    updatedTextContent();
    return toggleResult;
  };

  const applyStyle = (extraData?: unknown) => {
    let toggleResult: unknown | undefined = undefined;
    if (!isMultiStep) {
      toggleResult = finalSubmit(extraData);
    }
    if (typeof onClick === "function") {
      onClick(toggleResult);
    }
  };

  const handleClick = (e: ClickEvent) => {
    e.preventDefault();
    applyStyle();
  };
  const classes = classnames(css.multiButton, className, {
    [css.selectedButton]: isButtonSelected,
  });

  useEffect(() => {
    subscribe({ name: buttonName, subscribeCb: setIsButtonSelected });
    return () => {
      unsubscribe(buttonName);
    };
  }, []);

  useEffect(() => {
    if (isMultiStep && triggerAction) {
      finalSubmit();
    }
  }, [triggerAction, isMultiStep]);

  useEffect(() => {
    if (!isButtonSelected) {
      buttonRef.current?.blur();
    }
    if (isMultiStep && typeof onButtonClickStatusChange === "function") {
      onButtonClickStatusChange(isButtonSelected);
    }
  }, [isMultiStep, isButtonSelected]);

  return typeof onRender === "function" ? (
    onRender({
      id: buttonName,
      name: buttonName,
      label: buttonLabel,
      className: classes,
      onApplyStyle: applyStyle,
      isButtonSelected,
    })
  ) : (
    <Button
      label={buttonLabel}
      onClick={handleClick}
      className={classes}
      id={buttonName}
      buttonRef={buttonRef}
      aria-selected={isButtonSelected}
      data-label={buttonLabel}>
      {children}
    </Button>
  );
}

function BoldButton<T extends TopbarButtonKeys>(props: ExtendedButtonProps<T>) {
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='bold' {...rest}>
      {icon ? icon : <MdFormatBold className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function JustifyLeftButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();
  const onClick = () => {
    notifySelectedWithUnselectStatus(filterOutSelectedOne("justifyLeft"));
  };
  const { icon, ...rest } = props;
  return (
    <MultiStepButton buttonName='justifyLeft' onClick={onClick} {...rest}>
      {icon ? icon : <BsJustifyLeft className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function JustifyRightButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();
  const onClick = () => {
    notifySelectedWithUnselectStatus(filterOutSelectedOne("justifyRight"));
  };
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='justifyRight' onClick={onClick} {...rest}>
      {icon ? icon : <BsJustifyRight className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function JustifyCenterButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();
  const onClick = () => {
    notifySelectedWithUnselectStatus(filterOutSelectedOne("justifyCenter"));
  };
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='justifyCenter' onClick={onClick} {...rest}>
      {icon ? icon : <BsTextCenter className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function JustifyFullButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();
  const onClick = () => {
    notifySelectedWithUnselectStatus(filterOutSelectedOne("justifyFull"));
  };
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='justifyFull' onClick={onClick} {...rest}>
      {icon ? icon : <BsJustify className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function OrderedListButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();

  const onClick = (refContainer?: unknown) => {
    props.changeCurrentCursor(refContainer as HTMLElement);
    notifySelectedWithUnselectStatus(["unorderedList"]);
  };
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='orderedList' onClick={onClick} {...rest}>
      {icon ? icon : <VscListOrdered className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function UnorderedListButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { notifySelectedWithUnselectStatus } = usePubSubContext();

  const onClick = (refContainer?: unknown) => {
    props.changeCurrentCursor(refContainer as HTMLElement);
    notifySelectedWithUnselectStatus(["orderedList"]);
  };
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='unorderedList' onClick={onClick} {...rest}>
      {icon ? icon : <VscListUnordered className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function ItalicButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='italic' {...rest}>
      {icon ? icon : <VscItalic className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function UnderlineButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { icon, ...rest } = props;

  return (
    <MultiStepButton buttonName='underLine' {...rest}>
      {icon ? icon : <FiUnderline className={css.btnIcon} />}
    </MultiStepButton>
  );
}

function EmojiButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { triggerAction, enableTriggerAction } = useTriggerAction();
  const [showEmojiPopup, setShowEmojiPopup] = useState(false);
  const { subscribeForResize, unsubscribeForResize } =
    useWindowDimesionContext();
  const divRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const propsData = useRef<null | string>(null);

  const handleClick = () => {
    setShowEmojiPopup((showEmojiPopup) => !showEmojiPopup);
  };

  const handleResize = (_: { width: number; height: number }) => {
    correctPopPosition();
  };

  const handleEmojiSelect = (emoji: string) => {
    propsData.current = emoji;
    setShowEmojiPopup(false);
    enableTriggerAction();
  };

  const correctPopPosition = () => {
    const emojiContainerWidth =
      (divRef.current?.offsetLeft || 0) +
      (containerRef.current?.offsetWidth || 0);
    const parentWidth = divRef.current?.parentElement?.offsetWidth || 1;
    const isOutsideTheWindow = emojiContainerWidth / parentWidth < 0.5;
    const diff = Math.min(0, parentWidth - emojiContainerWidth);
    const inlineStyle = isOutsideTheWindow
      ? `right:${diff}px;`
      : `left:${diff}px;`;
    containerRef.current?.setAttribute("style", inlineStyle);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (
      e.relatedTarget === null ||
      !divRef.current?.contains(e.relatedTarget)
    ) {
      setShowEmojiPopup(false);
    }
  };

  const containerRefcb = (el: HTMLElement | null) => {
    containerRef.current = el;
    correctPopPosition();
  };

  const emojiClass = classnames(css.emojiContainer, {
    [css.showEmojiPopup]: showEmojiPopup,
  });
  const { icon, ...rest } = props;

  useEffect(() => {
    subscribeForResize("emoji", handleResize);
    return () => {
      unsubscribeForResize("emoji");
    };
  }, []);

  return (
    <div
      className={css.emojiRoot}
      onBlur={handleBlur}
      tabIndex={0}
      ref={divRef}>
      <MultiStepButton
        {...rest}
        buttonName='emoji'
        triggerAction={triggerAction}
        isMultiStep={true}
        propsData={propsData.current}
        onClick={handleClick}>
        {icon ? icon : <BsEmojiSmile className={css.btnIcon} />}
      </MultiStepButton>
      <EmojiContainer
        onEmojiSelect={handleEmojiSelect}
        className={emojiClass}
        inputRef={containerRefcb}
      />
    </div>
  );
}

function LinkButton<T extends TopbarButtonKeys>(props: ExtendedButtonProps<T>) {
  const { triggerAction, enableTriggerAction } = useTriggerAction();
  const [showLinkFormPopup, setShowLinkFormPopup] = useState(false);
  const [isButtonSelected, setIsButtonSelected] = useState(false);
  const { subscribeForResize, unsubscribeForResize } =
    useWindowDimesionContext();
  const { notifySelected } = usePubSubContext();
  const divRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const propsData = useRef<null | Record<string, any>>(null);
  const { linkIcon, unlinkIcon, ...rest } = props;

  const handleClick = () => {
    if (isButtonSelected) {
      setShowLinkFormPopup(false);
      enableTriggerAction();
      notifySelected({ link: false });
    } else {
      setShowLinkFormPopup((showLinkFormPopup) => !showLinkFormPopup);
    }
  };

  const handleLinkInsert = (params: {
    title: string;
    url: string;
    openInNewTab: boolean;
  }) => {
    propsData.current = params;
    setShowLinkFormPopup(false);
    enableTriggerAction();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (
      e.relatedTarget === null ||
      !divRef.current?.contains(e.relatedTarget)
    ) {
      setShowLinkFormPopup(false);
    }
  };

  const handleCancel = () => {
    setShowLinkFormPopup(false);
  };

  const handleResize = (_: { width: number; height: number }) => {
    correctPopPosition();
  };
  const correctPopPosition = () => {
    const emojiContainerWidth =
      (divRef.current?.offsetLeft || 0) +
      (containerRef.current?.offsetWidth || 0);
    const parentWidth = divRef.current?.parentElement?.offsetWidth || 1;
    const isOutsideTheWindow = emojiContainerWidth / parentWidth < 0.5;
    const diff = Math.min(0, parentWidth - emojiContainerWidth);
    const inlineStyle = isOutsideTheWindow
      ? `right:${diff}px;`
      : `left:${diff}px;`;
    containerRef.current?.setAttribute("style", inlineStyle);
  };

  const containerRefcb = (el: HTMLElement | null) => {
    containerRef.current = el;
    correctPopPosition();
  };
  const handleToggleButtonStatus = (status: boolean) => {
    setIsButtonSelected(status);
  };

  const linkClass = classnames(css.linkContainer, {
    [css.showLinkPopup]: showLinkFormPopup,
  });

  useEffect(() => {
    subscribeForResize("link", handleResize);
    return () => {
      unsubscribeForResize("link");
    };
  }, []);

  return (
    <div
      className={css.emojiRoot}
      onBlur={handleBlur}
      tabIndex={0}
      ref={divRef}>
      <MultiStepButton
        {...rest}
        buttonName={isButtonSelected ? "unlink" : "link"}
        triggerAction={triggerAction}
        isMultiStep={true}
        propsData={propsData.current}
        onClick={handleClick}
        onButtonClickStatusChange={handleToggleButtonStatus}>
        {isButtonSelected ? (
          unlinkIcon ? (
            unlinkIcon
          ) : (
            <TbLinkOff className={css.btnIcon} />
          )
        ) : linkIcon ? (
          linkIcon
        ) : (
          <TbLinkPlus className={css.btnIcon} />
        )}
      </MultiStepButton>
      <InsertLinkContainer
        className={linkClass}
        inputRef={containerRefcb}
        onInsert={handleLinkInsert}
        onCancel={handleCancel}
      />
    </div>
  );
}

function HeadingButton<T extends TopbarButtonKeys>(
  props: ExtendedButtonProps<T>
) {
  const { changeCurrentCursor, dropdownClassName, dropdownIcon } = props;
  const afterStyleApplied = (params?: unknown) => {
    const container = params as HTMLElement;
    if (container) {
      changeCurrentCursor(container);
    }
  };

  return (
    <MultiStepButton
      {...props}
      buttonName={"heading"}
      onClick={afterStyleApplied}
      onRender={(renderProps) => {
        const { onApplyStyle } = renderProps;
        const handleSelect = (value: string) => {
          onApplyStyle({ tagName: value });
        };
        return (
          <HeaderSelect
            onSelect={handleSelect}
            dropdownClassName={dropdownClassName}
            dropdownIcon={dropdownIcon}
          />
        );
      }}
    />
  );
}

export const topbarButtons: any = {
  bold: BoldButton,
  italic: ItalicButton,
  underLine: UnderlineButton,
  heading: HeadingButton,
  justifyLeft: JustifyLeftButton,
  justifyCenter: JustifyCenterButton,
  justifyRight: JustifyRightButton,
  justifyFull: JustifyFullButton,
  orderedList: OrderedListButton,
  unorderedList: UnorderedListButton,
  emoji: EmojiButton,
  link: LinkButton,
};
