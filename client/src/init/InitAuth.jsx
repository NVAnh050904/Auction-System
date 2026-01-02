import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "../store/auth/authSlice";
import LoadingScreen from "../components/LoadingScreen";
import socket from "../utils/socket.js";

const InitAuth = ({ children }) => {
  const dispatch = useDispatch();
  const { loading, user } = useSelector((state) => state.auth);
  const didRun = useRef(false);

  useEffect(() => {
    if (!didRun.current) {
      dispatch(checkAuth());
      didRun.current = true;
    }
  }, [dispatch]);

  // Connect socket after auth completes so the JWT cookie is available for the handshake
  useEffect(() => {
    if (!loading && user) {
      try { if (!socket.connected) socket.connect(); } catch (e) { console.warn('Socket connect failed:', e); }
    }
    if (!user) {
      try { if (socket.connected) socket.disconnect(); } catch (e) { /* ignore */ }
    }
  }, [loading, user]);

  if (loading && !didRun.current) return <LoadingScreen />;

  return children;
};

export default InitAuth;
