import AppRoutes from './routes/AppRoutes';
import socket from './sockets/socketClient';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

function App() {
  const { user, token } = useSelector(s => s.auth);

  useEffect(() => {
    if (token && user?._id) {
      socket.emit('joinNotifications', user._id);
    }
  }, [token, user?._id]);
  return <AppRoutes />;
}

export default App;
