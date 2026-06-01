#!/usr/bin/env node

/**
 * 🤖 Test Agent Maestro
 * Script para probar que el Agent funciona correctamente
 */

require('dotenv').config();
const path = require('path');

// Verificaciones previas
console.log('🔍 Verificaciones iniciales...\n');

// 1. Verificar Groq API Key
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY no encontrada en .env');
  process.exit(1);
}
console.log('✅ GROQ_API_KEY configurada');

// 2. Verificar que groq-sdk está instalado
try {
  require.resolve('groq-sdk');
  console.log('✅ groq-sdk instalado');
} catch (e) {
  console.error('❌ groq-sdk no está instalado');
  process.exit(1);
}

// 3. Verificar que @langchain/core está instalado
try {
  require.resolve('@langchain/core');
  console.log('✅ @langchain/core instalado');
} catch (e) {
  console.error('❌ @langchain/core no está instalado');
  process.exit(1);
}

console.log('\n📦 Cargando Agent Maestro...\n');

// Importar el agent
const { getAgent } = require('./src/services/aiAgent');

// Función de prueba
async function testAgent() {
  try {
    console.log('🚀 Inicializando Agent...');
    const agent = await getAgent();
    console.log('✅ Agent inicializado correctamente\n');

    // Listar herramientas disponibles
    console.log('🛠️  Herramientas disponibles:');
    const tools = agent.getAvailableTools();
    tools.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name} - ${tool.description}`);
    });

    console.log('\n✨ Agent está listo para usar\n');
    console.log('Ejemplo de uso en API:');
    console.log('POST /api/ai/agent/ask');
    console.log('Body: { "request": "Generate a maintenance report", "context": { "serviceReportId": "..." } }\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar Agent:', error.message);
    process.exit(1);
  }
}

testAgent();
