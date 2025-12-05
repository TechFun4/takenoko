// This script is injected into web pages to provide window.solana API
// Compatible with Phantom wallet API

interface SolanaProvider {
  isRoundUp: boolean;
  isConnected: boolean;
  publicKey: any;
  connect: () => Promise<{ publicKey: any }>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
}

class RoundUpWalletProvider implements SolanaProvider {
  isRoundUp = true;
  isConnected = false;
  publicKey: any = null;

  private _callbacks: Map<string, Set<Function>> = new Map();
  private _messageId = 0;
  private _pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    // Listen for responses from content script
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data.target !== 'roundup-wallet-inject') return;

      const { id, result, error } = event.data;
      const pending = this._pendingRequests.get(id);

      if (pending) {
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
        this._pendingRequests.delete(id);
      }
    });
  }

  private async _sendMessage(method: string, params?: any): Promise<any> {
    const id = ++this._messageId;

    return new Promise((resolve, reject) => {
      this._pendingRequests.set(id, { resolve, reject });

      window.postMessage(
        {
          target: 'roundup-wallet-content',
          id,
          method,
          params,
        },
        '*'
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this._pendingRequests.has(id)) {
          this._pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async connect(): Promise<{ publicKey: any }> {
    try {
      const response = await this._sendMessage('connect');

      if (response.error) {
        throw new Error(response.error);
      }

      this.publicKey = { toBase58: () => response.publicKey };
      this.isConnected = true;

      this._emit('connect', this.publicKey);

      return { publicKey: this.publicKey };
    } catch (error) {
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this._sendMessage('disconnect');
    this.publicKey = null;
    this.isConnected = false;
    this._emit('disconnect');
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    const response = await this._sendMessage('signTransaction', {
      transaction: transaction.serialize(),
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.transaction;
  }

  async signAllTransactions(transactions: any[]): Promise<any[]> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    const serialized = transactions.map(tx => tx.serialize());
    const response = await this._sendMessage('signAllTransactions', {
      transactions: serialized,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return response.transactions;
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    if (!this.isConnected) {
      throw new Error('Wallet not connected');
    }

    const response = await this._sendMessage('signMessage', {
      message: Array.from(message),
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return { signature: new Uint8Array(response.signature) };
  }

  on(event: string, callback: Function): void {
    if (!this._callbacks.has(event)) {
      this._callbacks.set(event, new Set());
    }
    this._callbacks.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this._callbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private _emit(event: string, ...args: any[]): void {
    const callbacks = this._callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

// Inject provider into window
if (typeof window !== 'undefined') {
  const provider = new RoundUpWalletProvider();

  // @ts-ignore
  window.roundup = provider;

  // Also expose as window.solana for compatibility (if no other wallet is present)
  // @ts-ignore
  if (!window.solana) {
    // @ts-ignore
    window.solana = provider;
  }

  console.log('RoundUp Wallet provider injected');
}
