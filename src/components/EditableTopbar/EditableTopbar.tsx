import React, { useMemo } from "react";
import { TopbarButtonKeys, TopbarButtonSelectFunc } from "../../constant";

import css from "./EditableTopbar.module.css";
import { topbarButtons } from "./buttons";
import { classnames } from "../../utills";

type FilterTopbarButtonKeys = Exclude<
  TopbarButtonKeys,
  "link" | "unlink" | "heading"
>;

export type TopbarControlOption = {
  [name in FilterTopbarButtonKeys]?: {
    icon?: React.JSX.Element;
    show?: boolean;
    className?: string;
  };
} & {
  link: {
    linkIcon?: React.JSX.Element;
    show?: boolean;
    className?: string;
    unlinkIcon?: React.JSX.Element;
  };
  heading: {
    dropdownIcon?: React.JSX.Element;
    show?: boolean;
    className?: string;
    dropdownClassName?: string;
  };
};

type EditableTopbar = {
  controlOptions?: TopbarControlOption;
  className?: string;
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

const defaultTopbarOptions: TopbarControlOption = {
  bold: { show: true },
  italic: { show: true },
  underLine: { show: true },
  heading: { show: true },
  justifyLeft: { show: true },
  justifyCenter: { show: true },
  justifyRight: { show: true },
  justifyFull: { show: true },
  orderedList: { show: true },
  unorderedList: { show: true },
  emoji: { show: true },
  link: { show: true },
};

function EditableTopbar(props: EditableTopbar) {
  const {
    controlOptions = {} as TopbarControlOption,
    className,
    isInputClicked,
    changeCurrentCursor,
    getInputRef,
    getCursorContainerRef,
    updatedTextContent,
  } = props;

  const updatedControlOptions = useMemo(() => {
    return Object.entries(defaultTopbarOptions).map((entry) => {
      const [name, value] = entry;
      const strName = name as Exclude<TopbarButtonKeys, "unlink">;
      const modifiedValue = { ...value, ...controlOptions?.[strName] };
      return { ...modifiedValue, name };
    });
  }, [controlOptions]);

  const rootClasses = classnames(css.topbarRoot, className);

  return (
    <div className={rootClasses} style={{ width: "100%" }}>
      {updatedControlOptions.map((option) => {
        const {
          show,
          icon,
          linkIcon,
          unlinkIcon,
          className,
          name,
          dropdownClassName,
          dropdownIcon,
        } = option as any;
        const Comp = show ? topbarButtons[name] ?? null : null;
        if (Comp === null) return null;
        return (
          <Comp
            key={name}
            icon={icon}
            linkIcon={linkIcon}
            unlinkIcon={unlinkIcon}
            className={className}
            dropdownClassName={dropdownClassName}
            dropdownIcon={dropdownIcon}
            getCursorContainerRef={getCursorContainerRef}
            isInputClicked={isInputClicked}
            changeCurrentCursor={changeCurrentCursor}
            getInputRef={getInputRef}
            updatedTextContent={updatedTextContent}
          />
        );
      })}
    </div>
  );
}

export default EditableTopbar;
