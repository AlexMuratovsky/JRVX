import { z } from "zod";
import { instantSchema,zoneSchema } from "./integration-time";
export const reminderFields=z.object({kind:z.literal("reminder").default("reminder"),title:z.string().trim().min(1).max(180),entityId:z.string().uuid().nullable().default(null),remindAt:instantSchema.nullable().default(null),offsetMinutes:z.number().int().min(0).max(10080).nullable().default(null),timeZone:zoneSchema,status:z.enum(["active","paused"]).default("active"),deliveryChannel:z.enum(["in_app","web_push","mobile_push"]).default("in_app"),tags:z.array(z.string().trim().min(1).max(60)).max(12).default([])}).strict();
export const reminderInput=reminderFields.extend({requestId:z.string().uuid()});
