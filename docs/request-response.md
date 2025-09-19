# Request/Response API Documentation

Request/Response provides bidirectional request/response communication between elements and controllers using async generators.

## Table of Contents
- [Basic Concept](#basic-concept)
- [Request/Response Decorators](#requestresponse-decorators)
- [Element-Side Requests](#element-side-requests)
- [Controller-Side Responses](#controller-side-responses)
- [Request/Response Options](#requestresponse-options)
- [Error Handling](#error-handling)
- [Advanced Patterns](#advanced-patterns)

## Basic Concept

Request/Response enables a request/response pattern between elements and their controllers:

1. **Element** sends a request using `yield`
2. **Controller** receives the request and returns a response
3. **Element** receives the response and can process it

This pattern is implemented using async generators and custom events.

## Request/Response Decorators

### Signature

```typescript
function request(requestName: string, options?: RequestOptions): MethodDecorator
function response(responseName: string, options?: RespondOptions): MethodDecorator

interface RequestOptions extends EventInit {
  timeout?: number;         // Response timeout in ms (default: 120000ms = 2 minutes)
  discoveryTimeout?: number; // Handler discovery timeout in ms (default: 50ms)
  debounce?: number;        // Debounce requests by specified ms
  throttle?: number;        // Throttle requests by specified ms
}

interface RespondOptions {
  debounce?: number;   // Debounce responses by specified ms
  throttle?: number;   // Throttle responses by specified ms
}

// Type helper to eliminate TypeScript warnings in request generators
// Use this for method signatures - it handles both the generator implementation and promise return
type Response<T> = AsyncGenerator<any, T, any> | Promise<T>;
```

#### Response Debounce/Throttle

Response handlers can also be debounced or throttled to prevent excessive processing:

```typescript
@controller('heavy-processing-controller')
class ProcessingController implements IController {
  
  @respond('@api/expensive-calculation', { debounce: 1000 })
  async calculateResults(params: any) {
    // Debounced by 1 second - rapid requests will only trigger the latest
    return await performExpensiveCalculation(params);
  }
  
  @respond('@api/real-time-updates', { throttle: 500 })
  async handleUpdates(data: any) {
    // Throttled to max 2 requests per second
    return await processUpdate(data);
  }
}
```

## Element-Side Requests

Elements use async generators to make requests:

```typescript
import { element, request, Response } from 'snice';

@element('user-card')
class UserCard extends HTMLElement {
  userId = 123;
  
  html() {
    return `
      <div class="user-info">
        <button class="load">Load User</button>
        <div class="content"></div>
      </div>
    `;
  }
  
  @request('fetch-user')
  async *fetchUserData(): Response<{ success: boolean; user: any }> {
    // Yield sends the request, await waits for response
    const user = await (yield { userId: this.userId });
    
    // Process the response
    this.displayUser(user);
    
    // Return final value (optional)
    return { success: true, user };
  }
  
  async loadUser() {
    try {
      const result = await this.fetchUserData();
      console.log('Load complete:', result);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }
  
  displayUser(user: any) {
    const content = this.shadowRoot?.querySelector('.content');
    if (content) {
      content.innerHTML = `
        <h3>${user.name}</h3>
        <p>${user.email}</p>
      `;
    }
  }
}
```

### Multiple Yields

Elements can yield multiple times in a single channel:

```typescript
@element('multi-request')
class MultiRequest extends HTMLElement {
  @request('multi-data')
  async *fetchMultipleData() {
    // First request
    const userData = await (yield { type: 'user', id: 1 });
    console.log('Got user:', userData);
    
    // Second request based on first response
    const postsData = await (yield { type: 'posts', userId: userData.id });
    console.log('Got posts:', postsData);
    
    // Third request
    const commentsData = await (yield { type: 'comments', postIds: postsData.map(p => p.id) });
    console.log('Got comments:', commentsData);
    
    // Return combined result
    return {
      user: userData,
      posts: postsData,
      comments: commentsData
    };
  }
}
```

## Controller-Side Responses

Controllers handle requests and provide responses:

```typescript
import { controller, respond, IController } from 'snice';

@controller('user-controller')
class UserController implements IController {
  element: HTMLElement | null = null;
  
  async attach(element: HTMLElement) {
    console.log('User controller attached');
  }
  
  async detach(element: HTMLElement) {
    console.log('User controller detached');
  }
  
  @respond('fetch-user')
  async handleFetchUser(request: { userId: number }) {
    // Simulate API call
    const response = await fetch(`/api/users/${request.userId}`);
    const user = await response.json();
    
    // Return response to element
    return user;
  }
  
  @respond('multi-data')
  async handleMultiData(request: any) {
    switch (request.type) {
      case 'user':
        return await this.fetchUser(request.id);
      case 'posts':
        return await this.fetchPosts(request.userId);
      case 'comments':
        return await this.fetchComments(request.postIds);
      default:
        throw new Error(`Unknown request type: ${request.type}`);
    }
  }
  
  private async fetchUser(id: number) {
    // Simulate API call
    return { id, name: 'John Doe', email: 'john@example.com' };
  }
  
  private async fetchPosts(userId: number) {
    // Simulate API call
    return [
      { id: 1, userId, title: 'Post 1' },
      { id: 2, userId, title: 'Post 2' }
    ];
  }
  
  private async fetchComments(postIds: number[]) {
    // Simulate API call
    return postIds.flatMap(postId => [
      { id: 1, postId, text: 'Comment 1' },
      { id: 2, postId, text: 'Comment 2' }
    ]);
  }
}
```

## Request/Response Options

### RequestOptions

```typescript
interface RequestOptions extends EventInit {
  timeout?: number;         // Response timeout in ms (default: 120000ms = 2 minutes)
  discoveryTimeout?: number; // Handler discovery timeout in ms (default: 50ms)
  debounce?: number;        // Debounce requests by specified ms
  throttle?: number;        // Throttle requests by specified ms
}
```

#### Timeout Behavior (IMPORTANT)

The timeout system has **two separate timeouts** for different phases:

- **Discovery timeout** (`discoveryTimeout`): 50ms (default) - Fast timeout to find a handler
- **Response timeout** (`timeout`): 2 minutes (default) - Total time allowed for the request

```typescript
@request('@api/heavy-processing', { 
  discoveryTimeout: 50,      // 50ms to find handler (fast)
  timeout: 30000            // 30s total timeout for processing
})
async *processData() {
  // Will timeout in 50ms if no handler exists
  // Will timeout in 30s total if processing takes too long
  const result = await (yield data);
  return result;
}
```

**Why two timeouts?**
- **Discovery**: Should be very fast (dozens of milliseconds) - just finding if anyone can handle the request
- **Response**: Should be human-scale (seconds/minutes) - actual work takes time

#### Debounce Support

Prevents rapid successive requests by delaying execution:

```typescript
@request('@api/search', { debounce: 300 })
async *search() {
  // Debounced by 300ms - rapid calls will cancel previous ones
  const results = await (yield query);
  return results;
}
```

#### Throttle Support

Limits request frequency to maximum rate:

```typescript
@request('@api/analytics', { throttle: 1000 })
async *trackEvent() {
  // Throttled to max 1 request per second
  const response = await (yield eventData);
  return response;
}
```

### Timeout Configuration

```typescript
@element('timeout-example')
class TimeoutExample extends HTMLElement {
  // Quick discovery, short total timeout for fast operations
  @request('quick-data', { 
    discoveryTimeout: 25,  // Very fast discovery
    timeout: 1000          // 1 second total
  })
  async *fetchQuickData() {
    const data = await (yield { quick: true });
    return data;
  }
  
  // Standard discovery, longer timeout for slow operations
  @request('slow-data', { 
    discoveryTimeout: 50,  // Default discovery
    timeout: 30000         // 30 seconds total
  })
  async *fetchSlowData() {
    const data = await (yield { slow: true });
    return data;
  }
  
  // Use defaults (50ms discovery, 2 minutes total)
  @request('default-data')
  async *fetchDefaultData() {
    const data = await (yield { default: true });
    return data;
  }
  
  // Custom event options with timeouts
  @request('private-data', { 
    discoveryTimeout: 100, // Slower discovery
    timeout: 60000,        // 1 minute total
    bubbles: false,        // Don't bubble
    cancelable: true       // Can be canceled
  })
  async *fetchPrivateData() {
    const data = await (yield { private: true });
    return data;
  }
}
```

## Error Handling

### Handling Timeouts

```typescript
@element('timeout-handler')
class TimeoutHandler extends HTMLElement {
  @request('data', { 
    discoveryTimeout: 50,
    timeout: 5000 
  })
  async *fetchData() {
    try {
      const data = await (yield { request: 'data' });
      return { success: true, data };
    } catch (error) {
      // Handle different types of timeout errors
      if (error.message.includes('timed out after') && error.message.includes('no handler found')) {
        console.error('No handler found for request');
        return { success: false, error: 'no_handler' };
      } else if (error.message.includes('timed out after')) {
        console.error('Request processing timed out');
        return { success: false, error: 'timeout' };
      }
      throw error;
    }
  }
  
  async loadData() {
    try {
      const result = await this.fetchData();
      if (!result.success) {
        this.showError('Failed to load data');
      }
    } catch (error) {
      this.showError('Unexpected error');
    }
  }
  
  showError(message: string) {
    console.error(message);
  }
}
```

### Controller Error Handling

```typescript
@controller('error-controller')
class ErrorController implements IController {
  element: HTMLElement | null = null;
  
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}
  
  @respond('risky-operation')
  async handleRiskyOperation(request: any) {
    try {
      // Validate request
      if (!request.id) {
        throw new Error('ID is required');
      }
      
      // Perform operation
      const result = await this.performOperation(request.id);
      
      return { success: true, result };
    } catch (error: any) {
      // Return error info instead of throwing
      return { 
        success: false, 
        error: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      };
    }
  }
  
  private async performOperation(id: string) {
    // Simulate operation that might fail
    if (Math.random() > 0.5) {
      throw new Error('Random failure');
    }
    return { id, processed: true };
  }
}
```

## Advanced Patterns

### Authentication Request/Response

```typescript
// Element side
@element('protected-content')
class ProtectedContent extends HTMLElement {
  @request('authenticate')
  async *authenticate() {
    // Send credentials
    const authResult = await (yield { 
      username: 'user@example.com',
      password: 'secret'
    });
    
    if (!authResult.success) {
      throw new Error(authResult.error);
    }
    
    // Store token
    localStorage.setItem('token', authResult.token);
    
    return authResult;
  }
  
  @request('fetch-protected')
  async *fetchProtectedData() {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Need to authenticate first
      await this.authenticate();
    }
    
    // Fetch with token
    const data = await (yield { 
      resource: 'protected',
      token: localStorage.getItem('token')
    });
    
    return data;
  }
}

// Controller side
@controller('auth-controller')
class AuthController implements IController {
  element: HTMLElement | null = null;
  private tokens = new Map<string, any>();
  
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}
  
  @respond('authenticate')
  async handleAuth(credentials: any) {
    // Validate credentials
    if (credentials.username === 'user@example.com' && 
        credentials.password === 'secret') {
      
      const token = this.generateToken();
      const user = { id: 1, name: 'User' };
      
      this.tokens.set(token, user);
      
      return { 
        success: true, 
        token,
        user
      };
    }
    
    return { 
      success: false, 
      error: 'Invalid credentials' 
    };
  }
  
  @respond('fetch-protected')
  async handleFetchProtected(request: any) {
    // Validate token
    const user = this.tokens.get(request.token);
    
    if (!user) {
      throw new Error('Invalid or expired token');
    }
    
    // Return protected data
    return {
      resource: request.resource,
      data: { secret: 'Protected information' },
      user
    };
  }
  
  private generateToken() {
    return Math.random().toString(36).substring(2);
  }
}
```

### Streaming Data Request/Response

```typescript
// Element side
@element('data-streamer')
class DataStreamer extends HTMLElement {
  private items: any[] = [];
  
  @request('stream-data')
  async *streamData() {
    let hasMore = true;
    let page = 1;
    
    while (hasMore) {
      // Request next page
      const response = await (yield { 
        page,
        pageSize: 10
      });
      
      // Add items to list
      this.items.push(...response.items);
      this.renderItems();
      
      // Check if more pages available
      hasMore = response.hasMore;
      page++;
    }
    
    return { 
      totalItems: this.items.length,
      complete: true
    };
  }
  
  renderItems() {
    const container = this.shadowRoot?.querySelector('.items');
    if (container) {
      container.innerHTML = this.items
        .map(item => `<div>${item.name}</div>`)
        .join('');
    }
  }
  
  html() {
    return `
      <button class="load">Load All Data</button>
      <div class="items"></div>
    `;
  }
  
  async loadAllData() {
    const result = await this.streamData();
    console.log(`Loaded ${result.totalItems} items`);
  }
}

// Controller side
@controller('stream-controller')
class StreamController implements IController {
  element: HTMLElement | null = null;
  private allData: any[] = Array.from({ length: 35 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`
  }));
  
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}
  
  @respond('stream-data')
  async handleStreamData(request: { page: number; pageSize: number }) {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate pagination
    const start = (request.page - 1) * request.pageSize;
    const end = start + request.pageSize;
    
    const items = this.allData.slice(start, end);
    const hasMore = end < this.allData.length;
    
    return {
      items,
      hasMore,
      page: request.page,
      totalPages: Math.ceil(this.allData.length / request.pageSize)
    };
  }
}
```

### Cached Request/Response

```typescript
@controller('cached-controller')
class CachedController implements IController {
  element: HTMLElement | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute
  
  async attach(element: HTMLElement) {}
  async detach(element: HTMLElement) {}
  
  @respond('fetch-cached')
  async handleFetchCached(request: { key: string; forceRefresh?: boolean }) {
    const cacheKey = request.key;
    const cached = this.cache.get(cacheKey);
    
    // Check cache validity
    if (!request.forceRefresh && cached) {
      const age = Date.now() - cached.timestamp;
      if (age < this.cacheTimeout) {
        console.log(`Returning cached data for ${cacheKey}`);
        return { 
          data: cached.data,
          fromCache: true,
          age
        };
      }
    }
    
    // Fetch fresh data
    console.log(`Fetching fresh data for ${cacheKey}`);
    const freshData = await this.fetchFreshData(cacheKey);
    
    // Update cache
    this.cache.set(cacheKey, {
      data: freshData,
      timestamp: Date.now()
    });
    
    return {
      data: freshData,
      fromCache: false,
      age: 0
    };
  }
  
  private async fetchFreshData(key: string) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { key, value: Math.random(), timestamp: Date.now() };
  }
}
```

### Bidirectional Updates

```typescript
// Element that can both request and be updated
import { element, property, query, request, watch } from 'snice';

@element('live-data')
class LiveData extends HTMLElement {
  private updateInterval?: number;

  @property()
  status = 'Disconnected';
  
  @query('.status')
  statusDiv?: HTMLElement;
  
  @query('.data')
  dataDiv?: HTMLElement;
  
  html() {
    return `
      <div class="status">${this.status}</div>
      <div class="data"></div>
      <button class="connect">Connect</button>
      <button class="disconnect">Disconnect</button>
    `;
  }
  
  @request('subscribe')
  async *subscribe() {
    // Send subscription request
    const subscription = await (yield { 
      subscribe: true,
      events: ['update', 'status']
    });
    
    if (subscription.success) {
      this.status = 'Connected';  // @watch will handle UI update
      
      // Start polling for updates
      this.startPolling();
    }
    
    return subscription;
  }
  
  @request('poll-updates')
  async *pollForUpdates() {
    const updates = await (yield { poll: true });
    
    if (updates && updates.length > 0) {
      this.processUpdates(updates);
    }
    
    return { processed: updates.length };
  }
  
  startPolling() {
    this.updateInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, 2000);
  }
  
  stopPolling() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  processUpdates(updates: any[]) {
    if (this.dataDiv) {
      updates.forEach(update => {
        const entry = document.createElement('div');
        entry.textContent = `${update.type}: ${update.value}`;
        this.dataDiv!.appendChild(entry);
      });
    }
  }
  
  @watch('status')
  updateStatus() {
    if (this.statusDiv) {
      this.statusDiv.textContent = this.status;
    }
  }
  
  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.stopPolling();
  }
}

// Controller that manages subscriptions
@controller('subscription-controller')
class SubscriptionController implements IController {
  element: HTMLElement | null = null;
  private subscribers = new Set<string>();
  private updates: any[] = [];
  
  async attach(element: HTMLElement) {
    // Generate updates periodically
    setInterval(() => {
      this.updates.push({
        type: 'update',
        value: Math.random(),
        timestamp: Date.now()
      });
    }, 3000);
  }
  
  async detach(element: HTMLElement) {
    this.subscribers.clear();
  }
  
  @respond('subscribe')
  handleSubscribe(request: any) {
    if (request.subscribe) {
      const id = Math.random().toString(36);
      this.subscribers.add(id);
      
      return {
        success: true,
        subscriptionId: id,
        events: request.events
      };
    }
    
    return { success: false };
  }
  
  @respond('poll-updates')
  handlePollUpdates(request: any) {
    if (!request.poll) return [];
    
    // Return and clear updates
    const updates = [...this.updates];
    this.updates = [];
    
    return updates;
  }
}
```

