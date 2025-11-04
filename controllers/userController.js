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
const getNotes = async (req, res) => {
  try {
    const { query } = req.query;
    
    // ✅ FIX 6: Added return statement
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

    if (matches.length === 0) {
      // ✅ FIX 7: Let AI handle "no results" case
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a helpful and friendly personal assistant...`
          },
          {
            role: "user",
            content: `The user asked: "${query}"
      
      Here is the most relevant note from their database:
      ${formattedResults}
      
      Please provide a helpful, conversational answer that addresses their query using the information from this note.`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiAnswer = completion.choices[0].message.content.trim();
      return res.json({
        success: true,
        answer: aiAnswer,
        foundResults: false
      });
    }

    // ✅ FIX 8: Format results with better structure
    const formattedResults = matches.map((m, i) => 
      `${i + 1}. Title: "${m.metadata?.title}"\n   Description: "${m.metadata?.description}"\n   Relevance: ${(m.score * 100).toFixed(1)}%`
    ).join("\n\n");

    console.log("📝 Formatted results:\n", formattedResults);

    // 3️⃣ Ask Groq model to generate natural response
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
            role: "system",
            content: `You are a concise, friendly personal assistant speaking as Hemachandra in first person.
          
          Your job:
          - Answer the user's question using the note(s) I give you.
          - Keep it short and focused: 2–4 sentences, max ~90 words.
          - Start directly with the answer, don't restate the question.
          - Use simple, clear language.
          - If the note doesn't fully answer the question, briefly say that and give one helpful suggestion.`
          }
          ,
        {
          role: "user",
          content: `The user asked: "${query}"

Here are the relevant notes from their database:
${formattedResults}

Please provide a helpful, conversational answer that addresses their query using the information from these notes.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiAnswer = completion.choices[0].message.content.trim();
    console.log("🤖 AI Response generated");

    // 4️⃣ Send back AI answer as plain text
    // ✅ FIX 9: Set proper content type for text response
    res.setHeader('Content-Type', 'text/plain');
    res.send(aiAnswer);

  } catch (err) {
    console.error("❌ Error searching notes:", err);
    res.status(500).json({ 
      success: false,
      message: "Error searching notes",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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