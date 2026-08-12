import { vi } from 'vitest';

/**
 * jsdom has no WebSocket. This records what was opened and sent, and lets a
 * test drive the server side: open it, push frames, close it with a code.
 */
export class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: FakeWebSocket[] = [];
  /** Set to throw from the constructor, as the real one does on a bad subprotocol. */
  static throwOnConstruct: Error | null = null;

  static reset() {
    FakeWebSocket.instances = [];
    FakeWebSocket.throwOnConstruct = null;
  }

  static get last(): FakeWebSocket | undefined {
    return FakeWebSocket.instances.at(-1);
  }

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  url: string;
  protocols?: string | string[];
  readyState = 0;
  sent: string[] = [];

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  close = vi.fn((code?: number) => {
    if (this.readyState === this.CLOSED) return;
    this.readyState = this.CLOSED;
    this.onclose?.({ code: code ?? 1000 } as CloseEvent);
  });

  constructor(url: string, protocols?: string | string[]) {
    if (FakeWebSocket.throwOnConstruct) throw FakeWebSocket.throwOnConstruct;
    this.url = url;
    this.protocols = protocols;
    FakeWebSocket.instances.push(this);
  }

  send(frame: string) {
    this.sent.push(frame);
  }

  addEventListener() {}
  removeEventListener() {}

  // --- server side, for tests to drive -------------------------------------

  /** Complete the handshake. */
  open() {
    this.readyState = this.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** Deliver a server frame. Objects are JSON-encoded like the real socket. */
  emit(data: unknown) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.({ data: payload } as MessageEvent);
  }

  /** Close from the server side, e.g. 1008 for a rejected token. */
  serverClose(code = 1000) {
    this.readyState = this.CLOSED;
    this.onclose?.({ code } as CloseEvent);
  }

  /** A transport error, which the real socket follows with a close. */
  fail() {
    this.onerror?.(new Event('error'));
  }

  /** The frames sent, decoded. */
  get sentJson(): Record<string, unknown>[] {
    return this.sent.map(f => JSON.parse(f));
  }
}
