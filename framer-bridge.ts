import { framer } from "framer-plugin";

/**
 * Creates a new component file in the Framer project.
 * @param componentName The name of the file to create (e.g., "GeneratedComponent.tsx").
 * @param code The TSX code to write into the file.
 */
export const createComponent = async (componentName: string, code: string): Promise<void> => {
    try {
        // Assumes the Framer plugin API provides a method to add files.
        // The path is typically relative to the project's code folder.
        await framer.addFile({
            path: `code/${componentName}`,
            content: code,
        });

        framer.showToast({
            variant: "success",
            message: `Component "${componentName}" created successfully!`,
        });

    } catch (error) {
        console.error("Failed to create component:", error);
        framer.showToast({
            variant: "error",
            message: `Error creating component: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        throw error; // Re-throw to be caught by the calling orchestrator
    }
};
