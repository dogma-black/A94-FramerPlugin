type Permission = "showPrompt" | "setPluginData";

interface WithPermissionOptions {
    permission: Permission;
    action: () => Promise<any>;
}

/**
 * A utility function to wrap Framer API calls that may require permissions.
 * In this basic implementation, we are directly executing the action,
 * assuming that Framer's environment will handle the permission prompts
 * at runtime. A more advanced version could check permissions first
 * using a hypothetical `framer.hasPermission` or `framer.requestPermission`.
 */
export const withPermission = async ({ action }: WithPermissionOptions): Promise<any> => {
    try {
        // Directly execute the action. Framer should handle permission prompts.
        return await action();
    } catch (error) {
        console.error(`Error executing action requiring permission:`, error);
        // Re-throw the error to be handled by the calling function
        throw error;
    }
};
