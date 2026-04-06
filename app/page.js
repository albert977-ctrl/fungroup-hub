'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Search,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Paperclip,
  Star,
  Clock,
  CheckCheck,
  X,
  Menu,
  Bell,
  Settings,
  User,
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Brand configuration
const BRANDS = [
  { id: 'werentfun', name: 'We Rent Fun', color: '#8b5cf6' },
  { id: 'justbounce', name: 'Just Bounce Miami', color: '#06b6d4' },
  { id: 'lasertag', name: 'Laser Tag Of Miami', color: '#f59e0b' },
];

const CHANNELS = [
  { id: 'email', name: 'Email', icon: Mail, badgeBg: '#dbeafe', badgeColor: '#1d4ed8' },
  { id: 'ghl', name: 'HighLevel', icon: MessageSquare, badgeBg: '#dcfce7', badgeColor: '#15803d' },
  { id: 'ringcentral', name: 'RingCentral', icon: Phone, badgeBg: '#fef3c7', badgeColor: '#b45309' },
];

// Helper Components
function ChannelBadge({ channel }) {
  const channelConfig = CHANNELS.find(c => c.id === channel);
  if (!channelConfig) return null;

  return (
    <span style={{
      display: 'inline-block',
      backgroundColor: channelConfig.badgeBg,
      color: channelConfig.badgeColor,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '500',
      textTransform: 'uppercase',
    }}>
      {channelConfig.name}
    </span>
  );
}

function BrandDot({ brand }) {
  const brandConfig = BRANDS.find(b => b.id === brand);
  return (
    <div style={{
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: brandConfig?.color || '#94a3b8',
      flexShrink: 0,
    }} />
  );
}

function AvatarCircle({ initials, bgColor = '#4f46e5' }) {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: bgColor,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '300px',
    }}>
      <Loader2 size={32} style={{ color: '#4f46e5', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#64748b',
      padding: '40px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Mail size={40} color="#94a3b8" />
      </div>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
        Select a conversation
      </h2>
      <p style={{ fontSize: '14px', marginBottom: '20px' }}>
        Choose a message from the left to view the full thread
      </p>
    </div>
  );
}

