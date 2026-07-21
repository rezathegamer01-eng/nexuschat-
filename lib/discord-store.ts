// Discord-like app state store using Zustand
import { create } from 'zustand';

export type OnlineStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  status: OnlineStatus;
  activity?: string;
  isBot?: boolean;
}

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  edited?: boolean;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  attachments?: { type: 'image'; url: string; name: string }[];
  isPinned?: boolean;
  replyTo?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'stage' | 'dm';
  categoryId?: string;
  topic?: string;
  unread?: number;
  mentioned?: boolean;
  locked?: boolean;
}

export interface ChannelCategory {
  id: string;
  name: string;
  collapsed?: boolean;
}

export interface Server {
  id: string;
  name: string;
  acronym: string;
  color: string;
  icon?: string;
  categories: ChannelCategory[];
  channels: Channel[];
  members: string[];
  isHome?: boolean;
}

export interface DirectMessage {
  id: string;
  userId: string;
  unread?: number;
}

const USERS: Record<string, User> = {
  'me': { id: 'me', name: 'you', displayName: 'You', avatar: '', status: 'online' },
  'u1': { id: 'u1', name: 'alex_storm', displayName: 'Alex Storm', avatar: '', status: 'online', activity: 'Playing Valorant' },
  'u2': { id: 'u2', name: 'nova_dev', displayName: 'Nova Dev', avatar: '', status: 'idle' },
  'u3': { id: 'u3', name: 'pixel_witch', displayName: 'Pixel Witch', avatar: '', status: 'dnd', activity: 'Streaming on Twitch' },
  'u4': { id: 'u4', name: 'coding_cat', displayName: 'Coding Cat', avatar: '', status: 'online' },
  'u5': { id: 'u5', name: 'midnight_fox', displayName: 'Midnight Fox', avatar: '', status: 'offline' },
  'u6': { id: 'u6', name: 'thunder_blade', displayName: 'Thunder Blade', avatar: '', status: 'online', activity: 'Listening to Spotify' },
  'u7': { id: 'u7', name: 'solar_punk', displayName: 'Solar Punk', avatar: '', status: 'idle' },
  'u8': { id: 'u8', name: 'nexus_bot', displayName: 'NexusBot', avatar: '', status: 'online', isBot: true },
};

