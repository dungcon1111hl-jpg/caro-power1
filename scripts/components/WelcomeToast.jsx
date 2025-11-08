// Welcome Toast Component
window.WelcomeToast = function({ username }) {
  return (
    <div className="welcome-toast">
      Welcome, <b>{username}</b>! 🎮
    </div>
  );
};