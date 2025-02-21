/* @ts-ignore */
import { views } from "virtual:routes";

export async function action() {
  const main = views.find((i: any) => i.route === "counter");
  const mmm = await import(main.path);
  mmm.setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
}