const MESSAGES: Record<string, Message[]> = {
  'ch1': [
    { id: 'm1', authorId: 'u8', content: '👋 Welcome to **#general**! This is the start of the NexusChat community. Please read #rules before chatting.', timestamp: new Date(Date.now() - 86400000 * 3), reactions: [{ emoji: '👋', count: 12, reacted: false }, { emoji: '🎉', count: 5, reacted: true }] },
    { id: 'm2', authorId: 'u1', content: 'Hey everyone! Glad to be here. This place looks amazing 🔥', timestamp: new Date(Date.now() - 86400000 * 2) },
    { id: 'm3', authorId: 'u3', content: 'Welcome @alex_storm! Don\'t forget to grab your roles in #roles-and-intro', timestamp: new Date(Date.now() - 86400000 * 2 + 3600000) },
    { id: 'm4', authorId: 'u4', content: 'Has anyone tried the new update? The performance improvements are insane', timestamp: new Date(Date.now() - 3600000 * 5) },
    { id: 'm5', authorId: 'u2', content: 'Yeah the new update is 🔥🔥🔥 I was skeptical at first but they really nailed the optimization this time around', timestamp: new Date(Date.now() - 3600000 * 4) },
    { id: 'm6', authorId: 'u6', content: 'Just hit diamond rank in ranked mode. GGs to everyone I played with last night!', timestamp: new Date(Date.now() - 3600000 * 2), reactions: [{ emoji: '🎉', count: 8, reacted: false }, { emoji: '💎', count: 3, reacted: false }] },
    { id: 'm7', authorId: 'u1', content: 'Let\'s gooo!! Diamond grind was real. I remember when you were stuck in plat for weeks 😅', timestamp: new Date(Date.now() - 3600000 * 1) },
    { id: 'm8', authorId: 'u4', content: 'Anyone down for a 5-stack tonight? We need two more', timestamp: new Date(Date.now() - 1800000) },
    { id: 'm9', authorId: 'u2', content: 'I\'m in! What time are you thinking?', timestamp: new Date(Date.now() - 900000) },
    { id: 'm10', authorId: 'me', content: 'Count me in too! 9pm works for me', timestamp: new Date(Date.now() - 300000) },
  ],
  'ch2': [
    { id: 'a1', authorId: 'u8', content: '📢 **Version 2.5 Update Notes** — New ranked season begins today! Season rewards include exclusive weapon skins. Ranked resets at Diamond+. Good luck everyone!', timestamp: new Date(Date.now() - 86400000), reactions: [{ emoji: '🎉', count: 24, reacted: true }] },
  ],
  'ch3': [
    { id: 'g1', authorId: 'u3', content: 'Working on a new pixel art set. Here\'s a sneak peek of the character sprites 🎨', timestamp: new Date(Date.now() - 7200000) },
    { id: 'g2', authorId: 'u7', content: 'Those look incredible! What tool are you using?', timestamp: new Date(Date.now() - 7000000) },
    { id: 'g3', authorId: 'u3', content: 'Aseprite + custom palettes. The trick is limiting yourself to 16 colors per sprite', timestamp: new Date(Date.now() - 6800000) },
  ],
  'ch4': [
    { id: 'c1', authorId: 'u2', content: 'Anyone using the new React 19 concurrent features in production? Curious about real-world performance gains', timestamp: new Date(Date.now() - 10800000) },
    { id: 'c2', authorId: 'u4', content: '```typescript\nconst result = await use(dataPromise);\n// No more useEffect for data fetching!\n```\nThis is the future fr', timestamp: new Date(Date.now() - 10600000) },
    { id: 'c3', authorId: 'me', content: 'Been using it for 2 weeks. The `use()` hook is a game changer for async patterns. Just make sure your bundler supports it properly', timestamp: new Date(Date.now() - 10400000) },
  ],
};

interface DiscordStore {
  // Data
  servers: Server[];
  users: Record<string, User>;
  messages: Record<string, Message[]>;
  directMessages: DirectMessage[];
  
  // State
  activeServerId: string;
  activeChannelId: string;
  activeView: 'server' | 'dm';
  activeDmUserId: string | null;
  showMemberList: boolean;
  
  // Actions
  setActiveServer: (id: string) => void;
  setActiveChannel: (id: string) => void;
  setActiveDm: (userId: string) => void;
  setActiveView: (view: 'server' | 'dm') => void;
  toggleMemberList: () => void;
  sendMessage: (channelId: string, content: string) => void;
  toggleReaction: (channelId: string, messageId: string, emoji: string) => void;
}

