export default () => ({
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    indexName: process.env.PINECONE_INDEX_NAME || 'portfolio-free',
  },
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseUrl:
      process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_LLM_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    chatModel:
      process.env.NVIDIA_CHAT_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
    fastModel:
      process.env.NVIDIA_FAST_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
      : [
          'http://localhost:5173',
          'https://portfolio-omega-vert-ehkt9x89mo.vercel.app',
        ],
  },
});
