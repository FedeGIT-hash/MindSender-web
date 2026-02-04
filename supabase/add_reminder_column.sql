-- Add reminder_sent column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Create an index to make querying for reminders faster
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_sent_due_date 
ON tasks (reminder_sent, due_date);
