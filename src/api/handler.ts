import { Request, Response } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

interface ClerkAuthObject {
    auth: { userId: string };
}

// Extend the Request type to include auth
declare global {
    namespace Express {
        interface Request {
            auth?: any;
        }
    }
}

type Handler = {
    get: (path: string, handler: (req: Request, res: Response) => Promise<any>) => void;
    post: (path: string, handler: (req: Request, res: Response) => Promise<any>) => void;
    patch: (path: string, handler: (req: Request, res: Response) => Promise<any>) => void;
    delete: (path: string, handler: (req: Request, res: Response) => Promise<any>) => void;
    middleware: () => any;
};

export function createHandler(): Handler {
    const routes = new Map<string, Map<string, (req: Request, res: Response) => Promise<void>>>();

    const handler: Handler = {
        get(path, routeHandler) {
            if (!routes.has('GET')) routes.set('GET', new Map());
            routes.get('GET')!.set(path, routeHandler);
        },
        post(path, routeHandler) {
            if (!routes.has('POST')) routes.set('POST', new Map());
            routes.get('POST')!.set(path, routeHandler);
        },
        patch(path, routeHandler) {
            if (!routes.has('PATCH')) routes.set('PATCH', new Map());
            routes.get('PATCH')!.set(path, routeHandler);
        },
        delete(path, routeHandler) {
            if (!routes.has('DELETE')) routes.set('DELETE', new Map());
            routes.get('DELETE')!.set(path, routeHandler);
        },
        middleware() {
            return async (req: Request, res: Response) => {
                try {
                    // Convert route patterns to regex
                    const method = req.method;
                    const methodRoutes = routes.get(method);

                    if (!methodRoutes) {
                        return res.status(405).json({ error: 'Method not allowed' });
                    }

                    console.log('Processing request:', { method, path: req.path });

                    let matchedHandler: ((req: Request, res: Response) => Promise<void>) | undefined;
                    let matchedParams: { [key: string]: string } = {};

                    // First, sort routes to prioritize more specific ones
                    // (routes with more segments and fewer parameters)
                    const sortedRoutes = Array.from(methodRoutes.entries()).sort((a, b) => {
                        const aSegments = a[0].split('/').length;
                        const bSegments = b[0].split('/').length;
                        
                        // More segments = more specific
                        if (aSegments !== bSegments) {
                            return bSegments - aSegments;
                        }
                        
                        // More static path parts = more specific
                        const aParams = (a[0].match(/:[a-zA-Z]+/g) || []).length;
                        const bParams = (b[0].match(/:[a-zA-Z]+/g) || []).length;
                        return aParams - bParams;
                    });

                    for (const [pattern, handler] of sortedRoutes) {
                        // Prepare the regex pattern by replacing parameter placeholders
                        const patternSegments = pattern.split('/');
                        const pathSegments = req.path.split('/');
                        
                        // Check if the segments count matches, disregarding empty segments
                        const filteredPatternSegments = patternSegments.filter(s => s !== '');
                        const filteredPathSegments = pathSegments.filter(s => s !== '');
                        
                        if (filteredPatternSegments.length !== filteredPathSegments.length) {
                            continue;
                        }
                        
                        // Convert Express-style route pattern to a regex pattern
                        const regexPattern = pattern
                            .replace(/:[a-zA-Z]+/g, '([^/]+)')
                            .replace(/\//g, '\\/');
                        const regex = new RegExp(`^${regexPattern}$`);
                        
                        console.log('Route matching:', { pattern, requestPath: req.path, matches: regex.test(req.path) });

                        if (regex.test(req.path)) {
                            // Extract parameter names from the pattern
                            const paramNames = (pattern.match(/:[a-zA-Z]+/g) || [])
                                .map(param => param.substring(1));
                            
                            // Extract parameter values from the path
                            const paramValues = req.path.match(regex)?.slice(1) || [];
                            
                            // Create key-value pairs of parameter names and values
                            const params = Object.fromEntries(
                                paramNames.map((name, i) => [name, paramValues[i]])
                            );
                            
                            matchedHandler = handler;
                            matchedParams = params;
                            break;
                        }
                    }

                    if (!matchedHandler) {
                        return res.status(404).json({ error: 'Not found' });
                    }

                    console.log('Found matching handler:', req.path);
                    console.log('Extracted params:', matchedParams);

                    // Add params to request object
                    req.params = { ...req.params, ...matchedParams };

                    // Define routes that should be public (no auth required)
                    const publicRoutes = [
                        '/api/tools',           // Public tool submission
                        '/api/sales-inquiries', // Contact/sales inquiry form
                        '/api/newsletter'       // Newsletter signup
                    ];
                    
                    // Define admin routes that require authentication
                    const adminRoutes = [
                        '/api/tools/:id/status'  // Tool status updates
                    ];
                    
                    // Check if this is a public route that should bypass authentication
                    const isPublicRoute = publicRoutes.some(route => 
                        req.originalUrl.startsWith(route) && 
                        (method === 'POST' || method === 'OPTIONS')
                    );
                    
                    // Allow status updates without authentication for now (temporary fix)
                    // This is a workaround until proper auth is implemented
                    const isStatusUpdate = req.originalUrl.includes('/status') && method === 'PATCH';
                    
                    // Check if user is authenticated for non-GET requests, except for public routes
                    if (method !== 'GET' && !isPublicRoute && !isStatusUpdate) {
                        try {
                            await ClerkExpressRequireAuth()(req as any, res as any, () => { });
                            // Safely access userId with optional chaining
                            const userId = req.auth?.userId;
                            if (userId) {
                                console.log('Clerk auth passed, user:', userId);
                            } else {
                                console.log('Authenticated but userId not found');
                            }
                        } catch (error) {
                            console.error('Auth error:', error);
                            return res.status(401).json({ error: 'Unauthorized' });
                        }
                    } else if (isPublicRoute) {
                        console.log('Public route, skipping authentication check');
                    } else if (isStatusUpdate) {
                        console.log('Status update route, skipping authentication check');
                    }

                    await matchedHandler(req, res);
                } catch (error) {
                    console.error('Handler error:', error);
                    res.status(500).json({ error: 'Internal server error' });
                }
            };
        },
    };

    return handler;
} 