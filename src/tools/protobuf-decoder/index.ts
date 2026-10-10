import type { ToolDefinition } from '../types';

const protobufDecoder: ToolDefinition = {
  id: 'protobuf-decoder',
  name: 'Protobuf Decoder',
  tagline: 'Decode raw protobuf bytes',
  description:
    'Decode Protocol Buffers wire-format messages from hex or Base64 without a .proto file, showing field numbers, types and nested messages.',
  category: 'Code',
  icon: 'hash',
  tags: ['Protobuf', 'gRPC', 'Decode'],
  accepts: ['text'],
  shareable: true,
  status: 'available',
  load: () => import('./ProtobufDecoderPage'),
  docs: () => import('./docs'),
};

export default protobufDecoder;
