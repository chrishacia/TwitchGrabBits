import type { ExtensionMessage } from '@/src/messaging/messages';

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const message = value as Partial<ExtensionMessage> & { type?: unknown };
  return typeof message.type === 'string';
}

export function assertNever(input: never): never {
  throw new Error(`Unexpected message: ${JSON.stringify(input)}`);
}
