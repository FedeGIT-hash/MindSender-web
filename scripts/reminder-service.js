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
      from: `"MindSender AI" <${process.env.SMTP_USER}>`,
      to: profile.email,
      subject: `⚡ Recordatorio: ${task.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin-top: 40px; margin-bottom: 40px;">
            
            <!-- Header with Gradient -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MindSender</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">Tu asistente inteligente</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Hola, ${profile.full_name?.split(' ')[0] || 'Viajero'} 👋</h2>
              <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
                Tienes una tarea programada que requiere tu atención pronto. Aquí están los detalles:
              </p>

              <!-- Task Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #7c3aed;">
                <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">${task.subject}</h3>
                ${task.description ? `<p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">${task.description}</p>` : ''}
                
                <div style="display: flex; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                  <div style="background-color: #ede9fe; color: #7c3aed; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">
                    ⏰ Vence: ${new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.APP_URL || 'https://mind-sender-web.vercel.app'}" 
                   style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 14px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
                  Ver en el Dashboard
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                Enviado automáticamente por <strong>MindSender AI</strong><br>
                Organiza tu mente, domina tu tiempo.
              </p>
            </div>
          </div>
        </body>
        </html>
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
