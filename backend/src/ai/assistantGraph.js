/**
 * @typedef {import('@langchain/langgraph').CompiledStateGraph} CompiledStateGraph
 * @typedef {Object} AgentState
 * @property {Array<import('@langchain/core/messages').BaseMessage>} messages
 */

const {
  StateGraph,
  START,
  END,
  MessagesAnnotation,
} = require('@langchain/langgraph');
const { ToolNode } = require('@langchain/langgraph/prebuilt');
const { container } = require('./container');
const {
  getEquipmentInfo,
  getClientHistory,
  getRecentReportsByEquipment,
  searchReportsByText,
} = require('./tools');

const tools = [
  getEquipmentInfo,
  getClientHistory,
  getRecentReportsByEquipment,
  searchReportsByText,
];

const toolNode = new ToolNode(tools);

/**
 * @param {AgentState} state
 * @returns {"tools"|typeof END}
 */
function shouldContinue({ messages }) {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.additional_kwargs?.tool_calls?.length > 0) {
    return 'tools';
  }
  return END;
}

/**
 * @param {AgentState} state
 * @returns {Promise<{messages: Array<import('@langchain/core/messages').BaseMessage>}>}
 */
async function callModel(state) {
  const llm = container.createLLM().bindTools(tools);
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

const assistantAgent = workflow.compile();

/**
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function askAssistant(userMessage) {
  const result = await assistantAgent.invoke({
    messages: [{ role: 'user', content: userMessage }],
  });
  return result.messages[result.messages.length - 1].content;
}

module.exports = { assistantAgent, askAssistant };
