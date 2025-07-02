/* @ts-ignore */
import { views } from "virtual:views";

/* @ts-ignore */
import data from "virtual:data";

export async function action() {
  console.log({ data });
  const main = views.find((i: any) => i.route === "counter");
  const mmm = await import(main.path);
  mmm.setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
}
