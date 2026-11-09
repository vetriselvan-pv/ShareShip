# Shareship Backend Architecture & API Flow Report

This report provides a comprehensive review of the **Shareship backend workspace**, covering static analysis and type safety, coding standards, folder structure, API routing patterns, resilience fallbacks, and complete Mermaid sequence diagrams for all core API workflows.

---

## 1. Executive Summary & Code Quality Audit

| Area | Status | Notes |
| :--- | :---: | :--- |
| **Type Safety (`tsc --noEmit`)** | **PASSED (0 Errors)** | All strict TypeScript compiler checks pass cleanly across all routes, schemas, models, and plugins. |
| **Request Validation** | **PASSED** | Uniform Zod validation middleware (`validateBody`, `validateParams`, `validateQuery`) protects routes with typed payload extraction. |
| **Database Resilience** | **PASSED** | Dual-layer persistence: Live MongoDB Atlas cluster with automatic, zero-crash in-memory fallbacks when disconnected. |
| **Real-Time Synchronization** | **PASSED** | Native Fastify WebSocket plugin (`@fastify/websocket`) managed by `SyncManager` with auto-ping/pong heartbeat and broadcasting. |
| **Security Standards** | **PASSED** | AES-GCM / Base64 password decrypt-on-receive combined with 10-round salted bcrypt hashing before persistence. |
| **Naming & Casing** | **PASSED** | Consistent kebab-case filenames (`user.model.ts`, `connection.schema.ts`), camelCase variables/methods, and PascalCase types/models. |

---

## 2. Folder Structure Assessment

The backend codebase follows a clean, modular, domain-driven structure:

```
backend/
├── src/
│   ├── db/
│   │   ├── connection.ts       # MongoDB Atlas connection manager with status tracking
│   │   └── models.ts           # Backward-compatible re-export aggregator
│   ├── models/
│   │   ├── index.ts            # Central export barrel for all data models
│   │   ├── calendar-event.model.ts
│   │   ├── connection.model.ts
│   │   ├── event-expense.model.ts
│   │   ├── expense-transaction.model.ts
│   │   ├── live-scratchpad.model.ts
│   │   ├── notification.model.ts
│   │   ├── registry-item.model.ts
│   │   ├── shared-note.model.ts
│   │   └── user.model.ts
│   ├── plugins/
│   │   └── sync.ts             # SyncManager WebSocket hub & Fastify plugin
│   ├── routes/
│   │   ├── auth.ts             # Register, login, reset-password, user search
│   │   ├── calendar.ts         # Calendar event CRUD & user attribution
│   │   ├── connections.ts      # Partner discovery, connection request/respond
│   │   ├── dashboard.ts        # Aggregated home feed & quick status
│   │   ├── expenses.ts         # Expense transactions, splitting & rollups
│   │   ├── notes.ts            # To-Do checklists, ideas, and shared notes CRUD
│   │   └── notifications.ts    # Notification feed, mark-read, unread count
│   ├── types/
│   │   └── index.ts            # Shared system interfaces
│   ├── validation/
│   │   ├── index.ts            # Central validation schema exports
│   │   ├── middleware.ts       # Fastify preHandler schema validation guards
│   │   ├── auth.schema.ts
│   │   ├── calendar.schema.ts
│   │   ├── connection.schema.ts
│   │   ├── expense.schema.ts
│   │   ├── note.schema.ts
│   │   └── notification.schema.ts
│   └── index.ts                # Application bootstrap & lifecycle management
├── dist/                       # Transpiled JavaScript output
├── package.json
└── tsconfig.json               # NodeNext strict module & compilation settings
```

---

## 3. Core Coding Standards & Best Practices

1. **Explicit Return Types & Structured Error Responses**:
   * All API route failures return standard HTTP error codes (`400`, `404`, `409`) with a unified payload structure: `{ success: false, error: string, issues?: [...] }`.
2. **Defensive Parsing & Sanitization**:
   * User handles/identifiers are systematically normalized: trimmed, stripped of `@` prefixes, and case-lowered (`userId.trim().toLowerCase().replace(/^@+/, '')`).
