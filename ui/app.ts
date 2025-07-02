/* @ts-ignore */
import { views } from "virtual:views";
/* @ts-ignore */
import routes from "virtual:routes";

export async function action() {
  console.log({ routes });
  const main = views.find((i: any) => i.route === "counter");
  const mmm = await import(main.path);
  mmm.setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
}
