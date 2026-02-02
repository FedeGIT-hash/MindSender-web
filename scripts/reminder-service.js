require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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

  // Calculate time range: 4 hours from now
  const now = new Date();
  const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  
  // Look for tasks due within the next 4 hours + 15 mins buffer, that haven't been reminded
  // We check if due_date <= 4 hours from now AND reminder_sent is false
  // But we don't want to send reminders for tasks that are already overdue by a lot?
  // User said "4 hours before".
  // So we look for tasks where due_date is approximately 4 hours from now.
  // Let's say between 3.5 and 4.5 hours from now.
  
  const minTime = new Date(now.getTime() + 3.5 * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + 4.5 * 60 * 60 * 1000);

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .eq('reminder_sent', false)
    .gte('due_date', minTime.toISOString())
    .lte('due_date', maxTime.toISOString());

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  if (tasks.length === 0) {
    console.log('No reminders to send.');
    return;
  }

  console.log(`Found ${tasks.length} tasks to remind.`);

  for (const task of tasks) {
    const profile = task.profiles;
    if (!profile || !profile.email) continue;

    const mailOptions = {
      from: `"MindSender" <${process.env.SMTP_USER}>`,
      to: profile.email,
      subject: `Recordatorio: ${task.subject} - MindSender`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #7c3aed;">Hola ${profile.full_name || 'Usuario'}</h2>
          <p>Tienes una tarea pendiente en 4 horas:</p>
          
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
