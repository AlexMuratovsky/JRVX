ALTER TABLE `chat_attachments` ADD `tags` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_attachments` ADD `extracted_text` text;--> statement-breakpoint
ALTER TABLE `chat_threads` ADD `tags` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
CREATE TRIGGER chat_attachment_search_delete AFTER DELETE ON chat_attachments BEGIN
 DELETE FROM planner_embeddings WHERE owner_id = OLD.owner_id AND entry_id = OLD.id;
END;
--> statement-breakpoint
CREATE TRIGGER chat_attachment_search_update AFTER UPDATE OF tags,extracted_text ON chat_attachments BEGIN
 DELETE FROM planner_embeddings WHERE owner_id = NEW.owner_id AND entry_id = NEW.id;
END;
