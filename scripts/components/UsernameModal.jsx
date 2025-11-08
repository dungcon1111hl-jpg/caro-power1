// Username Modal Component
window.UsernameModal = function({ onSubmit }) {
  const { useState } = React;
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length > 1) onSubmit(name.trim());
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="glass-card p-6 w-full max-w-md shadow-2xl">
        <div className="text-xl font-bold text-white mb-3 text-center">Welcome!</div>
        <div className="text-sm text-slate-300 mb-4 text-center">Please enter your name to get started.</div>
        <input
          type="text"
          className="w-full bg-slate-900/50 ring-1 ring-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-caro-green"
          placeholder="Player Name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <button
          type="submit"
          className="w-full neon-button mt-4"
          disabled={name.trim().length < 2}
        >
          Confirm
        </button>
      </form>
    </div>
  );
};