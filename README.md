# CSS-in-JS: A Critical Examination

This article presumes your familiarity with various styling methods.

### CSS-in-JS: Solutions it Aims to Provide:

- Scoped styles: Prevents style leakage to unrelated components.
- Dynamic styles: Enables style adaptability based on properties, state, or other dynamic data.
- Collocation: Enhances maintainability by co-locating styles and components.

### The Mechanics of CSS-in-JS:

- **Parsing styles**: Transforms styles from JavaScript objects or tagged template literals into CSS format.
- **Generating unique class names**: Crafts a unique, hash-based class name for each style set, scoping them to designated components.
- **Handling dynamic styles**: Updates styles based on component properties or state changes, generates new class names if required, and injects the updated styles into the DOM.
- **Injecting styles into the DOM**: Constructs a `<style>` element, attaches it to the `<head>`, and updates its content with the generated CSS. This action prompts the browser to recalculate styles.
- **Managing the CSS cache**: Upholds a cache of generated styles to enhance performance and prevent unnecessary re-rendering.
- **Server-side rendering**: Extracts generated styles on the server and includes them in the initial HTML payload.

```js
// Simplified CSS-in-JS implementation
function parseStyles(styles) {...}
function generateClassName(styles) {...}
function injectStyles(css) {...}
function updateDynamicStyles(component) {...}

const styles = {color: "red", fontSize: "14px"};
const css = parseStyles(styles);
const className = generateClassName(styles);
injectStyles(css);
element.className = className;
updateDynamicStyles(component);
```

## The Hurdles of `styled` HOC

At its core, `styled` offers a way to encapsulate styles within HTML elements.

```ts
const Button = styled.button`
  /* ... */
`;
```

However, this approach hinders style reusability across elements. Libraries offer the `as` prop as a solution, but this often leads to poor abstractions and complicates TypeScript typing.

Check this example from `styled-components` types:

```ts
export interface ThemedStyledFunction<
  C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
  T extends object,
  O extends object = {},
  A extends keyof any = never
> extends ThemedStyledFunctionBase<C, T, O, A> {
  // Fun thing: 'attrs' can also provide a polymorphic 'as' prop
  // My head already hurts enough so maybe later...
  attrs<
    U,
    NewA extends Partial<StyledComponentPropsWithRef<C> & U> & {
      [others: string]: any;
    } = {}
  >(
    attrs: Attrs<StyledComponentPropsWithRef<C> & U, NewA, T>
  ): ThemedStyledFunction<C, T, O & NewA, A | keyof NewA>;
  // ...
}
```

Alternatively, we could utilize classes, circumventing the ordeal of identifying or modifying component HTML elements.

```tsx
<Button as="a" />;
// vs
<>
  <button className={styles.button} />
  {/* WOW: classes are making a comeback in frontend development */}
  <button className={clsx(styles.button, styles.hoverable)} />
  <a className={styles.button} />
</>;
```

### Issues with CSS-in-JS:

- Overhead due to runtime transformations
- Slower rendering phase compared to traditional CSS
- Additional CSS parser load on the browser
- Repeated CSS parsing and injection when values change

### Measuring Performance Overhead:

This benchmark was used in `styled-components` repo for performance overview 
([original repo](https://github.com/styled-components/styled-components/tree/main/packages/benchmarks)).
But it was't fair enough because, `styled-components` used inline styles for dynamic styles, that can't tell
anything about performance of dynamic styles.
<details>
<summary>How i fixed this issue</summary>

Original version:
```tsx
const Dot = styled(View).attrs((p) => ({
  style: { borderBottomColor: p.color },
}))`
  position: absolute;
  cursor: pointer;
  width: 0;
  height: 0;
  border-color: transparent;
  border-style: solid;
  border-top-width: 0;
  transform: translate(50%, 50%);
  margin-left: ${(props) => `${props.x}px`};
  margin-top: ${(props) => `${props.y}px`};
  border-right-width: ${(props) => `${props.size / 2}px`};
  border-bottom-width: ${(props) => `${props.size / 2}px`};
  border-left-width: ${(props) => `${props.size / 2}px`};
`;
```

So i just replaced inline styles with `styled`

```tsx
const Dot = styled(View)`
  /* ... */
  border-bottom-color: ${(props) => props.color};
  /* ... */
`;
```



</details>

> *Overhead can range from [0.5x-2x] depending on the device or library, but they all use the same technique for styling* 
> 
> Benchmark was executed on a laptop with Ryzen 4600h, GTX 1650, 32 GB RAM.

Benchmark results:
![CSS in JS vs CSS](./css_in_js_bench.png)

> Feel free to experiment with the benchmark playground: [here](https://xantregodlike.github.io/article-css-in-js/)
>
> [*source code*](https://github.com/XantreGodlike/article-css-in-js/tree/main/styled-components/packages/benchmarks)

<details>
<summary>Fixed benchmark results:</summary>

![CSS in JS vs CSS](./css_in_js_fixed.png)

</details>

| Benchmark          | Overhead of CSS in JS (styled-components) |
| ------------------ | ----------------------------------------- |
| Mounting deep tree | 20%                                       |
| Mounting wide tree | 13.1%                                     |
| Updating dynamic   | 489.1%                                    |
| Updating static    | 68.8%                                     |

The performance of styled-components decreases fourfold when borderBottomColor is shifted from inline styles to styled.

### Solutions:

- Limit the dynamic nature of style templates
- Utilize selectors and variables for dynamic components
- Transition to build-time CSS-in-JS libraries, such as Linaria
- For greenfield projects, contemplate the utility CSS approach (like Tailwind)

### Benefits of Utility CSS Approach (Tailwind):

- Framework agnostic
- JIT compilation of classes for build-time dynamic classes
- Faster performance
- Transparent, zero-abstraction styling
- Easy setup in any environment
- Less code and adaptive abstractions
