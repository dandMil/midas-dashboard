import React, { useState } from "react";
import "./css/LlmPlugin.css";
import { queryLlm } from "../services/api.tsx";

const LlmPlugin: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      setResponse("Please enter a query.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await queryLlm({ query: inputText }); // Pass inputText as the query payload
      console.log("Result from LLM query: ", result);

      if (result && result.answer) {
        setResponse(result.answer);
      } else {
        console.error("No answer found in the LLM response:", result);
        setResponse("No answer available");
      }
    } catch (error) {
      console.error("Error during LLM query:", error);
      setResponse("Error processing your request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatgpt-container">
      <textarea
        placeholder="Type your query here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="chatgpt-textarea"
      />
      <button onClick={handleSubmit} disabled={isLoading} className="chatgpt-button">
        {isLoading ? "Sending..." : "Send"}
      </button>
      <div className="chatgpt-response">
        <h3>Response:</h3>
        <p>{response || "No response yet."}</p>
      </div>
    </div>
  );
};

export default LlmPlugin;
