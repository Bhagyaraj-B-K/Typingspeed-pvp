import { useGame } from './hooks/useGame';
import Doodles from './components/Doodles';
import LandingScreen from './components/LandingScreen';
import RoomScreen from './components/RoomScreen';
import Toast from './components/Toast';

export default function App() {
  const game = useGame();

  return (
    <div className="app">
      <Doodles />
      <Toast toast={game.toast} onDismiss={game.dismissToast} />
      <main className="app-main">
        {game.screen === 'landing' ? (
          <LandingScreen
            onCreate={game.createRoom}
            onJoin={game.joinRoom}
            formError={game.formError}
            pendingAction={game.pendingAction}
            connectionStatus={game.connectionStatus}
          />
        ) : (
          <RoomScreen {...game} />
        )}
      </main>
    </div>
  );
}
