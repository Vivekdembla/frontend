import { FileSystemTree, WebContainer } from "@webcontainer/api";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import { FileStructure } from "../types";

export const convertFileStructureToContent = (
    fileStructure: FileStructure[]
): Record<string, any> => {
    const content: Record<string, any> = {};

    const traverse = (items: FileStructure[]): Record<string, any> => {
        const result: Record<string, any> = {};
        items.forEach((item) => {
            if (item.type === "file" && item.content) {
                // Add file structure
                result[item.name] = { file: { contents: item.content } };
            } else if (item.type === "folder" && item.children) {
                // Add folder structure
                result[item.name] = { directory: traverse(item.children) };
            }
        });
        return result;
    };

    Object.assign(content, traverse(fileStructure));
    return content;
};

export function parseFileStructure(input: string): FileStructure[] {
    // Replace \n in the input string with actual newlines
    const normalizedInput = input.replace(/\\n/g, "\n");

    // Regex to match <boltAction type="file" filePath="..."> ... </boltAction>
    const regex =
        /<boltAction[^>]+type="file"[^>]*filePath="([^"]+)"[^>]*>([\s\S]*?)<\/boltAction>/g;
    const filePaths: { path: string; content: string }[] = [];

    let match;
    while ((match = regex.exec(normalizedInput)) !== null) {
        const path = match[1]; // File path
        const content = match[2].trim(); // File content
        filePaths.push({ path, content });
    }

    const buildStructure = (
        paths: { path: string; content: string }[]
    ): FileStructure[] => {
        const root: FileStructure[] = [];

        paths.forEach(({ path, content }) => {
            const parts = path.split("/"); // Split the file path by '/'
            let currentLevel = root;
            parts.forEach((part, index) => {
                let existing = currentLevel.find((item) => item.name === part);

                if (!existing) {
                    if (index === parts.length - 1) {
                        // Create a file
                        existing = {
                            name: part,
                            type: "file",
                            content,
                            path: path,
                        };
                    } else {
                        // Create a folder
                        existing = {
                            name: part,
                            type: "folder",
                            children: []
                        };
                    }
                    currentLevel.push(existing);
                }

                if (existing.type === "folder") {
                    currentLevel = existing.children!;
                }
            });
        });

        return root;
    };

    return buildStructure(filePaths);
}

export const renderCode = async (webcontainerInstance: WebContainer | undefined, contentToTransfer: FileSystemTree, setSource: any) => {
    if (webcontainerInstance && contentToTransfer) {
        try {
            setSource("");
            await webcontainerInstance.mount(contentToTransfer);
            // Install dependencies
            const installProcess = await webcontainerInstance.spawn("npm", [
                "install",
            ]);
            await installProcess.exit;

            await webcontainerInstance.spawn("npm", ["install", "autoprefixer"]);

            // Start development server
            const devProcess = await webcontainerInstance.spawn("npm", [
                "run",
                "dev",
            ]);
            devProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log(`[Dev Output]: ${data.toString()}`);
                    },
                    abort(err) {
                        console.error(`[Dev Error]: ${new TextDecoder().decode(err)}`);
                    },
                })
            );

            // Handle server ready event
            webcontainerInstance.on("server-ready", (port, url) => {
                console.log(`Server is ready on ${url}`);
                setSource(url);
            });
        } catch (error) {
            console.log(error, 'ghbnjuhjh')
        }

    }
};

export async function downloadZip(fileStructure: FileStructure[]) {
    const zip = new JSZip();

    // Get the project name from the description input, or use a default name
    const projectName = ('project').toLocaleLowerCase().split(' ').join('_');

    // Generate a simple 6-character hash based on the current timestamp
    const timestampHash = Date.now().toString(36).slice(-6);
    const uniqueProjectName = `${projectName}_${timestampHash}`;
    const codebase = await constructStructure(zip, fileStructure);
    const content = await codebase.generateAsync({ type: 'blob' });
    saveAs(content, `${uniqueProjectName}.zip`);
}

async function constructStructure(zip: JSZip, fileStructure: FileStructure[]) {
    for (const { name, type, content, children } of fileStructure) {
        if (type === 'file') {
            zip.file(name, content);
        } else {
            const folder = zip.folder(name);
            if (children && folder) constructStructure(folder, children)
        }
    }

    return zip;
}