function MessageRow({ message, isSelected, onClick, unreadCount }) {
  const brandConfig = BRANDS.find(b => b.id === message.brand);
  const channelConfig = CHANNELS.find(c => c.id === message.channel);
  const initials = message.from.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#eef2ff' : 'white',
        borderLeft: isSelected ? '3px solid #4f46e5' : '3px solid transparent',
        transition: 'background-color 200ms',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <AvatarCircle initials={initials} bgColor={brandConfig?.color} />
          {message.unread && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              border: '2px solid white',
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              <BrandDot brand={message.brand} />
              <span style={{
                fontWeight: message.unread ? '600' : '500',
                color: '#1e293b',
                fontSize: '14px',
              }}>
                {message.from}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              {message.time}
            </span>
          </div>

          <div style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#334155',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {message.subject}
          </div>

          <div style={{
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {message.preview}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ChannelBadge channel={message.channel} />
            {message.starred && <Star size={12} fill="#fbbf24" color="#f59e0b" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadMessage({ message, isOwn }) {
  const initials = message.from.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      gap: '8px',
    }}>
      {!isOwn && <AvatarCircle initials={initials} bgColor="#64748b" />}

      <div style={{
        maxWidth: '60%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}>
        {!isOwn && (
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
            {message.from}
          </span>
        )}

        <div style={{
          backgroundColor: isOwn ? '#4f46e5' : '#e2e8f0',
          color: isOwn ? 'white' : '#1e293b',
          padding: '12px 16px',
          borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          wordBreak: 'break-word',
          fontSize: '14px',
          lineHeight: '1.5',
        }}>
          {message.body}
        </div>

        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          fontSize: '12px',
          color: '#94a3b8',
          marginTop: '4px',
        }}>
          <Clock size={12} />
          {message.timestamp}
          {isOwn && <CheckCheck size={12} color="#10b981" />}
        </div>
      </div>

      {isOwn && <AvatarCircle initials="YOU" bgColor="#4f46e5" />}
    </div>
  );
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const messageListRef = useRef(null);
  const threadRef = useRef(null);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchThread = async (messageId, channel) => {
    try {
      setThreadLoading(true);
      const response = await fetch(`/api/thread?id=${messageId}&channel=${channel}`);
      if (!response.ok) throw new Error('Failed to fetch thread');
      const data = await response.json();
      setThreadMessages(data.messages);
      setTimeout(() => threadRef.current?.scrollTo(0, threadRef.current.scrollHeight), 100);
    } catch (err) {
      console.error('Thread fetch error:', err);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    fetchThread(message.id, message.channel);
    if (messageListRef.current) {
      messageListRef.current.scrollTop = 0;
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage || sendingReply) return;

    setSendingReply(true);
    try {
      const response = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          channel: selectedMessage.channel,
          brand: selectedMessage.brand,
          to: selectedMessage.email,
          body: replyText,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      // Optimistic update
      const newMessage = {
        from: 'You',
        body: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setThreadMessages([...threadMessages, newMessage]);
      setReplyText('');

      // Refresh message list to update in UI
      await fetchMessages();
    } catch (err) {
      console.error('Send reply error:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Filter messages
  let filteredMessages = messages;

  if (selectedBrand) {
    filteredMessages = filteredMessages.filter(m => m.brand === selectedBrand);
  }

  if (selectedChannel) {
    filteredMessages = filteredMessages.filter(m => m.channel === selectedChannel);
  }

  if (unreadOnly) {
    filteredMessages = filteredMessages.filter(m => m.unread);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredMessages = filteredMessages.filter(m =>
      m.from.toLowerCase().includes(term) ||
      m.subject.toLowerCase().includes(term) ||
      m.preview.toLowerCase().includes(term)
    );
  }

  const unreadTotal = messages.filter(m => m.unread).length;
  const getUnreadByChannel = (channel) => messages.filter(m => m.channel === channel && m.unread).length;
  const getUnreadByBrand = (brand) => messages.filter(m => m.brand === brand && m.unread).length;

  const selectedBrandName = BRANDS.find(b => b.id === selectedMessage?.brand)?.name;
  const selectedChannelName = CHANNELS.find(c => c.id === selectedMessage?.channel)?.name;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* LEFT SIDEBAR */}
      <div style={{
        width: sidebarOpen ? '220px' : '60px',
        backgroundColor: '#1e1b4b',
        backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 300ms ease',
        borderRight: '1px solid #2d2a5f',
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {/* Logo Area */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #2d2a5f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} />
          </button>
          {sidebarOpen && (
            <span style={{ fontSize: '12px', fontWeight: '600', marginLeft: '8px', flex: 1 }}>
              The Fun Group
            </span>
          )}
        </div>

        {/* Brands List */}
        <div style={{ padding: '16px 8px', flex: 1, overflow: 'auto' }}>
          {/* All Brands */}
          <button
            onClick={() => {
              setSelectedBrand(null);
              setSelectedMessage(null);
            }}
            style={{
              width: '100%',
              padding: '12px 12px',
              backgroundColor: selectedBrand === null ? '#4f46e5' : 'transparent',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '12px',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'space-between' : 'center',
              transition: 'background-color 200ms',
            }}
            onMouseEnter={(e) => {
              if (selectedBrand !== null) e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.3)';
            }}
            onMouseLeave={(e) => {
              if (selectedBrand !== null) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>{sidebarOpen ? 'All Brands' : '★'}</span>
            {sidebarOpen && unreadTotal > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
              }}>
                {unreadTotal}
              </span>
            )}
          </button>

          {/* Individual Brands */}
          {BRANDS.map(brand => (
            <button
              key={brand.id}
              onClick={() => {
                setSelectedBrand(selectedBrand === brand.id ? null : brand.id);
                setSelectedMessage(null);
              }}
              style={{
                width: '100%',
                padding: '12px 12px',
                backgroundColor: selectedBrand === brand.id ? '#4f46e5' : 'transparent',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                gap: '8px',
                transition: 'background-color 200ms',
              }}
              onMouseEnter={(e) => {
                if (selectedBrand !== brand.id) e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.2)';
              }}
              onMouseLeave={(e) => {
                if (selectedBrand !== brand.id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: brand.color,
                flexShrink: 0,
              }} />
              {sidebarOpen && (
                <>
                  <span style={{ flex: 1, textAlign: 'left', fontSize: '12px' }}>{brand.name}</span>
                  {getUnreadByBrand(brand.id) > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}>
                      {getUnreadByBrand(brand.id)}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Bottom Actions */}
        <div style={{
          padding: '16px 8px',
          borderTop: '1px solid #2d2a5f',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <button style={{
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '12px',
            fontSize: '13px',
            transition: 'background-color 200ms',
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Bell size={16} />
            {sidebarOpen && 'Notifications'}
          </button>
          <button style={{
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '12px',
            fontSize: '13px',
            transition: 'background-color 200ms',
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Settings size={16} />
            {sidebarOpen && 'Settings'}
          </button>
          <button style={{
            padding: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            gap: '12px',
            fontSize: '13px',
            transition: 'background-color 200ms',
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <User size={16} />
            {sidebarOpen && 'Al Sanchez'}
          </button>
        </div>
      </div>

      {/* MIDDLE PANEL - Message List */}
      <div style={{
        width: selectedMessage ? '380px' : 'flex',
        flex: selectedMessage ? undefined : 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRight: selectedMessage ? '1px solid #e2e8f0' : 'none',
        transition: 'width 300ms ease',
      }}>
        {/* Search & Filters */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '8px 12px',
            gap: '8px',
          }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              style={{
                padding: '6px 12px',
                backgroundColor: unreadOnly ? '#4f46e5' : '#f1f5f9',
                color: unreadOnly ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                if (!unreadOnly) e.currentTarget.style.backgroundColor = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                if (!unreadOnly) e.currentTarget.style.backgroundColor = '#f1f5f9';
              }}
            >
              Unread
            </button>
            <button
              onClick={fetchMessages}
              disabled={loading && messages.length === 0}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>

          {/* Channel Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            <button
              onClick={() => setSelectedChannel(null)}
              style={{
                padding: '6px 12px',
                backgroundColor: selectedChannel === null ? '#4f46e5' : 'transparent',
                color: selectedChannel === null ? 'white' : '#64748b',
                border: selectedChannel === null ? 'none' : '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 200ms',
              }}
            >
              All Channels
            </button>
            {CHANNELS.map(channel => {
              const unreadCount = getUnreadByChannel(channel.id);
              const Icon = channel.icon;
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(selectedChannel === channel.id ? null : channel.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedChannel === channel.id ? '#4f46e5' : 'transparent',
                    color: selectedChannel === channel.id ? 'white' : '#64748b',
                    border: selectedChannel === channel.id ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 200ms',
                  }}
                >
                  <Icon size={14} />
                  {channel.name}
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: selectedChannel === channel.id ? 'rgba(255,255,255,0.3)' : '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Message List */}
        <div
          ref={messageListRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {loading && messages.length === 0 ? (
            <Spinner />
          ) : error && messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#ef4444',
            }}>
              <p style={{ marginBottom: '16px' }}>Error: {error}</p>
              <button
                onClick={fetchMessages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Retry
              </button>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: '#94a3b8',
            }}>
              <p>No messages found</p>
            </div>
          ) : (
            filteredMessages.map(message => (
              <MessageRow
                key={`${message.id}-${message.channel}`}
                message={message}
                isSelected={selectedMessage?.id === message.id}
                onClick={() => handleSelectMessage(message)}
              />
            ))
          )}
        </div>

        {/* Status Bar */}
        {!error && messages.length > 0 && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
          }}>
            {filteredMessages.length} messages
            {unreadTotal > 0 && ` • ${unreadTotal} unread`}
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Thread */}
      {selectedMessage && (
        <div style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
        }}>
          {/* Thread Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setThreadMessages([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {selectedMessage.from}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedMessage.email}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <ChannelBadge channel={selectedMessage.channel} />
              <BrandDot brand={selectedMessage.brand} />
              <button
                onClick={() => {
                  const updated = { ...selectedMessage, starred: !selectedMessage.starred };
                  setSelectedMessage(updated);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedMessage.starred ? '#f59e0b' : '#cbd5e1',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Star size={18} fill={selectedMessage.starred ? '#f59e0b' : 'none'} />
              </button>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Thread Messages */}
          <div
            ref={threadRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              minHeight: 0,
            }}
          >
            {threadLoading ? (
              <Spinner />
            ) : threadMessages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#94a3b8',
              }}>
                <Mail size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <p>No thread history</p>
              </div>
            ) : (
              threadMessages.map((msg, idx) => (
                <ThreadMessage
                  key={idx}
                  message={msg}
                  isOwn={msg.from === 'You'}
                />
              ))
            )}
          </div>

          {/* Reply Box */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
          }}>
            <div style={{
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              Replying via <ChannelBadge channel={selectedMessage.channel} /> as
              <span style={{
                backgroundColor: BRANDS.find(b => b.id === selectedMessage.brand)?.color,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
              }}>
                {selectedBrandName}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type your reply to ${selectedMessage.from}...`}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '100px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#4f46e5';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 200ms',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <Paperclip size={18} />
                </button>

                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: replyText.trim() ? '#4f46e5' : '#cbd5e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    if (replyText.trim()) e.currentTarget.style.backgroundColor = '#4338ca';
                  }}
                  onMouseLeave={(e) => {
                    if (replyText.trim()) e.currentTarget.style.backgroundColor = '#4f46e5';
                  }}
                >
                  {sendingReply ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no message selected */}
      {!selectedMessage && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}>
          <EmptyState />
        </div>
      )}
    </div>
  );
}
