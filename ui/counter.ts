export function setupCounter(element: HTMLButtonElement) {
  let counter = 1;
  const setCounter = (count: number) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
  };
  element.addEventListener("click", () => setCounter(counter + 3));
}
