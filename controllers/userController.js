// controllers/notesController.js


import { getFreeEmbedding, index } from "../services/getEmbeddings.js";
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================
// CREATE NOTE (Send Note)
// ============================================
const sendNote = async (req, res) => {
  try {
    // ✅ FIX 1: Fixed typo - "discription" → "description"
    const { title, description } = req.body;
    
    // ✅ FIX 2: Corrected validation
    if (!title || !description) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide both title and description" 
      });
    }

    console.log("📝 Creating note:", { title, description });

    // ✅ FIX 3: Generate unique ID (was missing)
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate embeddings
    const embeddings = await getFreeEmbedding(`${title} ${description}`);
    console.log("✅ Generated embeddings, dimension:", embeddings.length);

    // Prepare record for Pinecone
    const records = [
      {
        id: id,
        values: embeddings,
        metadata: {
          title: title,
          description: description, // ✅ FIX 4: Fixed spelling
          createdAt: new Date().toISOString(),
        },
      },
    ];

    // Upsert to Pinecone
    const result = await index.upsert(records);
    console.log("✅ Pinecone upsert result:", result);

    res.status(201).json({
      success: true,
      message: "Note saved successfully",
      note: { 
        id, 
        title, 
        description // ✅ FIX 5: Fixed variable name
      },
    });

  } catch (err) {
    console.error("❌ Error saving note:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to save note",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// ============================================
// GET NOTES (Search with AI)
// ============================================
// ============================================
// GET NOTES (Search with AI)
// ============================================
const getNotes = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required"
      });
    }

    console.log("🔍 Searching for:", query);

    // 1️⃣ Convert query into embedding
    const queryVector = await getFreeEmbedding(query);
    console.log("✅ Generated embedding for query, dimension:", queryVector.length);

    // 2️⃣ Search in Pinecone
    const searchResponse = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true,
    });

    const matches = searchResponse.matches || [];
    console.log(`📊 Found ${matches.length} matches`);

    // 🔹 No results: short, kind, professional reply
    if (matches.length === 0) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a concise, warm, and professional personal assistant for Hemachandra.

Your job:
- Let the user know that no saved notes matched their question.
- Sound empathetic and encouraging.
- Reply in one or two short sentences.
- Invite them to rephrase or ask something else.`
          },
          {
            role: "user",
            content: `The user asked: "${query}". No matching notes were found. Write a brief, kind reply.`
          }
        ],
        temperature: 0.5,
        max_tokens: 80,
      });

      const aiAnswer = completion.choices[0].message.content.trim();
      return res.json({
        success: true,
        answer: aiAnswer,
        foundResults: false
      });
    }

    // 🔹 We have matches: format them nicely
    const formattedResults = matches
      .map(
        (m, i) =>
          `${i + 1}. Title: "${m.metadata?.title}"\n   Description: "${m.metadata?.description}"\n   Relevance: ${(m.score * 100).toFixed(1)}%`
      )
      .join("\n\n");

    console.log("📝 Formatted results:\n", formattedResults);

    // 3️⃣ Ask Groq model to generate a short, professional, empathetic response
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are Hemachandra's personal AI assistant.

Tone:
- Calm, friendly, and professional.
- Short and clear: 2–4 sentences, max about 80 words.
- Write in first person as Hemachandra ("I", "my").

Task:
- Use the notes I provide as context to answer the user's question.
- Combine information from multiple notes when helpful.
- If the notes don't fully cover the question, say that briefly and suggest one simple next step or clarification.`
        },
        {
          role: "user",
          content: `The user asked: "${query}"

Here are the relevant notes from their database:
${formattedResults}

Using only this information and reasonable inferences, write a short, natural, and professional answer for the user in first person.`
        }
      ],
      temperature: 0.6,
      max_tokens: 120,
    });

    const aiAnswer = completion.choices[0].message.content.trim();
    console.log("🤖 AI Response generated");

    // 4️⃣ Send back AI answer as plain text
    res.setHeader("Content-Type", "text/plain");
    res.send(aiAnswer);

  } catch (err) {
    console.error("❌ Error searching notes:", err);
    res.status(500).json({
      success: false,
      message: "Error searching notes",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};


// ============================================
// ADDITIONAL HELPER: Get All Notes (Optional)
// ============================================
const getAllNotes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log("📚 Fetching all notes...");

    // Use a zero vector to retrieve records
    const dummyVector = Array(1536).fill(0).map(() => Math.random());

    const response = await index.query({
      vector: dummyVector,
      topK: parseInt(limit),
      includeMetadata: true,
      includeValues: false,
    });

    const notes = response.matches?.map(match => ({
      id: match.id,
      title: match.metadata?.title,
      description: match.metadata?.description,
      createdAt: match.metadata?.createdAt,
      score: match.score
    })) || [];

    res.json({
      success: true,
      count: notes.length,
      notes: notes
    });

  } catch (err) {
    console.error("❌ Error fetching all notes:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch notes" 
    });
  }
};

// ============================================
// DELETE NOTE (Optional)
// ============================================
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: "Note ID is required" 
      });
    }

    console.log("🗑️ Deleting note:", id);

    // Check if note exists
    const fetchResponse = await index.fetch([id]);
    if (!fetchResponse.records[id]) {
      return res.status(404).json({ 
        success: false,
        message: "Note not found" 
      });
    }

    // Delete from Pinecone
    await index.deleteOne(id);

    res.json({
      success: true,
      message: "Note deleted successfully",
      deletedId: id
    });

  } catch (err) {
    console.error("❌ Error deleting note:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete note" 
    });
  }
};

// ✅ FIX 10: Use ES6 export instead of CommonJS
export { sendNote, getNotes, getAllNotes, deleteNote };

// ❌ Don't use:
// module.exports = { sendNote, getNotes };
// Because you're using ES6 imports at the top