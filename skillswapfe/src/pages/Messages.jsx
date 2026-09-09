import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useLocation } from 'react-router-dom';

const WS_PORT = import.meta.env.VITE_WS_PORT || 4005;
const backendApiUrl = import.meta.env.VITE_BACKEND_API_URL;
let ws = null;

const Messages = () => {
  const [showNewMessagePing, setShowNewMessagePing] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null); 
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false); 
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState(null);

  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [readMessages, setReadMessages] = useState({});

  const observer = useRef(null);
  const location = useLocation();

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgIndex = entry.target.dataset.index;
            setReadMessages((prev) => ({
              ...prev,
              [selectedChatId]: {
                ...(prev[selectedChatId] || {}),
                [msgIndex]: true,
              },
            }));
          }
        });
      },
      { threshold: 1.0 }
    );
    return () => observer.current?.disconnect();
  }, [selectedChatId]);

  useEffect(() => {
    observer.current?.disconnect();
    const nodes = document.querySelectorAll('.msg');
    nodes.forEach((node) => observer.current?.observe(node));
  }, [messages, selectedChatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, selectedChatId]);

  useEffect(() => {
    if (!isAtBottom) {
      setShowNewMessagePing(true);
    } else {
      setShowNewMessagePing(false);
    }
  }, [messages]);

  useEffect(() => {
    setReadMessages((prev) => ({
      ...prev,
      [selectedChatId]: prev[selectedChatId] || {},
    }));
  }, [selectedChatId]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.user.id);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    fetch(`${backendApiUrl}/api/matches?userId=` + (() => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.user.id;
      } catch { return ''; }
    })(), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setChats(data.map(match => ({ id: match.id, name: match.username || match.name })));
      });
  }, []);

  useEffect(() => {
    if (selectedChatId === null) return;
    setLoading(true);
    const token = Cookies.get('token');
    if (!token) return;
    fetch(`${backendApiUrl}/api/messages/${selectedChatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        // Map DB messages to include 'from', and parse timestamps
        setMessages(prev => ({
          ...prev,
          [selectedChatId]: data.map(msg => ({
            from: msg.sender_id === userId ? 'me' : 'them',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : null,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            delivered_at: msg.delivered_at ? new Date(msg.delivered_at) : null,
            read_at: msg.read_at ? new Date(msg.read_at) : null,
            id: msg.id
          }))
        }));
        setLoading(false);
      });
  }, [selectedChatId, userId]);

  useEffect(() => {
    if (!selectedChatId) return;
    ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    const token = Cookies.get('token');
    let localUserId = userId;
    if (!localUserId && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localUserId = payload.user.id;
      } catch {}
    }
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'init', userId: localUserId, matchId: selectedChatId }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.matchId === selectedChatId) {
          setMessages(prev => ({
            ...prev,
            [selectedChatId]: [...(prev[selectedChatId] || []), {
              from: data.senderId === localUserId ? 'me' : 'them',
              content: data.content,
              timestamp: new Date(data.timestamp),
              senderId: data.senderId,
              receiverId: data.receiverId,
              delivered_at: data.delivered_at ? new Date(data.delivered_at) : null,
              read_at: data.read_at ? new Date(data.read_at) : null,
              id: data.id
            }]
          }));
        }
        if (data.type === 'read' && data.matchId === selectedChatId && data.messageId) {
          setMessages(prev => ({
            ...prev,
            [selectedChatId]: (prev[selectedChatId] || []).map(msg =>
              msg.id === data.messageId ? { ...msg, read_at: new Date(data.read_at) } : msg
            )
          }));
        }
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => {};
    return () => {
      ws && ws.close();
    };
  }, [selectedChatId, userId]);

  // Send read event when a message from 'them' becomes visible
  useEffect(() => {
    if (!selectedChatId || !ws || ws.readyState !== 1) return;
    const msgs = messages[selectedChatId] || [];
    msgs.forEach((msg, idx) => {
      if (msg.from === 'them' && !msg.read_at && readMessages[selectedChatId]?.[idx]) {
        ws.send(JSON.stringify({
          type: 'read',
          matchId: selectedChatId,
          messageId: msg.id
        }));
      }
    });
  }, [readMessages, selectedChatId, messages]);

  const handleSend = () => {
    if (!inputText.trim() || selectedChatId === null) return;
    const token = Cookies.get('token');
    let localUserId = userId;
    if (!localUserId && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localUserId = payload.user.id;
      } catch {}
    }
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: 'message',
        matchId: selectedChatId,
        senderId: localUserId,
        receiverId: null,
        content: inputText,
      }));
    }
    setInputText('');
  };

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const bottomThreshold = 100;
    const isBottom = node.scrollHeight - node.scrollTop - node.clientHeight < bottomThreshold;
    setIsAtBottom(isBottom);
  };

  const formatTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d)) return '';
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const msgs = selectedChatId !== null ? messages[selectedChatId] || [] : [];
  let lastDate = null;

  // Helper to get openMatchId from state or query string
  function getOpenMatchId() {
    if (location.state && location.state.openMatchId) return location.state.openMatchId;
    const params = new URLSearchParams(window.location.search);
    if (params.has('openMatchId')) return params.get('openMatchId');
    return null;
  }

  // Set selectedChatId on mount or when location changes
  useEffect(() => {
    const openMatchId = getOpenMatchId();
    if (openMatchId) setSelectedChatId(openMatchId);
  }, [location.state, location.search]);

  return (
    <Box display="flex" height="calc(100vh - 64px)" position="relative">
      {/* Chat List */}
      <Box width="250px" bgcolor="#1E1E1E" color="white" p={2}>
        <Typography variant="h6" sx={{ color: '#00FF9F', mb: 2 }}>
          Chats
        </Typography>
        <List>
          {chats.map((chat) => (
            <ListItem
              key={chat.id}
              component="button"
              onClick={() => setSelectedChatId(chat.id)}
              sx={{
                backgroundColor: selectedChatId === chat.id ? '#333' : 'transparent',
                color: selectedChatId === chat.id ? '#00FF9F' : 'white',
                borderColor: selectedChatId === chat.id ? '#00FF9F' : 'transparent',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#2a2a2a', borderColor: '#00FF9F' },
              }}
            >
              <ListItemText primary={chat.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat Window */}
      {showNewMessagePing && (
        <Box
          onClick={() => {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            setShowNewMessagePing(false);
          }}
          sx={{
            position: 'absolute',
            bottom: 60,
            right: 20,
            bgcolor: '#00FF9F',
            color: 'black',
            px: 2,
            py: 1,
            borderRadius: 2,
            cursor: 'pointer',
            zIndex: 11,
            fontWeight: 'bold',
          }}
        >
          New Messages
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        {selectedChatId === null ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'gray',
              fontSize: '1.2rem',
            }}
          >
            Select a chat to start messaging
          </Box>
        )
         : (
          <>
            {}
            <Box
              ref={scrollRef}
              onScroll={handleScroll}
              sx={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                '&::-webkit-scrollbar': { width: '8px' },
                '&::-webkit-scrollbar-track': { backgroundColor: '#1E1E1E' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#00FF9F', borderRadius: '4px' },
                scrollbarWidth: 'thin',
                scrollbarColor: '#00FF9F #1E1E1E',
              }}
            >
              {msgs.map((msg, index) => {
                // Defensive: ensure msg.timestamp is a Date object
                let dateObj = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
                const msgDate = !isNaN(dateObj) ? dateObj.toLocaleDateString() : '';
                const showDateSeparator = lastDate !== msgDate;
                lastDate = msgDate;

                return (
                  <React.Fragment key={index}>
                    {showDateSeparator && (
                      <Box
                        sx={{
                          alignSelf: 'center',
                          bgcolor: 'gray',
                          color: 'black',
                          px: 2,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          mb: 1,
                        }}
                      >
                        {msgDate}
                      </Box>
                    )}
                    <Box
                      className="msg"
                      data-index={index}
                      sx={{
                        alignSelf: msg.from === 'me' ? 'flex-end' : 'flex-start',
                        bgcolor: msg.from === 'me' ? '#00FF9F' : '#333',
                        color: msg.from === 'me' ? 'black' : 'white',
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        maxWidth: '70%',
                        position: 'relative',
                      }}
                    >
                      <Typography>{msg.content}</Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.65rem',
                            color: msg.from === 'me'
                              ? (msg.read_at ? 'blue' : 'rgba(0,0,0,0.6)')
                              : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {msg.from === 'me' && (
                            msg.read_at
                              ? <span style={{ color: 'blue' }}>✓✓</span>
                              : msg.delivered_at
                                ? '✓✓'
                                : '✓'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </React.Fragment>
                );
              })}
            </Box>

            {}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                sx={{
                  bgcolor: 'white',
                  borderRadius: 1,
                }}
                disabled={loading}
              />

              <IconButton
                onClick={handleSend}
                sx={{
                  color: '#00FF9F',
                  bgcolor: 'black',
                  borderRadius: 0,
                  width: 45,
                  height: 45,
                }}
                disabled={loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Messages;
