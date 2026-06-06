export type GeneratedToolImage = {
  id: string;
  blob: Blob;
  url: string;
  filename: string;
  pageIndex: number;
  pageCount: number;
};

export type ToolsLauncherCardProps = {
  onOpenTextToImagePost: () => void;
};
