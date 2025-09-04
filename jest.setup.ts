import { TextEncoder, TextDecoder } from 'util';

(global as any).TextEncoder = TextEncoder as any;
(global as any).TextDecoder = TextDecoder as any;
