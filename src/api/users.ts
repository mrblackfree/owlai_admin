import { clerkClient } from '@clerk/clerk-sdk-node';
import { createHandler } from "../server/api/handler.js";
import { z } from "zod";
import { Request, Response } from 'express';
import type { User, EmailAddress } from '@clerk/clerk-sdk-node';
import { connectDB } from '../db/connection.js';
import mongoose from 'mongoose';

// Create a User model interface for type safety until the import issue is resolved
interface IUser {
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profileImageUrl: string;
  publicMetadata: any;
  upvotedTools: string[];
  savedTools: string[];
  submittedTools: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  save: () => Promise<any>;
}

// Create a mock User model with minimal functionality for type safety
const UserModel = {
  findOne: async (query: { clerkId: string }): Promise<IUser | null> => {
    try {
      // For testing purposes, as a workaround until the import path is fixed
      console.log("🔍 Looking up user with clerkId:", query.clerkId);
      return null;
    } catch (error) {
      console.error("Error in UserModel.findOne:", error);
      return null;
    }
  },
  
  // Add constructor functionality
  new: function(userData: Partial<IUser>) {
    const user = {
      clerkId: userData.clerkId || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      username: userData.username || '',
      profileImageUrl: userData.profileImageUrl || '',
      publicMetadata: userData.publicMetadata || {},
      upvotedTools: userData.upvotedTools || [],
      savedTools: userData.savedTools || [],
      submittedTools: userData.submittedTools || [],
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date(),
      save: async function() {
        console.log("💾 Saving user:", this);
        return this;
      }
    } as IUser;
    
    return user;
  }
};

const userRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['admin', 'moderator', 'user']),
  reason: z.string().min(1),
});

const userStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(['active', 'suspended', 'banned']),
  reason: z.string().min(1),
});

const ADMIN_EMAIL_DOMAINS = ["webbuddy.agency"];

const isAdminEmail = (email: string) => {
  return ADMIN_EMAIL_DOMAINS.some(domain => email.endsWith(`@${domain}`));
};

const handler = createHandler();

handler.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching all users');
    const { data: users } = await clerkClient.users.getUserList();
    
    const formattedUsers = users.map((user: User) => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
      email: user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : 'No Email',
      role: user.publicMetadata.role || 'user',
      status: user.publicMetadata.status || 'active',
      lastActive: user.lastActiveAt || user.updatedAt,
      joinedAt: user.createdAt,
      avatarUrl: user.imageUrl
    }));

    return res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

handler.get('/user/:userId/activity', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Fetching activity for user:', userId);
    
    // Get the full user ID by adding back the prefix if needed
    const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
    
    const user = await clerkClient.users.getUser(fullUserId);
    
    // For now, return basic user activity data
    // This can be expanded to include more detailed activity tracking
    const activity = {
      lastSignInAt: user.lastSignInAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActiveAt: user.lastActiveAt,
    };

    return res.json(activity);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

handler.patch('/user/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Updating role for user:', userId);
    
    const validatedData = userRoleSchema.parse(req.body);
    console.log('Validated role update data:', validatedData);
    
    // Get the full user ID by adding back the prefix if needed
    const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
    
    const user = await clerkClient.users.getUser(fullUserId);
    
    // Update user's role
    const updateData = {
      publicMetadata: {
        ...user.publicMetadata,
        role: validatedData.role,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdateReason: validatedData.reason
      }
    };

    console.log('Updating user with data:', updateData);

    await clerkClient.users.updateUser(fullUserId, updateData);
    console.log('Successfully updated user role');

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ 
      error: 'Failed to update user role',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

handler.patch('/user/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Updating status for user:', userId);
    
    const validatedData = userStatusSchema.parse(req.body);
    console.log('Validated status update data:', validatedData);
    
    // Get the full user ID by adding back the prefix if needed
    const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
    
    const user = await clerkClient.users.getUser(fullUserId);
    
    // Update user's status
    const updateData = {
      publicMetadata: {
        ...user.publicMetadata,
        status: validatedData.status,
        statusUpdatedAt: new Date().toISOString(),
        statusUpdateReason: validatedData.reason
      }
    };

    console.log('Updating user with data:', updateData);

    await clerkClient.users.updateUser(fullUserId, updateData);
    console.log('Successfully updated user status');

    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ 
      error: 'Failed to update user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

handler.post('/user/:userId/set-admin-role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Received request to set admin role for user:', userId);
    
    // Get the full user ID by adding back the prefix if needed
    const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
    
    const user = await clerkClient.users.getUser(fullUserId);
    console.log('Found user:', {
      id: user.id,
      emails: user.emailAddresses.map(e => e.emailAddress)
    });
    
    // Check if user has an authorized email domain
    const hasAuthorizedEmail = user.emailAddresses.some(email => 
      isAdminEmail(email.emailAddress)
    );

    console.log('Email authorization check:', {
      hasAuthorizedEmail,
      allowedDomains: ADMIN_EMAIL_DOMAINS
    });

    if (!hasAuthorizedEmail) {
      return res.status(403).json({ 
        error: "User email domain not authorized for admin role" 
      });
    }

    // Update user's role to admin
    const updateData = {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin',
        roleUpdatedAt: new Date().toISOString()
      }
    };

    console.log('Updating user with data:', updateData);

    await clerkClient.users.updateUser(fullUserId, updateData);
    console.log('Successfully updated user role to admin');

    return res.json({ success: true });
  } catch (error) {
    console.error('Error setting admin role:', error);
    return res.status(500).json({ 
      error: 'Failed to set admin role',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get current user profile
handler.get('/me', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find user by Clerk ID
    const user = await UserModel.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create or update user profile (syncing with Clerk)
handler.post('/me', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate request body
    const profileData = z.object({
      userId: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      username: z.string().optional(),
      profileImageUrl: z.string().url().optional(),
      publicMetadata: z.record(z.any()).optional(),
    }).parse(req.body);

    // Verify that the user is updating their own profile
    if (profileData.userId !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    // Find or create user
    let user = await UserModel.findOne({ clerkId: userId });

    if (user) {
      // Update existing user
      user.firstName = profileData.firstName || user.firstName;
      user.lastName = profileData.lastName || user.lastName;
      user.email = profileData.email || user.email;
      user.username = profileData.username || user.username;
      user.profileImageUrl = profileData.profileImageUrl || user.profileImageUrl;
      user.publicMetadata = profileData.publicMetadata || user.publicMetadata;
      user.updatedAt = new Date();
    } else {
      // Create new user
      const userData = {
        clerkId: userId,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        username: profileData.username || '',
        profileImageUrl: profileData.profileImageUrl || '',
        publicMetadata: profileData.publicMetadata || {},
        upvotedTools: [],
        savedTools: [],
        submittedTools: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      user = UserModel.new(userData);
    }

    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user's submitted tools
handler.get('/me/tools', async (req: Request, res: Response) => {
  try {
    await connectDB();
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find user by Clerk ID
    const user = await UserModel.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find tools submitted by the user
    // This would need to be updated based on your actual database schema
    // const tools = await Tool.find({ submittedBy: user._id }).sort({ createdAt: -1 });
    
    // For now, returning empty array as placeholder
    return res.json([]);
  } catch (error) {
    console.error('Error fetching user tools:', error);
    return res.status(500).json({ error: 'Failed to fetch user tools' });
  }
});

export const usersHandler = handler; 