import { useState } from "react";
import { framer } from "framer-plugin";

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
        <>
            <style>{`
                .api-panel-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .api-panel-container {
                    background-color: #333;
                    color: white;
                    padding: 24px;
                    border-radius: 8px;
                    width: 400px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .api-panel-container h2 {
                    margin: 0;
                    font-size: 18px;
                }
                .api-panel-container p {
                    margin: 0;
                    font-size: 14px;
                    color: #aaa;
                }
                .api-panel-container input {
                    width: 100%;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #555;
                    background-color: #222;
                    color: white;
                    font-family: monospace;
                }
                .api-panel-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }
                .api-panel-buttons button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .api-panel-buttons .save-button {
                    background-color: #0077ff;
                    color: white;
                }
                .api-panel-buttons .close-button {
                    background-color: #555;
                    color: white;
                }
            `}</style>
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
        </>
    );
}
