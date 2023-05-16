import React, { useInsertionEffect, useMemo } from "react";
import { transformProps } from "react-fast-hoc";

const selectorRegEx = /&(?<selector>(\s|.)*)\{(?<content>(\s|.)*)\}?/g;
const MOCK_CLASS_NAME_SELECTOR = "$selector$";
const mockParentSelectorRegEx = /$selector$/g;
const CACHE = new Map<
  string,
  { count: number; className: string; node: Element }
>();
const createStylesWrappedWithSelector = (styles: string, className: string) =>
  `${className}{${styles}}`;

const transformTemplate = (styles: string) => {
  const selectors = [...styles.matchAll(selectorRegEx)];

  if (!selectors.length) {
    return createStylesWrappedWithSelector(styles, MOCK_CLASS_NAME_SELECTOR);
  }
  let res = "";
  const appendRes: { selector: string; content: string }[] = [];
  let lastIndex = 0;
  selectors.forEach((regArr) => {
    const [start, end] = regArr.indices![0];
    res += styles.slice(lastIndex, start);
    lastIndex = end;
    const { selector, content } = regArr.groups!;
    appendRes.push({ selector, content });
  });
  res += styles.slice(lastIndex, -1);

  const cacheString = `${createStylesWrappedWithSelector(
    res,
    MOCK_CLASS_NAME_SELECTOR
  )}\n${appendRes
    .map(({ content, selector }) =>
      createStylesWrappedWithSelector(
        content,
        `${MOCK_CLASS_NAME_SELECTOR}${selector}`
      )
    )
    .join("\n")}`;
  return cacheString;
};

const generateClassName = () => `css-${Math.random().toString(36).slice(2, 9)}`;

const getCache = (styles: string) => {
  const cache = CACHE.get(styles) ?? {
    count: 0,
    className: generateClassName(),
    node: document.createElement("style"),
  };
  CACHE.set(styles, cache);

  return cache;
};

const useStyleCache = (stylesTemplate: string) => {
  const cache = useMemo(() => getCache(stylesTemplate), [stylesTemplate]);
  const actualStyles = useMemo(
    () =>
      stylesTemplate.replace(mockParentSelectorRegEx, "." + cache.className),
    [stylesTemplate, cache.className]
  );
  useInsertionEffect(() => {
    if (cache.node.textContent !== actualStyles) {
      cache.node.textContent = actualStyles;
    }
  }, [cache, actualStyles]);
  useInsertionEffect(() => {
    if (cache.count === 0) {
      document.head.append(cache.node);
    }
    cache.count++;
    return () => {
      cache.count--;
      if (cache.count > 0) {
        return;
      }
      cache.node.remove();
    };
  }, [cache]);

  return cache.className;
};

export const useStyle = (
  pattern: TemplateStringsArray,
  ...insetrions: (string | number)[]
) => {
  const styles = pattern.reduce(
    (acc, cur, index) => acc + cur + (insetrions[index] ?? "").toString(),
    ""
  );
  const stylesTemplate = useMemo(() => transformTemplate(styles), [styles]);

  return useStyleCache(stylesTemplate);
};

type DynamicInsertion<Props> =
  | string
  | number
  | ((props: Props) => string | number);
const executeTemplateFromProps =
  <Props>(
    pattern: TemplateStringsArray,
    ...insetrions: DynamicInsertion<Props>[]
  ) =>
  (props: Props) =>
    pattern.reduce(
      (acc, cur, index) =>
        acc +
        cur +
        (typeof insetrions[index] === "function"
          ? insetrions[index](props)
          : insetrions[index] ?? ""
        ).toString(),
      ""
    );

export const styled =
  <T extends React.ComponentType<any>>(Component: T) =>
  (
    pattern: TemplateStringsArray,
    ...insetrions: DynamicInsertion<React.ComponentPropsWithRef<T>>[]
  ) =>
    transformProps(
      Component,
      (props) => ({
        ...props,
        className: [
          props?.className,
          useStyle`${executeTemplateFromProps(pattern, ...insetrions)(props)}`,
        ]
          .filter(Boolean)
          .join(" "),
      }),
      {
        namePrefix: "Styled.",
      }
    );
