import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatSocket } from '@/lib/chat/useChatSocket';
import { FakeWebSocket } from '@/test/utils/fakeWebSocket';

// The chat transport. It has no business logic, but it owns everything that
// makes a socket survive a flaky network: auth, reconnection, queueing, and
// cleanup.

const socket = () => FakeWebSocket.last!;

function signedIn(token = 'tok-1') {
  localStorage.setItem('ut_token', token);
}

beforeEach(() => {
  FakeWebSocket.reset();
  vi.stubGlobal('WebSocket', FakeWebSocket);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Mount the hook and complete the handshake.
 *
 * The socket is opened lazily — on the first message or an explicit retry —
 * so a visitor who never chats never holds one open. retry() is the way to
 * connect without also sending something.
 */
async function connected(options = {}) {
  signedIn();
  const hook = renderHook(() => useChatSocket(options));
  await act(async () => { hook.result.current.retry(); });
  await waitFor(() => expect(FakeWebSocket.last).toBeDefined());
  await act(async () => { socket().open(); });
  return hook;
}

describe('connecting', () => {
  test('a signed-in user opens a socket', async () => {
    const hook = await connected();
    expect(hook.result.current.status).toBe('open');
  });

  test('the token travels in the subprotocol, never the URL', async () => {
    // A token in the query string lands in proxy and access logs.
    await connected();
    expect(socket().protocols).toEqual(['bearer', 'tok-1']);
    expect(socket().url).not.toContain('tok-1');
  });

  test('nothing is opened until there is something to say', async () => {
    // A visitor who never chats should not hold a socket open.
    signedIn();
    renderHook(() => useChatSocket());
    await act(async () => { vi.advanceTimersByTime(1_000); });
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  test('a signed-out visitor is reported as expired rather than dialling out', async () => {
    const hook = renderHook(() => useChatSocket());
    await act(async () => { hook.result.current.retry(); });
    await waitFor(() => expect(hook.result.current.status).toBe('expired'));
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  test('a token the socket refuses is treated like no token at all', async () => {
    // The constructor throws when a tampered token contains characters that
    // are illegal in a subprotocol header.
    signedIn('bad token with spaces');
    FakeWebSocket.throwOnConstruct = new SyntaxError('invalid subprotocol');

    const hook = renderHook(() => useChatSocket());
    await act(async () => { hook.result.current.retry(); });

    await waitFor(() => expect(hook.result.current.status).toBe('expired'));
  });
});

describe('sending a message', () => {
  test('the question appears immediately, with an empty reply to fill in', async () => {
    const hook = await connected();

    await act(async () => { hook.result.current.send('berapa biaya SALUT?'); });

    const { messages } = hook.result.current;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'user', content: 'berapa biaya SALUT?' });
    expect(messages[1]).toMatchObject({ role: 'assistant', content: '' });
    expect(hook.result.current.isStreaming).toBe(true);
  });

  test('the frame carries the conversation so the backend can thread it', async () => {
    const hook = await connected();

    await act(async () => { hook.result.current.send('halo') });

    expect(socket().sentJson[0]).toMatchObject({ type: 'message', content: 'halo', conversation_id: null });
  });

  test('an empty or blank message is not sent', async () => {
    const hook = await connected();

    await act(async () => { hook.result.current.send('   '); });

    expect(socket().sent).toHaveLength(0);
    expect(hook.result.current.messages).toHaveLength(0);
  });

  test('the message is trimmed before it leaves', async () => {
    const hook = await connected();

    await act(async () => { hook.result.current.send('  halo  '); });

    expect(hook.result.current.messages[0].content).toBe('halo');
  });

  test('a message sent while disconnected is queued and delivered on reconnect', async () => {
    // Typing while the socket is down should not lose the question.
    signedIn();
    const hook = renderHook(() => useChatSocket());

    // send() with no socket yet both queues the frame and opens one.
    await act(async () => { hook.result.current.send('halo'); });
    await waitFor(() => expect(FakeWebSocket.last).toBeDefined());
    expect(socket().sent).toHaveLength(0);

    await act(async () => { socket().open(); });

    expect(socket().sentJson[0]).toMatchObject({ content: 'halo' });
  });
});

describe('receiving a reply', () => {
  test('tokens accumulate into the assistant message', async () => {
    const hook = await connected();
    await act(async () => { hook.result.current.send('halo'); });

    await act(async () => {
      socket().emit({ type: 'token', content: 'Biaya ' });
      socket().emit({ type: 'token', content: 'SALUT' });
    });

    expect(hook.result.current.messages[1].content).toBe('Biaya SALUT');
  });

  test('the finished reply takes the backend\'s id and ends the stream', async () => {
    const hook = await connected();
    await act(async () => { hook.result.current.send('halo'); });

    await act(async () => {
      socket().emit({ type: 'token', content: 'jawaban' });
      socket().emit({ type: 'done', conversation_id: 'conv-1', message_id: 'msg-9' });
    });

    expect(hook.result.current.messages[1].id).toBe('msg-9');
    expect(hook.result.current.isStreaming).toBe(false);
    expect(hook.result.current.status).toBe('open');
  });

  test('the next question continues the same conversation', async () => {
    const hook = await connected();
    await act(async () => { hook.result.current.send('pertama'); });
    await act(async () => {
      socket().emit({ type: 'done', conversation_id: 'conv-1', message_id: 'msg-1' });
    });

    await act(async () => { hook.result.current.send('kedua'); });

    expect(socket().sentJson[1]).toMatchObject({ conversation_id: 'conv-1' });
  });

  test('a failure removes the empty bubble rather than leaving a blank reply', async () => {
    const onError = vi.fn();
    const hook = await connected({ onError });
    await act(async () => { hook.result.current.send('halo'); });

    await act(async () => {
      socket().emit({ type: 'error', code: 'rate_limited', message: 'Terlalu banyak permintaan' });
    });

    expect(hook.result.current.messages).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith('rate_limited', 'Terlalu banyak permintaan');
    expect(hook.result.current.isStreaming).toBe(false);
  });

  test('a failure part-way through keeps what was already said', async () => {
    const hook = await connected({ onError: vi.fn() });
    await act(async () => { hook.result.current.send('halo'); });
    await act(async () => { socket().emit({ type: 'token', content: 'sebagian' }); });

    await act(async () => {
      socket().emit({ type: 'error', code: 'internal', message: 'gagal' });
    });

    expect(hook.result.current.messages).toHaveLength(2);
    expect(hook.result.current.messages[1].content).toBe('sebagian');
  });

  test('a heartbeat reply is ignored', async () => {
    const hook = await connected();
    await act(async () => { socket().emit({ type: 'pong' }); });
    expect(hook.result.current.messages).toHaveLength(0);
  });

  test('a malformed frame is ignored rather than crashing the chat', async () => {
    const hook = await connected();
    await act(async () => { socket().emit('not json at all'); });
    expect(hook.result.current.status).toBe('open');
  });

  test('an unrecognised frame type is ignored', async () => {
    const hook = await connected();
    await act(async () => { socket().emit({ type: 'something_new' }); });
    expect(hook.result.current.status).toBe('open');
  });

  test('a token arriving with nothing streaming is discarded', async () => {
    const hook = await connected();
    await act(async () => { socket().emit({ type: 'token', content: 'orphan' }); });
    expect(hook.result.current.messages).toHaveLength(0);
  });
});

describe('staying connected', () => {
  test('a ping goes out periodically so the connection is not reaped', async () => {
    const hook = await connected();
    await act(async () => { vi.advanceTimersByTime(30_000); });
    expect(socket().sentJson.some(f => f.type === 'ping')).toBe(true);
    expect(hook.result.current.status).toBe('open');
  });

  test('a dropped connection is retried', async () => {
    const hook = await connected();

    await act(async () => { socket().serverClose(1006); });
    expect(hook.result.current.status).toBe('reconnecting');

    await act(async () => { vi.advanceTimersByTime(1_000); });

    expect(FakeWebSocket.instances.length).toBe(2);
  });

  test('each retry waits longer than the last', async () => {
    // Backoff is 1s, 2s, 4s, 8s, 16s. A failure that keeps failing should back
    // off rather than hammering a service that is already struggling.
    await connected();
    const delays = [1_000, 2_000, 4_000];

    for (const [attempt, delay] of delays.entries()) {
      const before = FakeWebSocket.instances.length;
      await act(async () => { socket().serverClose(1006); });

      await act(async () => { vi.advanceTimersByTime(delay - 1); });
      expect(
        FakeWebSocket.instances.length,
        `attempt ${attempt + 1} reconnected before ${delay}ms`,
      ).toBe(before);

      await act(async () => { vi.advanceTimersByTime(1); });
      expect(FakeWebSocket.instances.length).toBe(before + 1);
    }
  });

  test('a successful connection resets the backoff', async () => {
    await connected();

    await act(async () => { socket().serverClose(1006); });
    await act(async () => { vi.advanceTimersByTime(1_000); });
    await act(async () => { socket().open() });

    // Back to the first delay rather than continuing to climb.
    const before = FakeWebSocket.instances.length;
    await act(async () => { socket().serverClose(1006); });
    await act(async () => { vi.advanceTimersByTime(1_000); });
    expect(FakeWebSocket.instances.length).toBe(before + 1);
  });

  test('a rejected token stops the retrying — reconnecting cannot fix it', async () => {
    const hook = await connected();

    await act(async () => { socket().serverClose(1008); });

    expect(hook.result.current.status).toBe('expired');
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  test('it gives up after five attempts rather than retrying forever', async () => {
    const hook = await connected();

    for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000]) {
      await act(async () => { socket().serverClose(1006); });
      await act(async () => { vi.advanceTimersByTime(delay); });
    }
    await act(async () => { socket().serverClose(1006); });

    expect(hook.result.current.status).toBe('closed');
  });

  test('a transport error closes the socket, which drives the single retry path', async () => {
    const hook = await connected();

    await act(async () => { socket().fail(); });

    expect(socket().close).toHaveBeenCalled();
    expect(hook.result.current.status).toBe('reconnecting');
  });

  test('retrying by hand starts the backoff over', async () => {
    const hook = await connected();
    for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000]) {
      await act(async () => { socket().serverClose(1006); });
      await act(async () => { vi.advanceTimersByTime(delay); });
    }
    await act(async () => { socket().serverClose(1006); });
    expect(hook.result.current.status).toBe('closed');

    await act(async () => { hook.result.current.retry(); });

    expect(hook.result.current.status).not.toBe('closed');
  });
});

describe('clearing the conversation', () => {
  test('reset empties the transcript and forgets the thread', async () => {
    const hook = await connected();
    await act(async () => { hook.result.current.send('halo'); });
    await act(async () => {
      socket().emit({ type: 'done', conversation_id: 'conv-1', message_id: 'msg-1' });
    });

    await act(async () => { hook.result.current.reset(); });
    expect(hook.result.current.messages).toHaveLength(0);

    await act(async () => { hook.result.current.send('baru'); });
    expect(socket().sentJson.at(-1)).toMatchObject({ conversation_id: null });
  });
});

describe('leaving the page', () => {
  test('the socket is closed and stops reconnecting', async () => {
    const hook = await connected();
    const open = socket();

    hook.unmount();

    expect(open.close).toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  test('a frame arriving after unmount is ignored', async () => {
    const hook = await connected();
    const open = socket();
    hook.unmount();

    expect(() => open.emit({ type: 'token', content: 'late' })).not.toThrow();
  });
});
