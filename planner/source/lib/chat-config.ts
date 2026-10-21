import { env } from "cloudflare:workers";
import { ApiError } from "./planner-service";
type ChatEnv={OPENAI_API_KEY?:string,OPENAI_EMBEDDING_MODEL?:string,OPENAI_TRANSCRIPTION_MODEL?:string,OPENAI_CHAT_MODEL?:string,OPENAI_CHAT_MODELS?:string,OPENAI_CHAT_MAX_OUTPUT_TOKENS?:string,BUCKET?:R2Bucket};
export function chatConfig() {
  const e=env as unknown as ChatEnv;
  const models=(e.OPENAI_CHAT_MODELS??"gpt-5.6-luna,gpt-5.6-terra,gpt-5.6-sol").split(",").map(s=>s.trim()).filter(s=>/^[a-zA-Z0-9._-]{1,100}$/.test(s)).slice(0,12);
  const model=e.OPENAI_CHAT_MODEL??models[0];
  if(!models.length||!models.includes(model))throw new ApiError(503,"invalid_chat_config","Проверьте серверные настройки моделей.");
  const embeddingModel=e.OPENAI_EMBEDDING_MODEL??"text-embedding-3-small",transcriptionModel=e.OPENAI_TRANSCRIPTION_MODEL??"gpt-transcribe";if(!["text-embedding-3-small","text-embedding-3-large"].includes(embeddingModel)||!/^[-a-zA-Z0-9._]{1,100}$/.test(transcriptionModel))throw new ApiError(503,"invalid_ai_config","Проверьте конфигурацию моделей поиска и речи.");
  return {embeddingModel,transcriptionModel,apiKey:e.OPENAI_API_KEY??"",models,model,maxOutputTokens:Math.max(512,Math.min(8192,Number(e.OPENAI_CHAT_MAX_OUTPUT_TOKENS)||4096)),bucket:e.BUCKET};
}
export function publicChatConfig(){const c=chatConfig();return {enabled:!!c.apiKey,models:c.models,defaultModel:c.model,attachmentsEnabled:!!c.bucket,voiceEnabled:!!c.apiKey,semanticEnabled:!!c.apiKey,maxFileBytes:8*1024*1024,maxFiles:3};}
