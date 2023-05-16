import { useStyle } from "./library";

type c = TemplateStringsArray;
function App() {
  const className = useStyle`
    background-color: red;
    color: white;
    position: relative;
    &::after {
      position:absolute;
      inset: 0;
      translateX: 100px;
      background-color: green;
  }`;

  return (
    <div className={className}>
      <h1>hello</h1>
    </div>
  );
}

export default App;
