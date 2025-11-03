import { useState } from "react";
import { framer } from "framer-plugin";
import "./ApiPanel.css";

interface ApiPanelProps {
    onClose: () => void;
}

export function ApiPanel({ onClose }: ApiPanelProps) {
    const [apiKey, setApiKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!apiKey.trim()) {
            framer.showToast({ variant: "error", message: "API Key cannot be empty." });
            return;
        }
        setIsSaving(true);
        try {
            await framer.setPluginData("gemini_api_key", apiKey);
            framer.showToast({ variant: "success", message: "API Key saved successfully!" });
            onClose();
        } catch (error) {
            framer.showToast({ variant: "error", message: "Failed to save API Key." });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="api-panel-overlay">
            <div className="api-panel-container">
                <h2>Set Your Gemini API Key</h2>
                <p>You can get your API key from Google AI Studio.</p>
                <input
                    type="password"
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                />
                <div className="api-panel-buttons">
                    <button className="close-button" onClick={onClose}>Close</button>
                    <button className="save-button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