3. **Resilient Dual Storage Architecture**:
   * When MongoDB Atlas is connected, queries and mutations commit to MongoDB.
   * If MongoDB is unreachable or offline, the backend transitions automatically to in-memory Maps (`inMemoryUsers`, `inMemoryConnections`, `notesList`, `calendarEvents`), ensuring local development and tests never crash.
4. **Decoupled Real-Time Sync**:
   * Mutations in routes notify connected clients via the WebSocket `syncManager` (`syncManager.broadcastToSpace(...)` and `syncService.sendSyncItem(...)`), ensuring real-time bidirectional reactivity between partners.

---

## 4. Mermaid Sequence Diagrams of API Flows

### Flow 1: Authentication & Password Reset Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Client
    participant AuthAPI as Fastify Auth Routes (/api/auth)
    participant Crypto as Crypto / Bcrypt
    participant Mongo as MongoDB Atlas (UserModel)
    participant Mem as In-Memory Fallback

    %% Registration
    rect rgb(240, 248, 245)
    Note over User,Mem: 1. User Registration Flow
    User->>AuthAPI: POST /api/auth/register { userId, name, email, password }
    AuthAPI->>Crypto: decryptPassword(password)
    Crypto-->>AuthAPI: plainPassword
    AuthAPI->>Crypto: bcrypt.hash(plainPassword, 10)
    Crypto-->>AuthAPI: hashedPassword
    alt MongoDB Online
        AuthAPI->>Mongo: UserModel.create({ userId, password: hashedPassword, ... })
        Mongo-->>AuthAPI: User Document Created
    else MongoDB Offline
        AuthAPI->>Mem: inMemoryUsers.set(userId, newUser)
    end
    AuthAPI-->>User: 201 Created { success: true, user }
    end

    %% Login
    rect rgb(245, 245, 250)
    Note over User,Mem: 2. Sign In Flow
    User->>AuthAPI: POST /api/auth/login { username, password }
    AuthAPI->>Crypto: decryptPassword(password)
    Crypto-->>AuthAPI: plainPassword
    alt Query Database
        AuthAPI->>Mongo: UserModel.findOne({ userId or email })
        Mongo-->>AuthAPI: matchedUser
    else In-Memory Fallback
        AuthAPI->>Mem: search inMemoryUsers
        Mem-->>AuthAPI: matchedUser
    end
    AuthAPI->>Crypto: bcrypt.compare(plainPassword, matchedUser.password)
    Crypto-->>AuthAPI: isPasswordValid (true)
    AuthAPI-->>User: 200 OK { success: true, user, token, space }
    end

    %% Reset Password
    rect rgb(255, 250, 240)
    Note over User,Mem: 3. Forgot / Reset Password Flow
    User->>AuthAPI: POST /api/auth/reset-password { identifier, newPassword }
    AuthAPI->>Crypto: decryptPassword(newPassword)
    AuthAPI->>Crypto: bcrypt.hash(plainPassword, 10)
    Crypto-->>AuthAPI: newHashedPassword
    alt Update DB
        AuthAPI->>Mongo: UserModel.updateOne({ userId }, { password: newHashedPassword })
    else Update Memory
        AuthAPI->>Mem: memUser.password = newHashedPassword
    end
    AuthAPI-->>User: 200 OK { success: true, message: "Password reset successfully" }
    end
