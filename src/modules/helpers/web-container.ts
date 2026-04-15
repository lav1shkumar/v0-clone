import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer() {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    try {
      const instance = await WebContainer.boot();
      webcontainerInstance = instance;
      return instance;
    } catch (e) {
      bootPromise = null;
      throw e;
    }
  })();

  return bootPromise;
}
