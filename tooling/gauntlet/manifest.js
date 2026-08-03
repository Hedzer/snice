export const GAUNTLET_MODELS = Object.freeze([
  {
    id: 'lfm2.5-350m',
    label: 'LFM2.5 350M Q4_K_M',
    family: 'Liquid LFM2.5',
    filename: 'lfm2.5-350m-q4_k_m.gguf',
    bytes: 229_312_224,
    sha256: '7e6f72643caafc9a68256686638c4d7916f2cec76d1df478d4c3ddcd95a6aed4',
    url: 'https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF/resolve/main/LFM2.5-350M-Q4_K_M.gguf',
    source: 'https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF'
  },
  {
    id: 'gemma3-270m',
    label: 'Gemma 3 270M IT QAT Q4_0',
    family: 'Gemma 3',
    filename: 'gemma-3-270m-it-qat-q4_0.gguf',
    bytes: 241_410_624,
    sha256: '3626e245220ca4a1c5911eb4010b3ecb7bdbf5bc53c79403c21355354d1e2dc6',
    url: 'https://huggingface.co/ggml-org/gemma-3-270m-it-qat-GGUF/resolve/main/gemma-3-270m-it-qat-Q4_0.gguf',
    source: 'https://huggingface.co/google/gemma-3-270m-it'
  },
  {
    id: 'qwen2.5-coder-0.5b',
    label: 'Qwen2.5 Coder 0.5B Instruct Q4_0',
    family: 'Qwen2.5 Coder',
    filename: 'qwen2.5-coder-0.5b-q4_0.gguf',
    bytes: 428_730_240,
    sha256: '9739055e046d62a937e5b7879012209ef40ebea8a1569a96028de491f3f091d5',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-0.5b-instruct-q4_0.gguf',
    source: 'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF'
  },
  {
    id: 'qwen3-0.6b',
    label: 'Qwen3 0.6B Q8_0',
    family: 'Qwen3',
    filename: 'qwen3-0.6b-q8_0.gguf',
    bytes: 639_446_688,
    sha256: '9465e63a22add5354d9bb4b99e90117043c7124007664907259bd16d043bb031',
    url: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
    source: 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF'
  },
  {
    id: 'gemma3-1b',
    label: 'Gemma 3 1B IT Q4_K_M',
    family: 'Gemma 3',
    filename: 'gemma-3-1b-it-official-q4_k_m.gguf',
    bytes: 806_058_240,
    sha256: '8ccc5cd1f1b3602548715ae25a66ed73fd5dc68a210412eea643eb20eb75a135',
    url: 'https://huggingface.co/ggml-org/gemma-3-1b-it-GGUF/resolve/main/gemma-3-1b-it-Q4_K_M.gguf',
    source: 'https://huggingface.co/google/gemma-3-1b-it'
  },
  {
    id: 'deepseek-r1-1.5b',
    label: 'DeepSeek-R1 Distill Qwen 1.5B Q4_0',
    family: 'DeepSeek-R1 / Qwen2.5',
    filename: 'deepseek-r1-distill-qwen-1.5b-q4_0.gguf',
    bytes: 1_066_227_008,
    sha256: '0d3f4820ee66ab44884b8176f17371eb1baa1d63df15740ffd5873d9e03e8978',
    url: 'https://huggingface.co/ggml-org/DeepSeek-R1-Distill-Qwen-1.5B-Q4_0-GGUF/resolve/main/deepseek-r1-distill-qwen-1.5b-q4_0.gguf',
    source: 'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B'
  },
  {
    id: 'smollm2-1.7b',
    label: 'SmolLM2 1.7B Instruct Q4_K_M',
    family: 'SmolLM2',
    filename: 'smollm2-1.7b-q4_k_m.gguf',
    bytes: 1_055_609_536,
    sha256: 'decd2598bc2c8ed08c19adc3c8fdd461ee19ed5708679d1c54ef54a5a30d4f33',
    url: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf',
    source: 'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF'
  }
]);

export const LLAMA_CPP_VERSION = 'b10092';

export const LLAMA_CPP_RUNTIMES = Object.freeze({
  'linux:x64': {
    filename: 'llama-b10092-bin-ubuntu-x64.tar.gz',
    bytes: 16_078_173,
    sha256: 'b047abca5eb5186afb8c6fe816b008b34063f484613c3453b27ebc5600f937fe'
  },
  'linux:arm64': {
    filename: 'llama-b10092-bin-ubuntu-arm64.tar.gz',
    bytes: 12_984_839,
    sha256: 'fb3241aa451d502707727878008ed5ff8a9f130b920d48c7f06899992b46e3f4'
  },
  'darwin:x64': {
    filename: 'llama-b10092-bin-macos-x64.tar.gz',
    bytes: 10_888_382,
    sha256: '5b4da2d7fe2670265f8adc48765e69f0253f27f9ed2ebd1c09bf692d47127b99'
  },
  'darwin:arm64': {
    filename: 'llama-b10092-bin-macos-arm64.tar.gz',
    bytes: 10_612_780,
    sha256: 'f3ec2351e06322478e3f38f23f5339cd834cca5e3740f334ce2bdc5de95f90e0'
  }
});

export function llamaRuntimeUrl(filename) {
  return `https://github.com/ggml-org/llama.cpp/releases/download/${LLAMA_CPP_VERSION}/${filename}`;
}
