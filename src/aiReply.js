// aiReply.js
import fetch from "node-fetch";

async function generateReply(inputText) {
  try {
    const response = await fetch(
      "https://huggingface.co/api-inference/v1/models/facebook/blenderbot-400M-distill",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Reply politely to this message: "${inputText}"`
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return "Sorry, I couldn't generate a reply right now.";
    }

    return data[0]?.generated_text || "No reply generated.";
  } catch (err) {
    console.error("AI error:", err);
    return "Oops, something went wrong while generating the reply.";
  }
}

export default generateReply;  // ✅ Default export