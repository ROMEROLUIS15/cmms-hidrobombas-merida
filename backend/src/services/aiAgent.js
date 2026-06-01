/* eslint-disable no-console */
/**
 * 🤖 AI Agent Maestro - Orquestador de todas las herramientas IA
 * 
 * Un único agente que:
 * 1. Recibe el input del usuario
 * 2. Decide qué herramienta usar
 * 3. La ejecuta
 * 4. Retorna el resultado
 */

let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (_e) {
  // Anthropic es opcional, usar solo si está instalado
  Anthropic = null;
}

const {
  generateReportTool,
  askEquipmentTool,
  detectAnomalyTool,
  recommendMaintenanceTool,
  compareEquipmentTool,
  executiveSummaryTool
} = require('./aiTools');

// Inicializar cliente de Groq o Anthropic
let llmClient = null;

const initializeLLMClient = () => {
  const apiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('No LLM API key found. Set GROQ_API_KEY or ANTHROPIC_API_KEY in .env');
  }

  // Si usas Groq
  if (process.env.GROQ_API_KEY) {
    const Groq = require('groq-sdk');
    llmClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  // Si usas Anthropic Claude
  else if (process.env.ANTHROPIC_API_KEY) {
    if (!Anthropic) {
      throw new Error('@anthropic-ai/sdk not installed. Run: npm install @anthropic-ai/sdk');
    }
    llmClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return llmClient;
};

/**
 * Mapa de herramientas disponibles
 */
const AVAILABLE_TOOLS = {
  generate_report: generateReportTool,
  ask_equipment: askEquipmentTool,
  detect_anomaly: detectAnomalyTool,
  recommend_maintenance: recommendMaintenanceTool,
  compare_equipment: compareEquipmentTool,
  create_summary: executiveSummaryTool
};

/**
 * Descripción de herramientas para el agent
 */
const TOOLS_DESCRIPTION = `
Available tools:
1. generate_report - Generates a professional maintenance report from technical data
2. ask_equipment - Answers technical questions about equipment based on history
3. detect_anomaly - Detects anomalies by comparing current vs historical data
4. recommend_maintenance - Recommends next maintenance date based on trends
5. compare_equipment - Compares performance between two equipment
6. create_summary - Creates an executive summary for a period
`;

/**
 * Sistema de prompts para el Agent
 */
const AGENT_SYSTEM_PROMPT = `
You are an AI Agent specialized in maintenance management systems.

Your job is to:
1. Understand user requests
2. Route them to the correct tool
3. Execute the tool with appropriate parameters
4. Return structured results

${TOOLS_DESCRIPTION}

When user provides a request:
- Identify which tool they need
- Extract required parameters
- Call the tool
- Return the result in JSON format

Always respond with:
{
  "tool": "tool_name",
  "parameters": {...},
  "reasoning": "why this tool"
}
`;

/**
 * Clase Agent Maestro
 */
class AIAgentMaestro {
  constructor() {
    this.llmClient = null;
    this.iterationCount = 0;
    this.maxIterations = 5;
  }

  /**
   * Inicializar el agente
   */
  async initialize() {
    this.llmClient = initializeLLMClient();
    console.log('✅ AI Agent initialized');
  }

  /**
   * Ejecutar herramienta
   */
  async executeTool(toolName, parameters) {
    const tool = AVAILABLE_TOOLS[toolName];

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    console.log(`🔧 Executing tool: ${toolName}`);
    console.log('📋 Parameters:', parameters);

    try {
      const result = await tool.execute(parameters, this.llmClient);
      console.log('✅ Tool executed successfully');
      return result;
    } catch (error) {
      console.error(`❌ Tool execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invocar el agente con un input del usuario
   * 
   * @param {string} userInput - Descripción de lo que el usuario quiere
   * @param {object} context - Contexto adicional (equipmentId, reportId, etc)
   */
  async invoke(userInput, context = {}) {
    this.iterationCount = 0;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         🤖 AI AGENT EJECUTANDO                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`📥 User Input: ${userInput}`);
    console.log('📦 Context:', context);

    try {
      // Paso 1: Le pedimos al LLM que identifique la herramienta
      const decisionPrompt = `
${AGENT_SYSTEM_PROMPT}

User Request: "${userInput}"
Available Context: ${JSON.stringify(context)}

Decide which tool to use and provide parameters in JSON format.
Respond ONLY with valid JSON.
`;

      console.log('\n🤔 Agent thinking...');
      
      const decision = await this.getLLMDecision(decisionPrompt);
      
      console.log('🎯 Agent Decision:', decision);

      // Paso 2: Extraer herramienta y parámetros
      const toolName = decision.tool;
      const parameters = { ...decision.parameters, ...context };

      // Paso 3: Ejecutar herramienta
      const result = await this.executeTool(toolName, parameters);

      console.log('\n🎉 Agent completed successfully');
      console.log('════════════════════════════════════════════════════════════\n');

      return {
        success: true,
        tool: toolName,
        result,
        metadata: {
          timestamp: new Date().toISOString(),
          userInput,
          iterations: this.iterationCount
        }
      };
    } catch (error) {
      console.error(`\n❌ Agent failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener decisión del LLM
   */
  async getLLMDecision(prompt) {
    let response;

    // Si es Groq
    if (this.llmClient.constructor.name === 'Groq') {
      const message = await this.llmClient.messages.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
      response = message.content[0].text;
    }
    // Si es Anthropic
    else if (this.llmClient.constructor.name === 'Anthropic') {
      const message = await this.llmClient.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: AGENT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      });
      response = message.content[0].text;
    }

    // Parsear JSON
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (_e) {
      console.warn('Failed to parse LLM response as JSON');
    }

    throw new Error('Invalid LLM response');
  }

  /**
   * Listar herramientas disponibles
   */
  getAvailableTools() {
    return Object.keys(AVAILABLE_TOOLS).map(toolName => ({
      name: toolName,
      description: AVAILABLE_TOOLS[toolName].description
    }));
  }
}

// Singleton
let agentInstance = null;

const getAgent = async () => {
  if (!agentInstance) {
    agentInstance = new AIAgentMaestro();
    await agentInstance.initialize();
  }
  return agentInstance;
};

module.exports = {
  AIAgentMaestro,
  getAgent,
  AVAILABLE_TOOLS,
  AGENT_SYSTEM_PROMPT
};
