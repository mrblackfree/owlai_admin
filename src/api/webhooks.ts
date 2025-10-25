import { createHandler } from "../server/api/handler.js";
import { clerkClient } from '@clerk/clerk-sdk-node';
import type { WebhookEvent } from '@clerk/clerk-sdk-node';

const ADMIN_EMAIL_DOMAINS = ["webbuddy.agency"];

const handler = createHandler();

// Handle user creation webhook
handler.post('/clerk', async (req, res) => {
  const evt = req.body as WebhookEvent;
  
  try {
    switch (evt.type) {
      case 'user.created': {
        const { id, email_addresses } = evt.data;
        console.log('Processing user creation webhook for:', id);
        
        // Set initial role based on email domain
        const isAdmin = email_addresses.some((email: { email_address: string }) => 
          ADMIN_EMAIL_DOMAINS.some(domain => 
            email.email_address.endsWith(`@${domain}`)
          )
        );

        console.log('User email check:', {
          emails: email_addresses.map((e: { email_address: string }) => e.email_address),
          isAdmin,
          allowedDomains: ADMIN_EMAIL_DOMAINS
        });

        const updateData = {
          publicMetadata: {
            role: isAdmin ? 'admin' : 'user',
            status: 'active'
          }
        };

        console.log('Updating user with data:', updateData);

        await clerkClient.users.updateUser(id, updateData);
        console.log('Successfully updated user role');

        break;
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export const webhooksHandler = handler; 