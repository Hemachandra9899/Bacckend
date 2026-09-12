import express from "express";
import { sendNote, getNotes } from "../controllers/userController.js";

const Route = express.Router();

// ✅ Add route descriptions for debugging
console.log('📦 Loading user routes...');

// Create a new note
Route.post('/note', sendNote);

// Search/get notes with AI
Route.get('/getnotes', getNotes);

console.log('✅ User routes loaded successfully');

// ✅ FIX 2: Use ES6 export, not CommonJS
export default Route;
