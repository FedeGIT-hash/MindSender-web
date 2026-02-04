import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load env vars ensuring we find the file from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SMTP Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function checkReminders() {
  console.log('Checking for reminders...', new Date().toISOString());

  // Calculate time range: 2 to 3 hours from now (checking slightly wider window to be safe)
  const now = new Date();
  
  // Look for tasks due between 2 hours and 3.5 hours from now
  // This ensures that if the cron runs every hour, we catch everything.
  // Example: 
  // Run at 10:00 -> checks 12:00 to 13:30
  // Run at 11:00 -> checks 13:00 to 14:30
  
  const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + 3.5 * 60 * 60 * 1000);

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('reminder_sent', false)
    .gte('due_date', minTime.toISOString())
    .lte('due_date', maxTime.toISOString());

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log('No reminders to send.');
    return;
  }

  console.log(`Found ${tasks.length} tasks to remind.`);

  // Manually fetch profiles to avoid Foreign Key issues in Supabase
  const userIds = [...new Set(tasks.map(t => t.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }

  // Create a map for quick lookup
  const profilesMap = profiles.reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});

  for (const task of tasks) {
    const profile = profilesMap[task.user_id];
    if (!profile || !profile.email) continue;

    const mailOptions = {
      from: `"MindSender" <${process.env.SMTP_USER}>`,
      to: profile.email,
      subject: `Recordatorio: ${task.subject} - MindSender`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #7c3aed;">Hola ${profile.full_name || 'Usuario'}</h2>
          <p>Tienes una tarea que vence pronto (en 2-3 horas):</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">${task.subject}</h3>
            <p style="margin: 0; color: #4b5563;">${task.description}</p>
            <p style="margin-top: 10px; font-size: 0.9em; color: #6b7280;">
              Fecha: ${new Date(task.due_date).toLocaleString()}
            </p>
          </div>

          <p>No olvides marcarla como completada cuando termines.</p>
          
          <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
             style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Ir a MindSender
          </a>
        </div>
      `,
    };

    try {
      // Add a small delay to prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${profile.email} for task ${task.id}`);

      // Mark as reminded
      await supabase
        .from('tasks')
        .update({ reminder_sent: true })
        .eq('id', task.id);
        
    } catch (emailError) {
      console.error(`Failed to send email to ${profile.email}:`, emailError);
    }
  }
}

// Run immediately
checkReminders();

// If you want it to run as a persistent service, uncomment below:
// setInterval(checkReminders, 15 * 60 * 1000); // Check every 15 minutes
