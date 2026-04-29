import type { DirectoryNode, FileNode, FileSystemTree } from '@webcontainer/api';

/**
 * Flattens a nested FileSystemTree into a simple { "path/to/file": "content" } map.
 * Saves massive token cost when sending to the LLM.
 */
export function flattenTree(tree: FileSystemTree, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, node] of Object.entries(tree)) {
    const path = prefix ? `${prefix}/${name}` : name;
    if ('directory' in node) {
      Object.assign(result, flattenTree((node as DirectoryNode).directory, path));
    } else if ('file' in node) {
      const contents = (node as FileNode).file.contents;
      result[path] =
        typeof contents === 'string' ? contents : new TextDecoder().decode(contents);
    }
  }
  return result;
}

export interface FilePatch {
  type: 'write' | 'delete';
  path: string;
  content?: string;
}


export function applyPatchesToTree(originalTree: FileSystemTree, patches: FilePatch[]): FileSystemTree {
  const newTree: FileSystemTree = structuredClone(originalTree);

  for (const patch of patches) {
    const { type, path, content } = patch;

    const parts = path.split('/');
    const fileName = parts.pop()!;
    let currentDir: FileSystemTree = newTree;

    for (const dirName of parts) {
      if (!currentDir[dirName]) {
        currentDir[dirName] = { directory: {} };
      }
      currentDir = (currentDir[dirName] as DirectoryNode).directory;
    }


    if (type === 'write' && content !== undefined) {
      currentDir[fileName] = {
        file: { contents: content }
      };
    } else if (type === 'delete') {
      delete currentDir[fileName];
    }
  }

  return newTree as FileSystemTree;
}
