import JSZip from "jszip";
import type { DirectoryNode, FileNode, FileSystemTree } from "@webcontainer/api";

function addToZip(zip: JSZip, tree: FileSystemTree) {
  for (const [name, node] of Object.entries(tree)) {
    if ("directory" in node) {
      const folder = zip.folder(name)!;
      addToZip(folder, (node as DirectoryNode).directory);
    } else if ("file" in node) {
      const contents = (node as FileNode).file.contents ?? "";
      zip.file(name, contents);
    }
  }
}

export async function buildZipFromFiles(
  files: FileSystemTree
): Promise<Blob> {
  const zip = new JSZip();
  addToZip(zip, files);
  return zip.generateAsync({ type: "blob" });
}

export function downloadZip(
  files: FileSystemTree,
  filename = "project.zip"
) {
  buildZipFromFiles(files).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
