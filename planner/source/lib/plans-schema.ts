import { z } from "zod";
import { dateSchema } from "./integration-time";
export const planCategories=[{id:"films",name:"Фильмы и сериалы"},{id:"places",name:"Места"},{id:"shopping",name:"Покупки"},{id:"entertainment",name:"Развлечения"},{id:"study",name:"Учёба"},{id:"personal",name:"Личное"},{id:"other",name:"Другое"}];
export const planFields=z.object({title:z.string().trim().min(1,"Введите название плана").max(180),description:z.string().max(5000).default(""),date:dateSchema.nullable().default(null),categoryId:z.string().min(1).max(40).default("personal"),completed:z.boolean().default(false)}).strict();
export const createPlanSchema=planFields.extend({requestId:z.string().uuid()});
export const updatePlanSchema=z.object({id:z.string().uuid(),version:z.string().min(1).max(100),changes:planFields.partial().refine(v=>Object.keys(v).length>0,"Нет изменений")}).strict();
export const deletePlanSchema=z.object({id:z.string().uuid(),version:z.string().min(1).max(100),confirmed:z.literal(true)}).strict();
export const planFilterSchema=z.object({query:z.string().max(180).default(""),status:z.enum(["all","active","completed"]).default("all"),categoryId:z.string().max(40).default(""),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).max(100000).default(0)}).strict();
export type PlanFields=z.infer<typeof planFields>;
export type Plan=PlanFields&{id:string,version:string,createdAt:string};
export type PlanCategory={id:string,name:string};
export function normalizePlanText(s:string){return s.normalize("NFKC").toLocaleLowerCase("ru").replace(/ё/g,"е").trim().replace(/\s+/g," ");}
