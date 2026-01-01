import axios from 'axios';
const VITE_AUCTION_API = import.meta.env.VITE_AUCTION_API;

export const getMessages = async ({ withUserId }) => {
  try {
    console.log('API getMessages with user:', withUserId);
    const res = await axios.get(`${VITE_AUCTION_API.replace('/api/auction','')}/messages`, {
      withCredentials: true,
      params: { withUserId }
    });
    console.log('API getMessages response length=', (res.data || []).length);
    return res.data;
  } catch (error) {
    console.log('Error getting messages', error.message);
  }
};

export const sendMessage = async ({ recipientId, text, auctionId = null }) => {
  try {
    console.log('API sendMessage', { recipientId, text: text?.slice(0,40), auctionId });
    const res = await axios.post(`${VITE_AUCTION_API.replace('/api/auction','')}/messages`,
      { auction: auctionId, recipientId, text },
      { withCredentials: true }
    );
    console.log('API sendMessage response id=', res.data?._id);
    return res.data;
  } catch (error) {
    console.log('Error sending message', error.message);
  }
};

export const markRead = async (id) => {
  try {
    console.log('API markRead', id);
    const res = await axios.patch(`${VITE_AUCTION_API.replace('/api/auction','')}/messages/${id}/read`, null, { withCredentials: true });
    return res.data;
  } catch (error) {
    console.log('Error marking read', error.message);
  }
};

export const getConversations = async (auctionId) => {
  try {
    console.log('API getConversations', auctionId);
    const res = await axios.get(`${VITE_AUCTION_API.replace('/api/auction','')}/messages/conversations`, {
      withCredentials: true,
      params: { auctionId }
    });
    console.log('API getConversations count=', (res.data || []).length);
    return res.data;
  } catch (error) {
    console.log('Error getting conversations', error.message);
  }
};



export const getMyConversations = async () => {
  try {
    console.log('API getMyConversations');
    const res = await axios.get(`${VITE_AUCTION_API.replace('/api/auction','')}/messages/my-conversations`, { withCredentials: true });
    console.log('API getMyConversations count=', (res.data || []).length);
    return res.data;
  } catch (error) {
    console.log('Error getting my conversations', error.message);
  }
};

export const getUnreadCount = async () => {
  try {
    console.log('API getUnreadCount');
    const res = await axios.get(`${VITE_AUCTION_API.replace('/api/auction','')}/messages/unread-count`, { withCredentials: true });
    console.log('API getUnreadCount res=', res.data);
    return res.data;
  } catch (error) {
    console.log('Error getting unread count', error.message);
  }
};