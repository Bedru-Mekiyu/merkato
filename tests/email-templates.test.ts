import { describe, it, expect } from "vitest";
import {
  invitationEmail,
  passwordResetEmail,
  verificationEmail,
  newTicketEmail,
  ticketReplyEmail,
  taskAssignedEmail,
  weeklyDigestEmail,
} from "@/lib/email/templates";

describe("Email Templates", () => {
  it("generates invitation email safely escaping parameters", () => {
    const email = invitationEmail({
      inviterName: "<script>Alice</script>",
      orgName: "Acme Corp",
      inviteUrl: "https://example.com/invite/123",
    });

    expect(email.subject).toContain("Alice");
    expect(email.subject).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;Alice&lt;/script&gt;");
    expect(email.html).toContain("https://example.com/invite/123");
  });

  it("generates password reset email with secure URL", () => {
    const email = passwordResetEmail({
      resetUrl: "https://example.com/reset?token=xyz",
    });

    expect(email.subject).toBe("Reset your Merkato password");
    expect(email.html).toContain("https://example.com/reset?token=xyz");
  });

  it("generates weekly digest email with counts", () => {
    const email = weeklyDigestEmail({
      userName: "Bob",
      orgName: "Startup Inc",
      openDeals: 5,
      openTasks: 12,
      openTickets: 3,
      appUrl: "https://example.com/dashboard",
    });

    expect(email.subject).toContain("Startup Inc");
    expect(email.html).toContain("5");
    expect(email.html).toContain("12");
    expect(email.html).toContain("3");
    expect(email.html).toContain("Open Deals");
  });

  it("generates task assigned email", () => {
    const email = taskAssignedEmail({
      assignerName: "Dev Lead",
      taskTitle: "Fix Database Migration",
      projectUrl: "https://example.com/projects/p1",
    });

    expect(email.subject).toContain("Fix Database Migration");
    expect(email.html).toContain("Fix Database Migration");
  });
});
