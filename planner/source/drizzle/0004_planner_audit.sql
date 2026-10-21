CREATE TRIGGER planner_entries_audit_insert AFTER INSERT ON planner_entries BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = NEW.owner_id),lower(hex(randomblob(16)))),NEW.owner_id,NEW.id,NULL,NEW.payload,NULL,NEW.updated_at,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'user'),NEW.owner_id,'create',json_extract(NEW.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER planner_entries_audit_update AFTER UPDATE ON planner_entries BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = NEW.owner_id),lower(hex(randomblob(16)))),NEW.owner_id,NEW.id,OLD.payload,NEW.payload,OLD.updated_at,NEW.updated_at,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'user'),NEW.owner_id,CASE WHEN json_extract(OLD.payload,'$.done') IS NOT json_extract(NEW.payload,'$.done') THEN 'complete' ELSE 'update' END,json_extract(NEW.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
 DELETE FROM planner_embeddings WHERE owner_id = NEW.owner_id AND entry_id = NEW.id;
END;
--> statement-breakpoint
CREATE TRIGGER planner_entries_audit_delete AFTER DELETE ON planner_entries BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = OLD.owner_id),lower(hex(randomblob(16)))),OLD.owner_id,OLD.id,OLD.payload,NULL,OLD.updated_at,NULL,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = OLD.owner_id),'user'),OLD.owner_id,'delete',json_extract(OLD.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = OLD.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
 DELETE FROM planner_embeddings WHERE owner_id = OLD.owner_id AND entry_id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER planner_reminders_audit_insert AFTER INSERT ON planner_reminders BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = NEW.owner_id),lower(hex(randomblob(16)))),NEW.owner_id,NEW.id,NULL,NEW.payload,NULL,NEW.updated_at,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'user'),NEW.owner_id,'create',json_extract(NEW.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER planner_reminders_audit_update AFTER UPDATE ON planner_reminders BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = NEW.owner_id),lower(hex(randomblob(16)))),NEW.owner_id,NEW.id,OLD.payload,NEW.payload,OLD.updated_at,NEW.updated_at,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'user'),NEW.owner_id,CASE WHEN json_extract(OLD.payload,'$.done') IS NOT json_extract(NEW.payload,'$.done') THEN 'complete' ELSE 'update' END,json_extract(NEW.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = NEW.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER planner_reminders_audit_delete AFTER DELETE ON planner_reminders BEGIN
 INSERT INTO planner_history (group_id,owner_id,entry_id,before_payload,after_payload,before_version,after_version,actor,actor_id,action_type,entity_type,source,created_at)
 VALUES (COALESCE((SELECT group_id FROM planner_mutation_context WHERE owner_id = OLD.owner_id),lower(hex(randomblob(16)))),OLD.owner_id,OLD.id,OLD.payload,NULL,OLD.updated_at,NULL,COALESCE((SELECT actor FROM planner_mutation_context WHERE owner_id = OLD.owner_id),'user'),OLD.owner_id,'delete',json_extract(OLD.payload,'$.kind'),COALESCE((SELECT source FROM planner_mutation_context WHERE owner_id = OLD.owner_id),'web'),strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
