const CLASS_NAME_PREFIX = "rc_simple_select_";

type StringClass = string;
type ObjectClass = { [name: string]: boolean };

type ClassNamesCategory = {
  stringClassNames: string;
  nonStringClassNames: string;
};

const appendClass = (oldValue: string, newValue: string) => {
  const className = oldValue
    ? newValue
      ? oldValue + " " + newValue
      : oldValue
    : newValue;
  return className;
};

const getActiveClassNameFromObject = (obj?: ObjectClass) => {
  if (!obj) return "";
  const entries = Object.entries(obj);
  const stringClassNames = entries.reduce((acc, entry, indx) => {
    const [classname, status] = entry;
    if (status) {
      acc = appendClass(acc, `${CLASS_NAME_PREFIX}${classname}`);
    }
    return acc;
  }, "");
  return stringClassNames;
};

export const classnames = (
  ...classnames: (StringClass | ObjectClass | undefined)[]
) => {
  let { stringClassNames, nonStringClassNames } = classnames.reduce(
    (acc: ClassNamesCategory, classname) => {
      if (typeof classname === "string") {
        const updatedClassname = `${CLASS_NAME_PREFIX}${classname}`;
        acc.stringClassNames = appendClass(
          acc.stringClassNames,
          updatedClassname
        );
      } else {
        acc.nonStringClassNames = appendClass(
          acc.nonStringClassNames,
          getActiveClassNameFromObject(classname)
        );
      }
      return acc;
    },
    {
      stringClassNames: "",
      nonStringClassNames: "",
    } as ClassNamesCategory
  );

  const finalClassName = appendClass(stringClassNames, nonStringClassNames);
  return finalClassName;
};
