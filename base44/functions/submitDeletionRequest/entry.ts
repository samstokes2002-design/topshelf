import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { email, message } = await req.json();

        if (!email) {
            return Response.json({ error: 'Email is required' }, { status: 400 });
        }

        // Send confirmation email to the requester
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: email,
            subject: "TopShelf — Account Deletion Request Received",
            body: `Hi,

We've received your request to permanently delete your TopShelf account associated with ${email}.

Your account and all associated data (profiles, sessions, seasons, stats) will be permanently deleted within 30 days.

You will receive a follow-up confirmation email once the deletion is complete.

If you submitted this request by mistake, please contact us immediately at support@topshelfapp.com.

---
TopShelf Hockey Performance Tracker
support@topshelfapp.com
`,
        });

        // Send notification to support/admin
        await base44.asServiceRole.integrations.Core.SendEmail({
            to: "support@topshelfapp.com",
            subject: `[TopShelf] Account Deletion Request — ${email}`,
            body: `A user has submitted an account deletion request via the public web form.

Account Email: ${email}
Request Date: ${new Date().toISOString()}
Additional Message: ${message || "(none)"}

Please process this deletion within 30 days.
`,
        });

        console.log(`Deletion request submitted for: ${email}`);
        return Response.json({ success: true });

    } catch (error) {
        console.error('Error submitting deletion request:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
});