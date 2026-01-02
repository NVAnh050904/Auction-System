import React, { useEffect, useState, useRef } from 'react';
import socket from '../../utils/socket.js';
import { useSelector } from 'react-redux';
import { MdSend, MdLogout } from 'react-icons/md';
import ChatPage from '../Chat';

const API_URL = import.meta.env.VITE_API || 'http://localhost:4000';

export default function AdminMessages() {
  // Unified chat: admin should use the same Chat UI as normal users
  return <ChatPage />;
}
