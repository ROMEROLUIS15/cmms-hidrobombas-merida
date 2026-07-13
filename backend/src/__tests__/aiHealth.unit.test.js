const { checkGroqKey } = require('../ai/health');

describe('checkGroqKey', () => {
  it('valid: Groq acepta la credencial', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, status: 200 });

    const res = await checkGroqKey({ apiKey: 'gsk_ok', fetchImpl });

    expect(res.status).toBe('valid');
    expect(res.detail).toBeNull();
    // Debe validar SIN gastar tokens: se consulta /models, no un chat.
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/openai/v1/models'),
      expect.objectContaining({ headers: { Authorization: 'Bearer gsk_ok' } })
    );
  });

  it('invalid: 401 significa que la key está revocada o mal', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const res = await checkGroqKey({ apiKey: 'gsk_muerta', fetchImpl });

    expect(res.status).toBe('invalid');
    expect(res.detail).toMatch(/401/);
  });

  it('unreachable: un 403 es el geo-bloqueo, NO prueba que la key sea mala', async () => {
    // Este es el caso que nos engañó: desde la red local Groq contesta 403
    // antes de validar la credencial. Marcarla como "invalid" sería mentir.
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 403 });

    const res = await checkGroqKey({ apiKey: 'gsk_quizas_buena', fetchImpl });

    expect(res.status).toBe('unreachable');
    expect(res.detail).toMatch(/403/);
  });

  it('unreachable: error de red', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNRESET'));

    const res = await checkGroqKey({ apiKey: 'gsk_x', fetchImpl });

    expect(res.status).toBe('unreachable');
    expect(res.detail).toMatch(/ECONNRESET/);
  });

  it('unreachable: timeout', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    const fetchImpl = jest.fn().mockRejectedValue(abortError);

    const res = await checkGroqKey({ apiKey: 'gsk_x', fetchImpl, timeoutMs: 10 });

    expect(res.status).toBe('unreachable');
    expect(res.detail).toMatch(/timeout/);
  });

  it('not_configured: sin key no se llama a la red', async () => {
    const fetchImpl = jest.fn();

    const res = await checkGroqKey({ apiKey: '', fetchImpl });

    expect(res.status).toBe('not_configured');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('not_configured: cae a process.env y detecta que GROQ_API_KEY no existe', async () => {
    const original = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    const fetchImpl = jest.fn();

    const res = await checkGroqKey({ fetchImpl });

    expect(res.status).toBe('not_configured');
    expect(fetchImpl).not.toHaveBeenCalled();

    if (original === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = original;
  });
});
