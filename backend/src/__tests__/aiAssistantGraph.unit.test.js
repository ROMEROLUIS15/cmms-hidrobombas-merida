const mockCompiledGraph = { invoke: jest.fn() };

const mockStateGraphInstance = {
  addNode: jest.fn().mockReturnThis(),
  addEdge: jest.fn().mockReturnThis(),
  addConditionalEdges: jest.fn().mockReturnThis(),
  compile: jest.fn().mockReturnValue(mockCompiledGraph),
};

jest.mock('@langchain/langgraph', () => ({
  StateGraph: jest.fn(() => mockStateGraphInstance),
  START: 'START',
  END: 'END',
  MessagesAnnotation: {},
}));

jest.mock('@langchain/langgraph/prebuilt', () => ({
  ToolNode: jest.fn(() => ({})),
}));

jest.mock('../ai/config', () => ({
  createLLM: jest.fn(),
}));

jest.mock('../ai/tools', () => ({
  getEquipmentInfo: { name: 'get_equipment_info' },
  getClientHistory: { name: 'get_client_history' },
  getRecentReportsByEquipment: { name: 'get_recent_reports_by_equipment' },
  searchReportsByText: { name: 'search_reports_by_text' },
}));

const { createLLM } = require('../ai/config');
const { askAssistant } = require('../ai/assistantGraph');

const conditionalEdgeFn = mockStateGraphInstance.addConditionalEdges.mock.calls[0][1];
const agentNodeFn = mockStateGraphInstance.addNode.mock.calls.find(
  ([name]) => name === 'agent'
)[1];

describe('AI Assistant Graph Unit Tests', () => {
  describe('module-level graph construction', () => {
    it('should call ToolNode with the 4 tools', () => {
      const { ToolNode } = require('@langchain/langgraph/prebuilt');
      expect(ToolNode).toHaveBeenCalledWith([
        { name: 'get_equipment_info' },
        { name: 'get_client_history' },
        { name: 'get_recent_reports_by_equipment' },
        { name: 'search_reports_by_text' },
      ]);
    });

    it('should construct the graph with correct nodes and edges', () => {
      const { StateGraph } = require('@langchain/langgraph');
      expect(StateGraph).toHaveBeenCalledWith({});
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('agent', expect.any(Function));
      expect(mockStateGraphInstance.addNode).toHaveBeenCalledWith('tools', {});
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('START', 'agent');
      expect(mockStateGraphInstance.addConditionalEdges).toHaveBeenCalledWith(
        'agent',
        expect.any(Function)
      );
      expect(mockStateGraphInstance.addEdge).toHaveBeenCalledWith('tools', 'agent');
      expect(mockStateGraphInstance.compile).toHaveBeenCalledTimes(1);
    });
  });

  describe('runtime behavior', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('askAssistant', () => {
      it('should invoke the compiled graph with the user message and return content', async () => {
        mockCompiledGraph.invoke.mockResolvedValue({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi! How can I help you?' },
          ],
        });

        const result = await askAssistant('Hello');

        expect(mockCompiledGraph.invoke).toHaveBeenCalledWith({
          messages: [{ role: 'user', content: 'Hello' }],
        });
        expect(result).toBe('Hi! How can I help you?');
      });

      it('should handle empty assistant response', async () => {
        mockCompiledGraph.invoke.mockResolvedValue({
          messages: [{ role: 'user', content: 'test' }, { role: 'assistant', content: '' }],
        });

        const result = await askAssistant('test');

        expect(result).toBe('');
      });

      it('should propagate graph invocation errors', async () => {
        mockCompiledGraph.invoke.mockRejectedValue(new Error('Graph error'));

        await expect(askAssistant('Hi')).rejects.toThrow('Graph error');
      });
    });

    describe('shouldContinue logic', () => {
      it('should return "tools" when last message has tool_calls', () => {
        const decision = conditionalEdgeFn({
          messages: [
            { role: 'user', content: 'Find equipment info' },
            {
              role: 'assistant',
              content: '',
              additional_kwargs: {
                tool_calls: [{ id: 'call1', function: { name: 'get_equipment_info' } }],
              },
            },
          ],
        });

        expect(decision).toBe('tools');
      });

      it('should return END when last message has no tool_calls', () => {
        const decision = conditionalEdgeFn({
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        });

        expect(decision).toBe('END');
      });

      it('should handle empty messages array', () => {
        const decision = conditionalEdgeFn({ messages: [] });

        expect(decision).toBe('END');
      });
    });

    describe('callModel (agent node)', () => {
      it('should invoke the LLM with bound tools and return the response', async () => {
        const mockBoundLLM = { invoke: jest.fn() };
        const mockLLM = { bindTools: jest.fn(() => mockBoundLLM) };
        createLLM.mockReturnValue(mockLLM);

        mockBoundLLM.invoke.mockResolvedValue({ content: 'Response from LLM' });

        const result = await agentNodeFn({
          messages: [{ role: 'user', content: 'Hello' }],
        });

        expect(createLLM).toHaveBeenCalledTimes(1);
        expect(mockLLM.bindTools).toHaveBeenCalledWith([
          { name: 'get_equipment_info' },
          { name: 'get_client_history' },
          { name: 'get_recent_reports_by_equipment' },
          { name: 'search_reports_by_text' },
        ]);
        expect(mockBoundLLM.invoke).toHaveBeenCalledWith([{ role: 'user', content: 'Hello' }]);
        expect(result).toEqual({ messages: [{ content: 'Response from LLM' }] });
      });
    });
  });
});
