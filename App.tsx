import { useState, useEffect, useRef } from "react";
import { generateComponentCode } from "../ai-orchestrator";
import { createComponent } from "../lib/framer-bridge";
import { ApiPanel } from "./components/ApiPanel";
import "./App.css";

interface Message {
  sender: "user" | "ai" | "error";
  content: string;
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInstruction, setUserInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showApiPanel, setShowApiPanel] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGenerate = async () => {
    const currentUserInput = userInstruction.trim();
    if (!currentUserInput) return;

    const lastAiMessage = [...messages].reverse().find((m) => m.sender === "ai");
    const initialCode = lastAiMessage
      ? lastAiMessage.content
      : currentUserInput;
    const userPrompt = lastAiMessage ? currentUserInput : "";

    const newMessages: Message[] = [
      ...messages,
      { sender: "user", content: currentUserInput },
    ];
    setMessages(newMessages);
    setUserInstruction("");
    setIsLoading(true);

    try {
      const generatedCode = await generateComponentCode(initialCode, userPrompt);

      setMessages((prev) => [...prev, { sender: "ai", content: generatedCode }]);

      const componentNameMatch = generatedCode.match(
        /export default function (\w+)/
      );
      const componentName = componentNameMatch
        ? `${componentNameMatch[1]}.tsx`
        : "GeneratedComponent.tsx";

      await createComponent(componentName, generatedCode);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      setMessages((prev) => [
        ...prev,
        { sender: "error", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      {showApiPanel && <ApiPanel onClose={() => setShowApiPanel(false)} />}

      <header className="banner">
        <div className="logo"></div>
        <button className="exit-button"></button>
      </header>

      <div className="line-separator"></div>

      <div className="suggestions-row">{/* ... (suggestion buttons) ... */}</div>

      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            <pre>
              <code>{msg.content}</code>
            </pre>
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble ai loading">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="text-field">
        <div className="text-field-buttons">
          <button className="icon-button attach-button"></button>
          <button className="icon-button time-button"></button>
          <button className="icon-button search-button"></button>
          <button className="icon-button web-button"></button>
          <button
            className="icon-button key-button"
            onClick={() => setShowApiPanel(true)}
          ></button>
        </div>
        <textarea
          className="prompt-input"
          placeholder="Pega tu código o describe el componente..."
          value={userInstruction}
          onChange={(e) => setUserInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          disabled={isLoading}
          rows={3}
        />
        <button
          className="send-button"
          onClick={handleGenerate}
          disabled={isLoading}
        ></button>
      </div>
    </main>
  );
}
