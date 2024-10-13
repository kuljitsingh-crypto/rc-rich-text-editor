import React, { useEffect, useState } from "react";
import { Option, Select } from "rc-simple-select";
import css from "./HeaderSelect.module.css";
import { useHeadingPubSubContext } from "../../hooks";
import { classnames } from "../../utills";

const options = [
  { value: "p", label: "Normal" },
  { value: "h1", label: "H1" },
  { value: "h2", label: "H2" },
  { value: "h3", label: "H3" },
  { value: "h4", label: "H4" },
  { value: "h5", label: "H5" },
  { value: "h6", label: "H6" },
];

type HeadingProps = {
  onSelect: (value: string) => void;
  dropdownClassName?: string;
  className?: string;
  dropdownIcon?: React.JSX.Element;
};

function HeaderSelect(props: HeadingProps) {
  const { onSelect, dropdownClassName, className, dropdownIcon } = props;
  const [headerTag, setHeaderTag] = useState("p");
  const { subscribeHeaderCb, unsubscribeHeaderSb } = useHeadingPubSubContext();

  const updatedHeadingTag = (tagName: string) => {
    setHeaderTag(tagName);
  };

  const handleSelect = (tag: string) => {
    setHeaderTag(tag);
    onSelect(tag);
  };

  useEffect(() => {
    subscribeHeaderCb(updatedHeadingTag);
    return () => {
      unsubscribeHeaderSb();
    };
  }, []);

  const classes = classnames(css.headerRoot, className);

  const Icon = dropdownIcon
    ? (props: any) => {
        const { className } = props;
        return <span className={className}>{dropdownIcon}</span>;
      }
    : null;

  return (
    <div className={classes}>
      <Select
        onSelect={handleSelect}
        values={headerTag}
        selectClassName={dropdownClassName}
        {...(Icon ? { IconComponent: Icon } : {})}
        optionShowerClassName={css.optionShow}>
        {options.map((otp) => {
          const Comp = otp.value as any;
          return (
            <Option value={otp.value} key={otp.value}>
              <Comp className={css.selectOption}>{otp.label}</Comp>
            </Option>
          );
        })}
      </Select>
    </div>
  );
}

export default HeaderSelect;
