/* @ts-ignore */
import { views } from "virtual:routes";

export function setupCounter(element: HTMLButtonElement) {
  let counter = 4
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))

  setCounter(0)
}

