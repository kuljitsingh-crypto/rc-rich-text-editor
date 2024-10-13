import React, { MutableRefObject, useState } from "react";
import { MdCheckBoxOutlineBlank, MdCheckBox } from "react-icons/md";
import css from "./InsertLinkContainer.module.css";
import { classnames } from "../../utills";

type InsertLinkContainerProps = {
  onCancel?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onInsert?: (params: {
    title: string;
    url: string;
    openInNewTab: boolean;
  }) => void;
  className?: string;
  inputRef?:
    | MutableRefObject<HTMLElement | null>
    | ((el: HTMLElement | null) => void);
};

function InsertLinkContainer(props: InsertLinkContainerProps) {
  const { onCancel, onInsert, className, inputRef } = props;
  const [linkDetails, setLinkDetails] = useState({ title: "", url: "" });
  const [isOpenInNewWindow, setIsOpenInNewWindow] = useState(false);
  const submitDisabled = !linkDetails.title || !linkDetails.url;

  const handleInputChange =
    (name: "title" | "url") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLinkDetails((linkDetails) => ({ ...linkDetails, [name]: value }));
    };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpenInNewWindow((isOpenInNewWindow) => !isOpenInNewWindow);
  };

  const resetContent = () => {
    setLinkDetails({ title: "", url: "" });
    setIsOpenInNewWindow(false);
  };
  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resetContent();
    if (typeof onCancel === "function") {
      onCancel(e);
    }
  };

  const handleInsert = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitDisabled) return;
    if (typeof onInsert === "function") {
      const data = { ...linkDetails, openInNewTab: isOpenInNewWindow };
      resetContent();
      onInsert(data);
    }
  };

  const refCb = (el: HTMLDivElement) => {
    if (!el || !inputRef) return;
    if (typeof inputRef === "function") {
      inputRef(el);
    } else {
      inputRef.current = el;
    }
  };

  const rootClasses = classnames(css.root, className);
  return (
    <div className={rootClasses} ref={refCb}>
      <div className={css.inputDiv}>
        <label htmlFor='insert-link-title'>Title</label>
        <input
          type='text'
          id='insert-link-title'
          name='title'
          onChange={handleInputChange("title")}
          value={linkDetails.title}
          placeholder="Insert link's title"
          className={classnames(css.input, {
            [css.filledInput]: !!linkDetails.title,
          })}
        />
      </div>
      <div className={css.inputDiv}>
        <label htmlFor='insert-link-url'>Url</label>
        <input
          type='text'
          id='insert-link-url'
          name='url'
          onChange={handleInputChange("url")}
          value={linkDetails.url}
          placeholder='Insert link'
          className={classnames(css.input, {
            [css.filledInput]: !!linkDetails.url,
          })}
        />
      </div>
      <div className={css.checkboxDiv}>
        <input
          type='checkbox'
          id='open-link-new-window'
          name='openInNewWindow'
          checked={isOpenInNewWindow}
          onChange={handleCheck}
        />
        <label htmlFor='open-link-new-window'>
          {isOpenInNewWindow ? (
            <MdCheckBox className={css.checkboxIcon} />
          ) : (
            <MdCheckBoxOutlineBlank className={css.checkboxIcon} />
          )}
          Open link in new tab
        </label>
      </div>
      <div className={css.btnDiv}>
        <button
          type='button'
          onClick={handleInsert}
          className={css.insertButton}
          disabled={submitDisabled}>
          Insert
        </button>
        <button
          onClick={handleCancel}
          type='button'
          className={css.cancelButton}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default InsertLinkContainer;
