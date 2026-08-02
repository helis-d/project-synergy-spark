/** Type declarations for the Electron desktop bridge exposed via preload.cjs */
export {};

declare global {
  interface NorthDesktop {
    isDesktop: boolean;
    saveFile: (content: string, defaultName: string, extensions: string[]) => Promise<boolean>;
    closeWindow: () => void;
    onCloseRequested: (callback: () => void) => void;
  }

  interface Window {
    northDesktop?: NorthDesktop;
  }
}