```

---

### Flow 2: Real-Time WebSocket Synchronization Flow

```mermaid
sequenceDiagram
    autonumber
    actor ClientA as Partner A (User)
    actor ClientB as Partner B (User)
    participant WSEngine as Fastify WebSocket (/ws/sync)
    participant SyncMgr as SyncManager
    participant Heartbeat as Heartbeat Timer (30s)

    ClientA->>WSEngine: Connect WS /ws/sync?spaceId=space_1&userId=vetri&role=primary
    WSEngine->>SyncMgr: registerConnection(spaceId, connId, socket, role, userId)
    SyncMgr-->>ClientA: WS message { type: 'space_state', link, connectionId }

    ClientB->>WSEngine: Connect WS /ws/sync?spaceId=space_1&userId=partner&role=partner
    WSEngine->>SyncMgr: registerConnection(spaceId, connId, socket, role, userId)
    SyncMgr-->>ClientB: WS message { type: 'space_state', link, connectionId }
    SyncMgr-->>ClientA: Broadcast { type: 'partner_status', isOnline: true }

    %% Peer Sync Message
    Note over ClientA,ClientB: Partner A creates an item (e.g. note/expense)
    ClientA->>WSEngine: Send WS { type: 'sync_item', itemType: 'note', message: 'Vetri added a To-Do' }
    WSEngine->>SyncMgr: broadcastToSpace(spaceId, event, senderConnectionId)
    SyncMgr-->>ClientB: Forward { type: 'partner_ping', event, isSimulated: false }
    ClientB->>ClientB: Updates unread badge & toast

    %% Heartbeat
    loop Every 30 seconds
        Heartbeat->>SyncMgr: Ping all active sockets
        SyncMgr->>ClientA: ping
        SyncMgr->>ClientB: ping
        ClientA-->>SyncMgr: pong
        ClientB-->>SyncMgr: pong
    end
```

---

### Flow 3: Partner Connection Discovery & Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as Vetri (@vetri)
    actor Partner as Jamie (@jamie)
    participant ConnAPI as Fastify Connections Route (/api/connections)
    participant Mongo as MongoDB Atlas (ConnectionModel)
    participant NotifAPI as Notifications System
    participant SyncHub as WebSocket SyncManager

    User->>ConnAPI: GET /api/connections/search?q=jamie
    ConnAPI->>Mongo: UserModel.find({ name or userId: 'jamie' })
    Mongo-->>ConnAPI: [Jamie User Profile]
    ConnAPI-->>User: 200 OK { users: [{ userId: 'jamie', name: 'Jamie', status: 'none' }] }

    %% Send Request
    User->>ConnAPI: POST /api/connections/request { targetUserId: 'jamie' }
    ConnAPI->>Mongo: ConnectionModel.create({ requesterUserId: 'vetri', recipientUserId: 'jamie', status: 'pending' })
    ConnAPI->>NotifAPI: Create notification for Jamie ("Vetri sent you a partner request")
    ConnAPI->>SyncHub: Broadcast connection_request to Jamie's active sockets
    ConnAPI-->>User: 200 OK { success: true, status: 'pending' }

    %% Accept Request
    Partner->>ConnAPI: POST /api/connections/respond { connectionId, action: 'accept' }
    ConnAPI->>Mongo: ConnectionModel.updateOne({ status: 'connected', connectedAt: now })
    ConnAPI->>SyncHub: Link shared space & broadcast partner_connected
    ConnAPI-->>Partner: 200 OK { success: true, status: 'connected', spaceId }
    SyncHub-->>User: Push real-time notification: "Jamie accepted your partner request"
```

---

### Flow 4: Workspace Notes & Interactive Checklists Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Client)
    participant NotesAPI as Fastify Notes Route (/api/notes)
    participant Mongo as MongoDB Atlas (SharedNoteModel)
    participant SyncHub as WebSocket SyncManager

    %% Fetch Notes
    User->>NotesAPI: GET /api/notes
    NotesAPI->>Mongo: SharedNoteModel.find().lean()
    Mongo-->>NotesAPI: [List of To-Dos, Ideas, Notes]
    NotesAPI-->>User: 200 OK { notes: [...], totalCount: N }

    %% Create Note / Checklist
    User->>NotesAPI: POST /api/notes { title: "Weekend Chores", category: "TO-DOS", checklists: [...] }
    NotesAPI->>Mongo: SharedNoteModel.create(newNote)
    NotesAPI->>SyncHub: Broadcast note creation to partner
    NotesAPI-->>User: 201 Created { success: true, note: newNote }

    %% Toggle Checklist Item in View Mode
    User->>NotesAPI: POST /api/notes/:noteId/checklist/:checkId
    NotesAPI->>Mongo: SharedNoteModel.updateOne({ id: noteId, "checklists.id": checkId }, { $set: { completed: !completed } })
    NotesAPI->>SyncHub: Broadcast checklist update
    NotesAPI-->>User: 200 OK { success: true, item: { id: checkId, completed: true } }

    %% Edit Note
    User->>NotesAPI: PUT /api/notes/:id { title: "Updated Title", bodyPreview: "New Text" }
    NotesAPI->>Mongo: SharedNoteModel.findOneAndUpdate({ id }, { $set: updateData })
    NotesAPI->>SyncHub: Broadcast note edit
    NotesAPI-->>User: 200 OK { success: true, note: updatedNote }