export const useDiscordStore = create<DiscordStore>((set, get) => ({
  users: USERS,
  messages: MESSAGES,
  directMessages: [
    { id: 'dm1', userId: 'u1', unread: 2 },
    { id: 'dm2', userId: 'u3' },
    { id: 'dm3', userId: 'u6' },
  ],
  servers: [
    {
      id: 's0',
      name: 'Home',
      acronym: '🏠',
      color: '#5865f2',
      isHome: true,
      categories: [],
      channels: [],
      members: Object.keys(USERS),
    },
    {
      id: 's1',
      name: 'NexusChat HQ',
      acronym: 'NC',
      color: '#5865f2',
      categories: [
        { id: 'cat1', name: 'Information' },
        { id: 'cat2', name: 'Community' },
        { id: 'cat3', name: 'Gaming' },
        { id: 'cat4', name: 'Voice Channels' },
      ],
      channels: [
        { id: 'ch1', name: 'general', type: 'text', categoryId: 'cat2', topic: 'General chat for the community!' },
        { id: 'ch2', name: 'announcements', type: 'announcement', categoryId: 'cat1', locked: true },
        { id: 'ch5', name: 'rules', type: 'text', categoryId: 'cat1', locked: true },
        { id: 'ch3', name: 'art-showcase', type: 'text', categoryId: 'cat3' },
        { id: 'ch4', name: 'dev-talk', type: 'text', categoryId: 'cat3', unread: 3 },
        { id: 'ch6', name: 'off-topic', type: 'text', categoryId: 'cat2' },
        { id: 'vc1', name: 'General Voice', type: 'voice', categoryId: 'cat4' },
        { id: 'vc2', name: 'Gaming Room', type: 'voice', categoryId: 'cat4' },
        { id: 'vc3', name: 'Chill Zone', type: 'voice', categoryId: 'cat4' },
      ],
      members: ['me', 'u1', 'u2', 'u3', 'u4', 'u6', 'u7', 'u8'],
    },
    {
      id: 's2',
      name: 'Dev Squad',
      acronym: 'DS',
      color: '#23a559',
      categories: [
        { id: 'dcat1', name: 'General' },
        { id: 'dcat2', name: 'Projects' },
        { id: 'dcat3', name: 'Voice' },
      ],
      channels: [
        { id: 'dch1', name: 'general', type: 'text', categoryId: 'dcat1' },
        { id: 'dch2', name: 'code-review', type: 'text', categoryId: 'dcat2', unread: 1 },
        { id: 'dch3', name: 'frontend', type: 'text', categoryId: 'dcat2' },
        { id: 'dch4', name: 'backend', type: 'text', categoryId: 'dcat2' },
        { id: 'dvc1', name: 'Pair Programming', type: 'voice', categoryId: 'dcat3' },
      ],
      members: ['me', 'u2', 'u4', 'u8'],
    },
    {
      id: 's3',
      name: 'Gamer Lounge',
      acronym: 'GL',
      color: '#f0b232',
      categories: [
        { id: 'gcat1', name: 'General' },
        { id: 'gcat2', name: 'Games' },
      ],
      channels: [
        { id: 'gch1', name: 'lfg', type: 'text', categoryId: 'gcat1', unread: 5, mentioned: true },
        { id: 'gch2', name: 'valorant', type: 'text', categoryId: 'gcat2' },
        { id: 'gch3', name: 'minecraft', type: 'text', categoryId: 'gcat2' },
        { id: 'gvc1', name: 'Game Night', type: 'voice', categoryId: 'gcat2' },
      ],
      members: ['me', 'u1', 'u3', 'u5', 'u6', 'u7'],
    },
  ],

  activeServerId: 's1',
  activeChannelId: 'ch1',
  activeView: 'server',
  activeDmUserId: null,
  showMemberList: true,

  setActiveServer: (id) => {
    const store = get();
    const server = store.servers.find(s => s.id === id);
    if (server && server.channels.length > 0) {
      const firstTextChannel = server.channels.find(c => c.type === 'text' || c.type === 'announcement');
      set({ activeServerId: id, activeChannelId: firstTextChannel?.id || server.channels[0].id, activeView: 'server' });
    } else {
      set({ activeServerId: id, activeView: 'server' });
    }
  },

  setActiveChannel: (id) => {
    set({ activeChannelId: id });
    // Mark as read
    const store = get();
    const server = store.servers.find(s => s.id === store.activeServerId);
    if (server) {
      const updatedServers = store.servers.map(s => ({
        ...s,
        channels: s.channels.map(c => c.id === id ? { ...c, unread: 0, mentioned: false } : c),
      }));
      set({ servers: updatedServers });
    }
  },

  setActiveDm: (userId) => set({ activeDmUserId: userId, activeView: 'dm' }),
  setActiveView: (view) => set({ activeView: view }),
  toggleMemberList: () => set(s => ({ showMemberList: !s.showMemberList })),

  sendMessage: (channelId, content) => {
    if (!content.trim()) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      authorId: 'me',
      content,
      timestamp: new Date(),
    };
    set(state => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), newMsg],
      },
    }));
  },

  toggleReaction: (channelId, messageId, emoji) => {
    set(state => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] || []).map(msg => {
          if (msg.id !== messageId) return msg;
          const reactions = msg.reactions || [];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            return {
              ...msg,
              reactions: reactions.map(r =>
                r.emoji === emoji
                  ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
                  : r
              ).filter(r => r.count > 0),
            };
          }
          return { ...msg, reactions: [...reactions, { emoji, count: 1, reacted: true }] };
        }),
      },
    }));
  },
}));
