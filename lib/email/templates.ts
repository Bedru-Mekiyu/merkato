/**
 * Email templates for Merkato.
 * All templates return complete HTML strings safe to pass to Resend.
 * Design: dark background (#0A0A0B), accent indigo (#6366F1), clean.
 */

const BASE = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{{TITLE}}</title>
<style>
  body{margin:0;padding:0;background:#0A0A0B;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#FAFAFA;}
  .wrap{max-width:520px;margin:0 auto;padding:40px 24px;}
  .logo{display:flex;align-items:center;gap:10px;margin-bottom:40px;}
  .logo-box{width:32px;height:32px;background:#6366F1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#fff;line-height:32px;text-align:center;}
  .logo-name{font-size:16px;font-weight:600;color:#fff;}
  .card{background:#18181B;border:1px solid #27272A;border-radius:12px;padding:32px;}
  h1{margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;}
  p{margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);}
  p:last-child{margin-bottom:0;}
  .btn{display:inline-block;background:#6366F1;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:8px 0 20px;}
  .btn:hover{background:#5558E3;}
  .divider{border:none;border-top:1px solid #27272A;margin:24px 0;}
  .small{font-size:12px;color:rgba(255,255,255,0.4);}
  .code{font-family:monospace;font-size:28px;font-weight:700;letter-spacing:8px;color:#fff;background:#27272A;padding:16px 24px;border-radius:8px;display:inline-block;margin:8px 0 20px;}
  .footer{margin-top:32px;text-align:center;font-size:12px;color:rgba(255,255,255,0.3);}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">
    <div class="logo-box">M</div>
    <span class="logo-name">Merkato</span>
  </div>
  {{CONTENT}}
  <div class="footer">© {{YEAR}} Merkato · All rights reserved</div>
</div>
</body>
</html>`;

function base(title: string, content: string): string {
  return BASE.replace("{{TITLE}}", title)
    .replace("{{CONTENT}}", content)
    .replace("{{YEAR}}", new Date().getFullYear().toString());
}

// ---------------------------------------------------------------------------
// Workspace Invitation
// ---------------------------------------------------------------------------
export function invitationEmail(params: {
  inviterName: string;
  orgName: string;
  inviteUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.inviterName} invited you to ${params.orgName} on Merkato`,
    html: base(
      `Join ${params.orgName} on Merkato`,
      `<div class="card">
        <h1>You've been invited</h1>
        <p><strong style="color:#fff">${params.inviterName}</strong> has invited you to join
        <strong style="color:#fff">${params.orgName}</strong> on Merkato — the all-in-one
        platform for CRM, projects, team collaboration, and more.</p>
        <a href="${params.inviteUrl}" class="btn">Accept invitation</a>
        <hr class="divider"/>
        <p class="small">This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
        <p class="small">Or copy this link into your browser:<br/>${params.inviteUrl}</p>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------
export function passwordResetEmail(params: {
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reset your Merkato password",
    html: base(
      "Reset your password",
      `<div class="card">
        <h1>Reset your password</h1>
        <p>We received a request to reset the password for your Merkato account.
        Click the button below to choose a new password.</p>
        <a href="${params.resetUrl}" class="btn">Reset password</a>
        <hr class="divider"/>
        <p class="small">This link expires in 1 hour. If you didn't request a password reset,
        you can safely ignore this email — your password won't change.</p>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Email Verification (sent on signup when email confirm is enabled)
// ---------------------------------------------------------------------------
export function verificationEmail(params: {
  confirmUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Confirm your Merkato email address",
    html: base(
      "Confirm your email",
      `<div class="card">
        <h1>Confirm your email</h1>
        <p>Thanks for signing up for Merkato! Click the button below to verify your
        email address and activate your account.</p>
        <a href="${params.confirmUrl}" class="btn">Confirm email address</a>
        <hr class="divider"/>
        <p class="small">If you didn't create a Merkato account, you can safely ignore this email.</p>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// New ticket notification (sent to staff when a customer submits a ticket)
// ---------------------------------------------------------------------------
export function newTicketEmail(params: {
  customerName: string;
  subject: string;
  description: string;
  ticketUrl: string;
  orgName: string;
}): { subject: string; html: string } {
  return {
    subject: `[${params.orgName}] New support request: ${params.subject}`,
    html: base(
      "New support request",
      `<div class="card">
        <h1>New support request</h1>
        <p><strong style="color:#fff">${params.customerName}</strong> submitted a support
        request in <strong style="color:#fff">${params.orgName}</strong>.</p>
        <p><strong style="color:#fff">Subject:</strong> ${params.subject}</p>
        <p>${params.description.slice(0, 300)}${params.description.length > 300 ? "…" : ""}</p>
        <a href="${params.ticketUrl}" class="btn">View ticket</a>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Ticket reply notification (sent to customer when staff replies)
// ---------------------------------------------------------------------------
export function ticketReplyEmail(params: {
  subject: string;
  replyBody: string;
  ticketUrl: string;
  orgName: string;
}): { subject: string; html: string } {
  return {
    subject: `Re: ${params.subject} — ${params.orgName} support`,
    html: base(
      `Re: ${params.subject}`,
      `<div class="card">
        <h1>New reply on your request</h1>
        <p>The <strong style="color:#fff">${params.orgName}</strong> support team has replied
        to your request: <strong style="color:#fff">${params.subject}</strong>.</p>
        <p>${params.replyBody.slice(0, 400)}${params.replyBody.length > 400 ? "…" : ""}</p>
        <a href="${params.ticketUrl}" class="btn">View full reply</a>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Task assigned notification
// ---------------------------------------------------------------------------
export function taskAssignedEmail(params: {
  assignerName: string;
  taskTitle: string;
  projectUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You were assigned a task: "${params.taskTitle}"`,
    html: base(
      "Task assigned",
      `<div class="card">
        <h1>You have a new task</h1>
        <p><strong style="color:#fff">${params.assignerName}</strong> assigned you a task:
        <strong style="color:#fff">${params.taskTitle}</strong>.</p>
        <a href="${params.projectUrl}" class="btn">View task</a>
      </div>`
    ),
  };
}

// ---------------------------------------------------------------------------
// Weekly digest (summary of open deals, tasks, tickets)
// ---------------------------------------------------------------------------
export function weeklyDigestEmail(params: {
  userName: string;
  orgName: string;
  openDeals: number;
  openTasks: number;
  openTickets: number;
  appUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Your Merkato weekly summary — ${params.orgName}`,
    html: base(
      "Weekly summary",
      `<div class="card">
        <h1>Your weekly summary</h1>
        <p>Hi <strong style="color:#fff">${params.userName}</strong>, here's what's open in
        <strong style="color:#fff">${params.orgName}</strong> this week.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr>
            <td style="padding:12px;background:#27272A;border-radius:8px 0 0 8px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">${params.openDeals}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Open Deals</div>
            </td>
            <td style="width:4px;background:#0A0A0B;"></td>
            <td style="padding:12px;background:#27272A;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">${params.openTasks}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Open Tasks</div>
            </td>
            <td style="width:4px;background:#0A0A0B;"></td>
            <td style="padding:12px;background:#27272A;border-radius:0 8px 8px 0;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#fff;">${params.openTickets}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px;">Open Tickets</div>
            </td>
          </tr>
        </table>
        <a href="${params.appUrl}/dashboard" class="btn">Open Merkato</a>
      </div>`
    ),
  };
}