```

---

### Flow 5: Shared Expenses & Event Consolidation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Client)
    participant ExpenseAPI as Fastify Expense Routes (/api/expenses)
    participant MongoTx as MongoDB Atlas (ExpenseTransactionModel)
    participant MongoEvt as MongoDB Atlas (EventExpenseModel)
    participant SyncHub as WebSocket SyncManager

    %% Add Expense
    User->>ExpenseAPI: POST /api/expenses { title: "Groceries", amount: 84.50, category: "Food", splitType: "split_50_50" }
    ExpenseAPI->>MongoTx: ExpenseTransactionModel.create({ ... })
    alt If tied to a Calendar Event
        ExpenseAPI->>MongoEvt: EventExpenseModel.updateOne({ eventId }, { $inc: { totalSpent: amount } })
    end
    ExpenseAPI->>SyncHub: Broadcast new expense to partner
    ExpenseAPI-->>User: 201 Created { success: true, transaction }

    %% Fetch Expenses & Rollup
    User->>ExpenseAPI: GET /api/expenses
    ExpenseAPI->>MongoTx: ExpenseTransactionModel.find().lean()
    ExpenseAPI->>MongoEvt: EventExpenseModel.find().lean()
    Note over ExpenseAPI: Calculates dynamic total, youPaid, partnerPaid, and fair split balance
    ExpenseAPI-->>User: 200 OK { transactions, eventExpenses, summary: { totalSpend, youPaid, partnerPaid, balance } }
```

---

## 5. Implemented Architectural Enhancements

1. **MongoDB Connection Reconnection Policy & Resilience** ([`src/db/connection.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/db/connection.ts#L18-L62)):
   * Added connection event listeners (`connected`, `disconnected`, `error`) on `mongoose.connection`.
   * Implemented automatic reconnection with exponential backoff (capped at 30 seconds) ensuring the server automatically recovers when MongoDB Atlas connectivity is restored.

2. **High-Performance Database Indexing**:
   * **`ConnectionModel`** ([`src/models/connection.model.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/models/connection.model.ts#L30-L33)): Compound indexes on `{ requesterUserId: 1, recipientUserId: 1 }` and `{ recipientUserId: 1, status: 1 }`.
   * **`ExpenseTransactionModel`** ([`src/models/expense-transaction.model.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/models/expense-transaction.model.ts#L46-L49)): Compound index on `{ userId: 1, timestamp: -1 }` and `{ eventId: 1, expenseType: 1 }`.
   * **`CalendarEventModel`** ([`src/models/calendar-event.model.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/models/calendar-event.model.ts#L43-L45)): Indexes on `{ userId: 1, date: 1 }` and `{ date: 1 }`.
   * **`SharedNoteModel`** ([`src/models/shared-note.model.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/models/shared-note.model.ts#L54-L56)): Index on `{ category: 1, timestamp: -1 }`.
   * **`ActivityNotificationModel`** ([`src/models/notification.model.ts`](file:///Users/vetriselvan/Documents/Projects/Share_and_Care/backend/src/models/notification.model.ts#L58-L60)): Compound index on `{ userId: 1, isRead: 1, timestamp: -1 }`.

3. **Strict Type Safety Compliance**:
   * Entire backend TypeScript compilation (`tsc --noEmit -p tsconfig.json`) passes with **0 errors**.
